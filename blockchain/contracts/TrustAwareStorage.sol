// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract TrustAwareStorage {
    
    // ============ STRUCTS ============
    
    struct FileMetadata {
        string fileHash;           // SHA-256 hash of original file
        address owner;             // File owner's wallet address
        uint256 timestamp;         // Upload timestamp
        uint256 fileSize;          // Original file size in bytes
        string fileName;           // Original filename
        bool exists;               // File existence flag
        uint256[] fragmentIds;     // Array of fragment IDs
    }
    
    struct Fragment {
        uint256 fragmentId;        // Unique fragment identifier
        string fragmentHash;       // Hash of this fragment
        address[] storageNodes;    // Nodes storing this fragment
        uint256 size;              // Fragment size in bytes
        bool exists;               // Fragment existence flag
    }
    
    struct StorageNode {
        address nodeAddress;       // Node's wallet address
        uint256 trustScore;        // Trust score (0-100)
        uint256 totalStored;       // Total fragments stored
        uint256 successfulRetrievals; // Successful retrievals count
        uint256 failedRetrievals;  // Failed retrievals count
        bool isActive;             // Node active status
        uint256 lastActivity;      // Last activity timestamp
    }
    
    struct AccessPermission {
        address grantedBy;         // Who granted the permission
        uint256 grantedAt;         // When permission was granted
        bool isActive;             // Permission status
    }
    
    // ============ STATE VARIABLES ============
    
    mapping(string => FileMetadata) public files;           // fileHash => FileMetadata
    mapping(uint256 => Fragment) public fragments;          // fragmentId => Fragment
    mapping(address => StorageNode) public storageNodes;    // nodeAddress => StorageNode
    mapping(string => mapping(address => AccessPermission)) public filePermissions; // fileHash => userAddress => Permission
    
    address[] public nodeAddresses;                         // Array of all node addresses
    uint256 public nextFragmentId = 1;                      // Auto-incrementing fragment ID
    
    // ============ EVENTS ============
    
    event FileUploaded(string indexed fileHash, address indexed owner, string fileName, uint256 timestamp);
    event AccessGranted(string indexed fileHash, address indexed owner, address indexed grantedTo);
    event AccessRevoked(string indexed fileHash, address indexed owner, address indexed revokedFrom);
    event NodeRegistered(address indexed nodeAddress, uint256 initialTrustScore);
    event TrustScoreUpdated(address indexed nodeAddress, uint256 oldScore, uint256 newScore);
    event FragmentStored(uint256 indexed fragmentId, address indexed nodeAddress, string fragmentHash);
    event FileAccessed(string indexed fileHash, address indexed accessor, uint256 timestamp);
    
    // ============ MODIFIERS ============
    
    modifier onlyFileOwner(string memory fileHash) {
        require(files[fileHash].exists, "File does not exist");
        require(files[fileHash].owner == msg.sender, "Only file owner can perform this action");
        _;
    }
    
    modifier fileExists(string memory fileHash) {
        require(files[fileHash].exists, "File does not exist");
        _;
    }
    
    modifier hasAccess(string memory fileHash) {
        require(files[fileHash].exists, "File does not exist");
        require(
            files[fileHash].owner == msg.sender || 
            filePermissions[fileHash][msg.sender].isActive,
            "Access denied"
        );
        _;
    }
    
    // ============ CORE FUNCTIONS ============
    
    /**
     * @dev Register a file's metadata on the blockchain
     * @param fileHash SHA-256 hash of the original file
     * @param fileName Original filename
     * @param fileSize Original file size in bytes
     * @param fragmentHashes Array of fragment hashes
     * @param fragmentSizes Array of fragment sizes
     */
    function registerFile(
        string memory fileHash,
        string memory fileName,
        uint256 fileSize,
        string[] memory fragmentHashes,
        uint256[] memory fragmentSizes
    ) external {
        require(!files[fileHash].exists, "File already exists");
        require(fragmentHashes.length == fragmentSizes.length, "Fragment arrays length mismatch");
        require(fragmentHashes.length > 0, "At least one fragment required");
        
        // Create file metadata
        files[fileHash] = FileMetadata({
            fileHash: fileHash,
            owner: msg.sender,
            timestamp: block.timestamp,
            fileSize: fileSize,
            fileName: fileName,
            exists: true,
            fragmentIds: new uint256[](fragmentHashes.length)
        });
        
        // Register fragments
        for (uint256 i = 0; i < fragmentHashes.length; i++) {
            uint256 fragmentId = nextFragmentId++;
            
            fragments[fragmentId] = Fragment({
                fragmentId: fragmentId,
                fragmentHash: fragmentHashes[i],
                storageNodes: new address[](0),
                size: fragmentSizes[i],
                exists: true
            });
            
            files[fileHash].fragmentIds[i] = fragmentId;
            
            // Assign fragment to trusted nodes
            _assignFragmentToNodes(fragmentId);
        }
        
        emit FileUploaded(fileHash, msg.sender, fileName, block.timestamp);
    }
    
    /**
     * @dev Grant access to a file for another user
     * @param fileHash Hash of the file
     * @param userAddress Address to grant access to
     */
    function grantAccess(string memory fileHash, address userAddress) 
        external 
        onlyFileOwner(fileHash) 
    {
        require(userAddress != address(0), "Invalid user address");
        require(userAddress != msg.sender, "Cannot grant access to yourself");
        require(!filePermissions[fileHash][userAddress].isActive, "Access already granted");
        
        filePermissions[fileHash][userAddress] = AccessPermission({
            grantedBy: msg.sender,
            grantedAt: block.timestamp,
            isActive: true
        });
        
        emit AccessGranted(fileHash, msg.sender, userAddress);
    }
    
    /**
     * @dev Revoke access to a file from a user
     * @param fileHash Hash of the file
     * @param userAddress Address to revoke access from
     */
    function revokeAccess(string memory fileHash, address userAddress) 
        external 
        onlyFileOwner(fileHash) 
    {
        require(filePermissions[fileHash][userAddress].isActive, "Access not granted");
        
        filePermissions[fileHash][userAddress].isActive = false;
        
        emit AccessRevoked(fileHash, msg.sender, userAddress);
    }
    
    /**
     * @dev Register a new storage node
     * @param nodeAddress Address of the storage node
     * @param initialTrustScore Initial trust score (0-100)
     */
    function registerStorageNode(address nodeAddress, uint256 initialTrustScore) external {
        require(nodeAddress != address(0), "Invalid node address");
        require(initialTrustScore <= 100, "Trust score must be <= 100");
        require(!storageNodes[nodeAddress].isActive, "Node already registered");
        
        storageNodes[nodeAddress] = StorageNode({
            nodeAddress: nodeAddress,
            trustScore: initialTrustScore,
            totalStored: 0,
            successfulRetrievals: 0,
            failedRetrievals: 0,
            isActive: true,
            lastActivity: block.timestamp
        });
        
        nodeAddresses.push(nodeAddress);
        
        emit NodeRegistered(nodeAddress, initialTrustScore);
    }
    
    /**
     * @dev Update trust score of a storage node
     * @param nodeAddress Address of the storage node
     * @param newTrustScore New trust score (0-100)
     */
    function updateTrustScore(address nodeAddress, uint256 newTrustScore) external {
        require(storageNodes[nodeAddress].isActive, "Node not registered");
        require(newTrustScore <= 100, "Trust score must be <= 100");
        
        uint256 oldScore = storageNodes[nodeAddress].trustScore;
        storageNodes[nodeAddress].trustScore = newTrustScore;
        storageNodes[nodeAddress].lastActivity = block.timestamp;
        
        emit TrustScoreUpdated(nodeAddress, oldScore, newTrustScore);
    }
    
    /**
     * @dev Record file access for audit purposes
     * @param fileHash Hash of the accessed file
     */
    function recordFileAccess(string memory fileHash) 
        external 
        hasAccess(fileHash) 
    {
        emit FileAccessed(fileHash, msg.sender, block.timestamp);
    }
    
    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Get file metadata
     * @param fileHash Hash of the file
     */
    function getFileMetadata(string memory fileHash) 
        external 
        view 
        returns (FileMetadata memory) 
    {
        require(files[fileHash].exists, "File does not exist");
        return files[fileHash];
    }
    
    /**
     * @dev Get fragment information
     * @param fragmentId ID of the fragment
     */
    function getFragment(uint256 fragmentId) 
        external 
        view 
        returns (Fragment memory) 
    {
        require(fragments[fragmentId].exists, "Fragment does not exist");
        return fragments[fragmentId];
    }
    
    /**
     * @dev Check if user has access to a file
     * @param fileHash Hash of the file
     * @param userAddress Address to check
     */
    function hasFileAccess(string memory fileHash, address userAddress) 
        external 
        view 
        returns (bool) 
    {
        if (!files[fileHash].exists) return false;
        return files[fileHash].owner == userAddress || 
               filePermissions[fileHash][userAddress].isActive;
    }
    
    /**
     * @dev Get all trusted storage nodes (trust score >= 70)
     */
    function getTrustedNodes() external view returns (address[] memory) {
        uint256 trustedCount = 0;
        
        // Count trusted nodes
        for (uint256 i = 0; i < nodeAddresses.length; i++) {
            if (storageNodes[nodeAddresses[i]].isActive && 
                storageNodes[nodeAddresses[i]].trustScore >= 70) {
                trustedCount++;
            }
        }
        
        // Create array of trusted nodes
        address[] memory trustedNodes = new address[](trustedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < nodeAddresses.length; i++) {
            if (storageNodes[nodeAddresses[i]].isActive && 
                storageNodes[nodeAddresses[i]].trustScore >= 70) {
                trustedNodes[index] = nodeAddresses[i];
                index++;
            }
        }
        
        return trustedNodes;
    }
    
    /**
     * @dev Get all storage nodes (including those with trust score < 70)
     */
    function getAllStorageNodes() external view returns (address[] memory) {
        return nodeAddresses;
    }
    
    /**
     * @dev Get all files owned by a user
     * @param owner Address of the file owner
     */
    function getUserFiles(address owner) external view returns (string[] memory) {
        // This is a simplified version - in production, you'd use a mapping to track user files
        // For demo purposes, we'll return empty array and handle this in frontend
        return new string[](0);
    }
    
    // ============ INTERNAL FUNCTIONS ============
    
    /**
     * @dev Assign a fragment to trusted storage nodes
     * @param fragmentId ID of the fragment to assign
     */
    function _assignFragmentToNodes(uint256 fragmentId) internal {
        address[] memory trustedNodes = this.getTrustedNodes();
        
        // Assign to up to 3 trusted nodes for redundancy
        uint256 assignCount = trustedNodes.length > 3 ? 3 : trustedNodes.length;
        
        for (uint256 i = 0; i < assignCount; i++) {
            fragments[fragmentId].storageNodes.push(trustedNodes[i]);
            storageNodes[trustedNodes[i]].totalStored++;
            
            emit FragmentStored(fragmentId, trustedNodes[i], fragments[fragmentId].fragmentHash);
        }
    }
}