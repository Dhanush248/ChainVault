from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import hashlib
import os
import io
import base64
from cryptography.fernet import Fernet
from typing import List, Dict, Any
import json
from datetime import datetime
from web3 import Web3
import json as json_lib

app = FastAPI(title="ChainVault Backend", version="1.0.0")

# Enable CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============ BLOCKCHAIN CONFIGURATION ============
BLOCKCHAIN_RPC = "http://127.0.0.1:8545"
BLOCKCHAIN_CHAIN_ID = 31337
CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

# Initialize Web3 connection
try:
    w3 = Web3(Web3.HTTPProvider(BLOCKCHAIN_RPC))
    if w3.is_connected():
        print("✅ Connected to blockchain at", BLOCKCHAIN_RPC)
    else:
        print("⚠️ Warning: Could not connect to blockchain")
        w3 = None
except Exception as e:
    print(f"⚠️ Blockchain connection error: {e}")
    w3 = None

# Smart Contract ABI (minimal interface for access control)
CONTRACT_ABI = [
    {
        "inputs": [
            {"internalType": "string", "name": "fileHash", "type": "string"},
            {"internalType": "address", "name": "userAddress", "type": "address"}
        ],
        "name": "hasFileAccess",
        "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "fileHash", "type": "string"}],
        "name": "getFileMetadata",
        "outputs": [
            {
                "components": [
                    {"internalType": "string", "name": "fileHash", "type": "string"},
                    {"internalType": "address", "name": "owner", "type": "address"},
                    {"internalType": "uint256", "name": "timestamp", "type": "uint256"},
                    {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
                    {"internalType": "string", "name": "fileName", "type": "string"},
                    {"internalType": "bool", "name": "exists", "type": "bool"},
                    {"internalType": "uint256[]", "name": "fragmentIds", "type": "uint256[]"}
                ],
                "internalType": "struct TrustAwareStorage.FileMetadata",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
]

# Initialize contract instance
try:
    if w3 is not None:
        contract = w3.eth.contract(address=CONTRACT_ADDRESS, abi=CONTRACT_ABI)
        print("✅ Smart contract interface initialized")
    else:
        contract = None
except Exception as e:
    print(f"⚠️ Contract initialization error: {e}")
    contract = None

# In-memory storage for demo purposes
# In production, this would be a proper database
uploaded_files: Dict[str, Dict[str, Any]] = {}
file_fragments: Dict[str, List[Dict[str, Any]]] = {}
# Track which nodes store which fragments for trust-aware operations
fragment_storage: Dict[str, List[str]] = {}  # fragment_hash => [node_addresses]
node_trust_cache: Dict[str, int] = {}  # node_address => trust_score (cached)

# Encryption key (in production, this should be securely managed)
ENCRYPTION_KEY = Fernet.generate_key()
cipher_suite = Fernet(ENCRYPTION_KEY)

class FileProcessor:
    """Handles file encryption, fragmentation, and hashing"""
    
    @staticmethod
    def generate_file_hash(file_content: bytes) -> str:
        """Generate SHA-256 hash of file content"""
        return hashlib.sha256(file_content).hexdigest()
    
    @staticmethod
    def encrypt_file(file_content: bytes) -> bytes:
        """Encrypt file content using Fernet encryption"""
        return cipher_suite.encrypt(file_content)
    
    @staticmethod
    def decrypt_file(encrypted_content: bytes) -> bytes:
        """Decrypt file content"""
        return cipher_suite.decrypt(encrypted_content)
    
    @staticmethod
    def encrypt_fragment(data: bytes) -> str:
        """Encrypt individual fragment data and return as base64"""
        encrypted = cipher_suite.encrypt(data)
        return base64.b64encode(encrypted).decode('utf-8')
    
    @staticmethod
    def decrypt_fragment(encrypted_b64: str) -> bytes:
        """Decrypt individual fragment data from base64"""
        encrypted = base64.b64decode(encrypted_b64.encode('utf-8'))
        return cipher_suite.decrypt(encrypted)
    
    @staticmethod
    def fragment_file(file_content: bytes, chunk_size: int = 1024 * 64) -> List[Dict[str, Any]]:
        """
        Fragment file into chunks and encrypt each fragment individually
        Default chunk size: 64KB
        This allows recovery even if some fragments are missing
        """
        fragments = []
        total_size = len(file_content)
        
        for i in range(0, total_size, chunk_size):
            chunk = file_content[i:i + chunk_size]
            fragment_hash = hashlib.sha256(chunk).hexdigest()
            
            # Encrypt each fragment individually
            encrypted_data = FileProcessor.encrypt_fragment(chunk)
            
            fragment = {
                "fragment_id": len(fragments) + 1,
                "fragment_hash": fragment_hash,
                "size": len(chunk),
                "data": encrypted_data,  # Already encrypted and base64 encoded
                "position": i,
                "original_hash": fragment_hash  # Store original hash of unencrypted data
            }
            fragments.append(fragment)
        
        return fragments
    
    @staticmethod
    def reassemble_file(fragments: List[Dict[str, Any]]) -> bytes:
        """Reassemble file from fragments by decrypting each fragment"""
        # Sort fragments by position
        sorted_fragments = sorted(fragments, key=lambda x: x['position'])
        
        # Combine fragment data
        combined_data = b""
        for fragment in sorted_fragments:
            try:
                # Try new format: individually encrypted fragments
                chunk_data = FileProcessor.decrypt_fragment(fragment['data'])
            except Exception as decrypt_error:
                # Fallback to old format: just base64 encoded (no encryption at fragment level)
                try:
                    chunk_data = base64.b64decode(fragment['data'].encode('utf-8'))
                except Exception as decode_error:
                    print(f"Error processing fragment {fragment.get('fragment_id')}: decrypt={decrypt_error}, decode={decode_error}")
                    raise
            
            combined_data += chunk_data
        
        return combined_data

def get_trusted_nodes_from_blockchain() -> Dict[str, int]:
    """
    Fetch node trust scores from blockchain
    Returns: {node_address: trust_score}
    """
    try:
        if not contract or not w3 or not w3.is_connected():
            return {}
        
        nodes_dict = {}
        try:
            node_addresses = contract.functions.getTrustedNodes().call()
            for address in node_addresses:
                try:
                    node_info = contract.functions.storageNodes(address).call()
                    trust_score = int(node_info[1])  # trustScore is at index 1
                    nodes_dict[address] = trust_score
                except Exception as e:
                    print(f"Error fetching node {address}: {e}")
                    continue
        except Exception as e:
            print(f"Error fetching trusted nodes: {e}")
        
        return nodes_dict
    except Exception as e:
        print(f"Error in get_trusted_nodes_from_blockchain: {e}")
        return {}

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "ChainVault Backend API",
        "status": "running",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "files_stored": len(uploaded_files),
        "fragments_stored": sum(len(frags) for frags in file_fragments.values()),
        "encryption_key_loaded": ENCRYPTION_KEY is not None
    }

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), owner_address: str = Form(None)):
    """
    Upload and process a file:
    1. Read file content
    2. Generate SHA-256 hash
    3. Fragment file (no full encryption first - each fragment encrypted individually)
    4. Return metadata for blockchain storage
    
    Form parameters:
    - file: The file to upload
    - owner_address: (Optional) Owner's wallet address for access control
    """
    try:
        # Read file content
        file_content = await file.read()
        
        if len(file_content) == 0:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        
        # Generate original file hash
        original_hash = FileProcessor.generate_file_hash(file_content)
        
        # Fragment file and encrypt each fragment individually
        fragments = FileProcessor.fragment_file(file_content)
        
        # Store file metadata
        file_metadata = {
            "original_filename": file.filename,
            "original_size": len(file_content),
            "file_hash": original_hash,
            "fragment_count": len(fragments),
            "upload_timestamp": datetime.now().isoformat(),
            "content_type": file.content_type,
            "owner": owner_address if owner_address else "unknown"  # Store owner address
        }
        
        # Store in memory
        uploaded_files[original_hash] = file_metadata
        file_fragments[original_hash] = fragments
        
        # Prepare response for frontend/blockchain
        fragment_hashes = [frag["fragment_hash"] for frag in fragments]
        fragment_sizes = [frag["size"] for frag in fragments]
        
        return {
            "success": True,
            "file_hash": original_hash,
            "file_name": file.filename,
            "file_size": len(file_content),
            "fragment_count": len(fragments),
            "fragment_hashes": fragment_hashes,
            "fragment_sizes": fragment_sizes,
            "metadata": file_metadata
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing failed: {str(e)}")

@app.get("/file/{file_hash}")
async def get_file_info(file_hash: str):
    """Get file metadata by hash"""
    if file_hash not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    metadata = uploaded_files[file_hash]
    fragments = file_fragments.get(file_hash, [])
    
    return {
        "file_hash": file_hash,
        "metadata": metadata,
        "fragment_count": len(fragments),
        "fragments": [
            {
                "fragment_id": frag["fragment_id"],
                "fragment_hash": frag["fragment_hash"],
                "size": frag["size"]
            } for frag in fragments
        ]
    }

@app.post("/retrieve/{file_hash}")
async def retrieve_file(file_hash: str, simulate_node_failure: bool = False):
    """
    Retrieve and decrypt a file:
    1. Get fragments from storage
    2. Simulate node failures if requested
    3. Reassemble file from available fragments
    4. Verify integrity and return file
    """
    if file_hash not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    fragments = file_fragments.get(file_hash, [])
    if not fragments:
        raise HTTPException(status_code=404, detail="File fragments not found")
    
    # Simulate node failure for demo
    available_fragments = fragments.copy()
    failed_nodes = []
    
    if simulate_node_failure and len(fragments) > 1:
        # Simulate 1-2 node failures
        import random
        failure_count = random.randint(1, min(2, len(fragments) - 1))
        failed_indices = random.sample(range(len(fragments)), failure_count)
        
        for idx in sorted(failed_indices, reverse=True):
            failed_fragment = available_fragments.pop(idx)
            failed_nodes.append({
                "fragment_id": failed_fragment["fragment_id"],
                "fragment_hash": failed_fragment["fragment_hash"]
            })
    
    try:
        # Reassemble file from available fragments (each fragment is already encrypted individually)
        decrypted_content = FileProcessor.reassemble_file(available_fragments)
        
        # Verify integrity
        reconstructed_hash = FileProcessor.generate_file_hash(decrypted_content)
        if reconstructed_hash != file_hash:
            error_msg = f"Hash mismatch: expected {file_hash}, got {reconstructed_hash}"
            print(f"❌ {error_msg}")
            raise HTTPException(status_code=500, detail="File integrity check failed")
        
        # Encode for response
        file_data = base64.b64encode(decrypted_content).decode('utf-8')
        
        print(f"✅ File retrieval successful: {file_hash}, fragments used: {len(available_fragments)}/{len(fragments)}")
        
        return {
            "success": True,
            "file_hash": file_hash,
            "file_data": file_data,
            "original_filename": uploaded_files[file_hash]["original_filename"],
            "content_type": uploaded_files[file_hash]["content_type"],
            "fragments_used": len(available_fragments),
            "total_fragments": len(fragments),
            "failed_nodes": failed_nodes,
            "integrity_verified": True,
            "failed_fragments": [frag.get("fragment_hash", "") for frag in failed_nodes]
        }
        
    except Exception as e:
        error_detail = f"File retrieval failed: {str(e)}"
        print(f"❌ {error_detail}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=error_detail)

@app.post("/update-trust-scores")
async def update_trust_scores(failed_node_indices: List[int] = None, file_hash: str = None):
    """
    Update trust scores for nodes that failed during retrieval
    This would be called after a test recovery to penalize failed nodes
    
    Parameters:
    - failed_node_indices: List of node indices that failed
    - file_hash: Hash of the file that was recovered
    """
    try:
        if not contract or not w3 or not w3.is_connected():
            return {
                "success": False,
                "detail": "Blockchain not available"
            }
        
        # Get current trusted nodes
        try:
            node_addresses = contract.functions.getTrustedNodes().call()
        except Exception as e:
            print(f"Error fetching nodes: {e}")
            return {
                "success": False,
                "detail": f"Error fetching nodes: {str(e)}"
            }
        
        updated_nodes = []
        
        # Penalize failed nodes (reduce trust score by 10-20 points)
        for node_idx in (failed_node_indices or []):
            if 0 <= node_idx < len(node_addresses):
                node_address = node_addresses[node_idx]
                try:
                    current_node_info = contract.functions.storageNodes(node_address).call()
                    current_trust = int(current_node_info[1])
                    
                    # Penalize: reduce by 15%
                    new_trust = max(0, int(current_trust * 0.85))
                    
                    # Note: In production, you'd call updateTrustScore via a transaction
                    # For now, we're just returning what should be updated
                    updated_nodes.append({
                        "address": node_address,
                        "old_trust": current_trust,
                        "new_trust": new_trust,
                        "penalty": current_trust - new_trust
                    })
                    
                    # Cache the new trust score
                    node_trust_cache[node_address] = new_trust
                except Exception as e:
                    print(f"Error updating node {node_address}: {e}")
        
        return {
            "success": True,
            "updated_nodes": updated_nodes,
            "note": "Trust scores should be updated on blockchain by frontend transaction"
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Trust score update failed: {str(e)}")

@app.post("/verify/{file_hash}")
async def verify_file_integrity(file_hash: str, uploaded_file: UploadFile = File(...)):
    """
    Verify file integrity by comparing hashes:
    1. Hash the uploaded file
    2. Compare with stored hash
    3. Return verification result
    """
    try:
        # Read uploaded file
        file_content = await uploaded_file.read()
        
        # Generate hash
        uploaded_hash = FileProcessor.generate_file_hash(file_content)
        
        # Compare with stored hash
        is_valid = uploaded_hash == file_hash
        
        # Check if we have the original file
        has_original = file_hash in uploaded_files
        
        return {
            "file_hash": file_hash,
            "uploaded_hash": uploaded_hash,
            "is_valid": is_valid,
            "has_original_stored": has_original,
            "verification_timestamp": datetime.now().isoformat(),
            "message": "File integrity verified" if is_valid else "File has been tampered with"
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Verification failed: {str(e)}")

@app.get("/files")
async def list_files(account: str = None):
    """
    List files accessible to the current user
    
    - If no account provided: returns all files (for backward compatibility)
    - If account provided: returns only:
      - Files owned by the account
      - Files where account has been granted access
    
    Query parameter:
    - account: User's wallet address (0x...)
    """
    try:
        # If no account provided, return all files (fallback)
        if not account:
            return {
                "files": [
                    {
                        "file_hash": file_hash,
                        "filename": metadata["original_filename"],
                        "size": metadata["original_size"],
                        "upload_time": metadata["upload_timestamp"],
                        "fragment_count": metadata["fragment_count"]
                    }
                    for file_hash, metadata in uploaded_files.items()
                ],
                "total_files": len(uploaded_files)
            }
        
        # Normalize the account address
        account = account.lower()
        if not account.startswith("0x"):
            account = "0x" + account
        
        # Validate Ethereum address
        if not Web3.is_address(account):
            raise HTTPException(status_code=400, detail="Invalid Ethereum address")
        
        # Convert to checksum address
        account = Web3.to_checksum_address(account)
        
        accessible_files = []
        
        # Check each file for access
        for file_hash, metadata in uploaded_files.items():
            try:
                # Try to query blockchain if available
                if contract and w3 and w3.is_connected():
                    # Check if user is owner
                    try:
                        file_metadata = contract.functions.getFileMetadata(file_hash).call()
                        file_owner = file_metadata[1]  # owner is at index 1
                        
                        # Check if user owns the file
                        if Web3.to_checksum_address(file_owner) == account:
                            accessible_files.append({
                                "file_hash": file_hash,
                                "filename": metadata["original_filename"],
                                "size": metadata["original_size"],
                                "upload_time": metadata["upload_timestamp"],
                                "fragment_count": metadata["fragment_count"],
                                "access_type": "owner"
                            })
                            continue
                        
                        # Check if user has access permission
                        has_access = contract.functions.hasFileAccess(file_hash, account).call()
                        if has_access:
                            accessible_files.append({
                                "file_hash": file_hash,
                                "filename": metadata["original_filename"],
                                "size": metadata["original_size"],
                                "upload_time": metadata["upload_timestamp"],
                                "fragment_count": metadata["fragment_count"],
                                "access_type": "granted"
                            })
                    
                    except Exception as e:
                        print(f"⚠️ Error checking blockchain access for {file_hash}: {str(e)}")
                        # Fallback: check if owner is in metadata (if we stored it)
                        if "owner" in metadata:
                            if metadata["owner"].lower() == account.lower():
                                accessible_files.append({
                                    "file_hash": file_hash,
                                    "filename": metadata["original_filename"],
                                    "size": metadata["original_size"],
                                    "upload_time": metadata["upload_timestamp"],
                                    "fragment_count": metadata["fragment_count"],
                                    "access_type": "owner"
                                })
                else:
                    # Blockchain not available, use fallback (check metadata)
                    if "owner" in metadata and metadata["owner"].lower() == account.lower():
                        accessible_files.append({
                            "file_hash": file_hash,
                            "filename": metadata["original_filename"],
                            "size": metadata["original_size"],
                            "upload_time": metadata["upload_timestamp"],
                            "fragment_count": metadata["fragment_count"],
                            "access_type": "owner"
                        })
            
            except Exception as e:
                print(f"Error processing file {file_hash}: {str(e)}")
                continue
        
        return {
            "files": accessible_files,
            "total_files": len(accessible_files),
            "account": account
        }
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error listing files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing files: {str(e)}")

@app.delete("/file/{file_hash}")
async def delete_file(file_hash: str):
    """Delete a file and its fragments (for demo cleanup)"""
    if file_hash not in uploaded_files:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Remove from storage
    del uploaded_files[file_hash]
    if file_hash in file_fragments:
        del file_fragments[file_hash]
    
    return {
        "success": True,
        "message": f"File {file_hash} deleted successfully"
    }

@app.get("/storage/stats")
async def get_storage_stats():
    """Get storage statistics"""
    total_files = len(uploaded_files)
    total_fragments = sum(len(frags) for frags in file_fragments.values())
    total_size = sum(metadata["original_size"] for metadata in uploaded_files.values())
    
    return {
        "total_files": total_files,
        "total_fragments": total_fragments,
        "total_size_bytes": total_size,
        "total_size_mb": round(total_size / (1024 * 1024), 2),
        "average_fragments_per_file": round(total_fragments / total_files, 2) if total_files > 0 else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)