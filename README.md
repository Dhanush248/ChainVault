# 🔗 ChainVault - Trust-Aware Decentralized Data Storage Framework

A complete blockchain-based file storage system with trust management, encryption, and decentralized architecture.

## 🎯 Project Overview

ChainVault is a **Trust-Aware Decentralized Data Storage and Retrieval System** that combines blockchain technology with advanced file processing to create a secure, transparent, and resilient storage solution.

### 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (Hardhat)     │
│                 │    │                 │    │                 │
│ • MetaMask      │    │ • File Upload   │    │ • Smart Contract│
│ • File Upload   │    │ • Encryption    │    │ • Access Control│
│ • Access Control│    │ • Fragmentation │    │ • Trust Scores  │
│ • Trust Monitor │    │ • SHA-256 Hash  │    │ • Audit Logs    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## ✨ Key Features

### 🔐 Security & Privacy
- **AES Encryption**: All files encrypted before storage
- **SHA-256 Hashing**: Tamper-proof integrity verification
- **Blockchain Access Control**: Immutable permission management
- **MetaMask Integration**: Secure wallet-based authentication

### 🌐 Decentralized Architecture
- **Fragment Distribution**: Files split across multiple nodes
- **Trust-Based Selection**: Only high-trust nodes store data
- **Fault Tolerance**: System recovers from node failures
- **No Single Point of Failure**: Distributed storage network

### 📊 Trust Management
- **Dynamic Trust Scores**: Nodes rated based on performance
- **Automatic Selection**: High-trust nodes preferred for storage
- **Real-time Monitoring**: Live trust score dashboard
- **Failure Recovery**: Automatic handling of unreliable nodes

### 🔍 Transparency & Auditability
- **Blockchain Logging**: All operations recorded immutably
- **File Provenance**: Complete history of file operations
- **Access Tracking**: Who accessed what and when
- **Integrity Verification**: Prove files haven't been tampered with

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **MetaMask** browser extension
- **Git**

### 1. Clone Repository
```bash
git clone <repository-url>
cd ChainVault
```

### 2. Install Dependencies

**Blockchain:**
```bash
cd blockchain
npm install
```

**Backend:**
```bash
cd ../backend
pip install -r requirements.txt
```

**Frontend:**
```bash
cd ../frontend
npm install
```

### 3. Start the System

**Option A: Automatic Startup (Windows)**
```bash
start-chainvault.bat
```

**Option B: Manual Startup**

1. **Start Hardhat Node:**
```bash
cd blockchain
npx hardhat node
```

2. **Deploy Contracts:**
```bash
npx hardhat run scripts/deploy.js --network localhost
```

3. **Start Backend:**
```bash
cd ../backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

4. **Start Frontend:**
```bash
cd ../frontend
npm run dev
```

### 4. Configure MetaMask

1. **Add Hardhat Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `31337`
   - Currency Symbol: `ETH`

2. **Import Test Account:**
   - Copy private key from Hardhat console
   - Import into MetaMask

3. **Connect to Application:**
   - Open `http://localhost:3000`
   - Click "Connect MetaMask"

## 📖 Usage Guide

### 🔄 File Upload Process

1. **Select File**: Choose any file up to 10MB
2. **Automatic Processing**:
   - File encrypted with AES
   - Split into 64KB fragments
   - SHA-256 hash generated
3. **Blockchain Registration**: MetaMask signs transaction
4. **Distribution**: Fragments sent to trusted nodes

### 🔐 Access Control

1. **Grant Access**:
   - Enter file hash
   - Enter user's Ethereum address
   - Sign transaction with MetaMask

2. **Revoke Access**:
   - Same process but removes permissions
   - Immediate effect on blockchain

3. **Check Permissions**:
   - Verify who has access to files
   - Real-time blockchain queries

### 📥 File Retrieval

1. **Normal Download**: Retrieves from all available nodes
2. **Test Recovery**: Simulates node failures
3. **Automatic Decryption**: Files decrypted seamlessly
4. **Integrity Check**: Hash verification ensures authenticity

### ✅ File Verification

1. **Upload File**: Select file to verify
2. **Enter Hash**: Provide expected SHA-256 hash
3. **Compare**: System computes and compares hashes
4. **Result**: Confirms if file is authentic

## 🛡️ Trust System

### Trust Score Calculation
- **High Trust (≥70)**: Preferred for new files
- **Medium Trust (50-69)**: Backup storage
- **Low Trust (<50)**: Avoided for storage

### Trust Updates
- **Successful Operations**: +5 points
- **Failed Operations**: -10 points
- **Timeout/Unavailable**: -15 points

### Node Selection
- Only nodes with trust ≥70 selected for new files
- Automatic rebalancing when trust changes
- Real-time monitoring dashboard

## 🔧 Technical Details

### Smart Contract Functions

```solidity
// File Management
registerFile(fileHash, fileName, fileSize, fragmentHashes, fragmentSizes)
getFileMetadata(fileHash)

// Access Control
grantAccess(fileHash, userAddress)
revokeAccess(fileHash, userAddress)
hasFileAccess(fileHash, userAddress)

// Trust Management
registerStorageNode(nodeAddress, initialTrustScore)
updateTrustScore(nodeAddress, newTrustScore)
getTrustedNodes()
```

### Backend API Endpoints

```python
POST /upload              # Upload and process file
GET  /file/{hash}         # Get file metadata
POST /retrieve/{hash}     # Download and decrypt file
POST /verify/{hash}       # Verify file integrity
GET  /files               # List all files
GET  /storage/stats       # Storage statistics
```

### File Processing Pipeline

1. **Upload** → **Encrypt** → **Fragment** → **Hash**
2. **Store Metadata** → **Distribute Fragments** → **Update Trust**
3. **Monitor Nodes** → **Handle Failures** → **Maintain Redundancy**

## 🎓 Educational Value

### Blockchain Concepts Demonstrated
- **Smart Contracts**: Solidity development and deployment
- **Web3 Integration**: ethers.js and MetaMask interaction
- **Decentralized Storage**: Fragment distribution strategies
- **Trust Networks**: Reputation-based node selection

### Security Principles
- **Encryption**: AES symmetric encryption
- **Hashing**: SHA-256 for integrity verification
- **Access Control**: Blockchain-based permissions
- **Fault Tolerance**: Redundancy and recovery mechanisms

### System Design Patterns
- **Microservices**: Separate frontend, backend, blockchain
- **Event-Driven**: Blockchain events trigger UI updates
- **Stateless Backend**: No database dependencies
- **Responsive UI**: Real-time status updates

## 🐛 Troubleshooting

### Common Issues

**MetaMask Connection Failed**
```bash
# Solution: Check network configuration
Network: Hardhat Local
RPC: http://127.0.0.1:8545
Chain ID: 31337
```

**Contract Not Found**
```bash
# Solution: Redeploy contracts
cd blockchain
npx hardhat run scripts/deploy.js --network localhost
```

**Backend Connection Error**
```bash
# Solution: Check if backend is running
curl http://localhost:8000/health
```

**File Upload Fails**
```bash
# Check file size (max 10MB)
# Ensure MetaMask is connected
# Verify sufficient ETH for gas
```

## 📊 Demo Scenarios

### 1. Basic File Storage
1. Upload a document
2. View in file list
3. Download successfully
4. Verify integrity

### 2. Access Control Demo
1. Upload file with Account A
2. Grant access to Account B
3. Switch to Account B
4. Download file successfully
5. Revoke access from Account A
6. Verify Account B can no longer access

### 3. Trust & Recovery Demo
1. Upload file (distributed to high-trust nodes)
2. Use "Test Recovery" to simulate node failures
3. Observe successful recovery from remaining nodes
4. Check trust scores update

### 4. Integrity Verification
1. Upload original file
2. Download and modify file
3. Try to verify modified file
4. Observe integrity check failure

## 🔮 Future Enhancements

### Planned Features
- **IPFS Integration**: Decentralized storage backend
- **Multi-Chain Support**: Deploy on multiple blockchains
- **Advanced Encryption**: Support for different algorithms
- **Mobile App**: React Native mobile client
- **Enterprise Features**: Role-based access control

### Scalability Improvements
- **Layer 2 Solutions**: Reduce gas costs
- **Sharding**: Distribute load across multiple contracts
- **Caching**: Improve performance with Redis
- **CDN Integration**: Faster file delivery

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📞 Support

For questions and support:
- **Issues**: GitHub Issues
- **Documentation**: Check README and code comments
- **Demo**: Follow the demo scenarios above

---

**Built with ❤️ for decentralized storage and blockchain education**