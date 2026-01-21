# 🎯 ChainVault Demo Guide

Complete testing guide for ChainVault's trust-aware decentralized storage system.

## 🚀 Pre-Demo Setup

### 1. System Startup

```bash
# Option A: Quick Start
start-chainvault.bat

# Option B: Manual Start
cd blockchain && npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
cd ../backend && python -m uvicorn app.main:app --reload
cd ../frontend && npm run dev
```

### 2. MetaMask Configuration

- **Network**: Hardhat Local
- **RPC**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Import 2-3 test accounts** from Hardhat console

### 3. Access Points

- **Frontend**: `http://localhost:3000`
- **Backend API**: `http://localhost:8000`
- **Blockchain**: `http://127.0.0.1:8545`

---

## 📋 Demo Scenarios

### 🔄 Scenario 1: Basic File Operations

**Objective**: Test core upload/download functionality

**Steps**:

1. **Upload Test File**
   - Select a small document (< 1MB)
   - Click "Upload File"
   - Sign MetaMask transaction
   - Note the file hash generated

2. **Verify Upload**
   - Check file appears in "My Files" list
   - Verify metadata (name, size, hash)
   - Check blockchain transaction

3. **Download File**
   - Click "Download" on uploaded file
   - Verify file downloads correctly
   - Compare with original file

**Expected Results**:

- ✅ File uploads successfully
- ✅ Metadata stored on blockchain
- ✅ File downloads and matches original
- ✅ Hash verification passes

---

### 🔐 Scenario 2: Access Control Demo

**Objective**: Test permission management system

**Setup**: Use 2 MetaMask accounts (Owner & User)

**Steps**:

1. **Upload as Owner** (Account A)
   - Upload a test file
   - Note the file hash
   - Verify only owner can see file

2. **Grant Access** (Account A)
   - Go to "Access Control" tab
   - Enter file hash
   - Enter Account B address
   - Sign transaction

3. **Test Access** (Account B)
   - Switch to Account B in MetaMask
   - Refresh application
   - Verify file now appears in file list
   - Download file successfully

4. **Revoke Access** (Account A)
   - Switch back to Account A
   - Revoke access for Account B
   - Sign transaction

5. **Verify Revocation** (Account B)
   - Switch to Account B
   - Refresh application
   - Verify file no longer accessible

**Expected Results**:

- ✅ Only owner sees file initially
- ✅ Granted user gains access
- ✅ Revoked user loses access
- ✅ All changes reflect immediately

---

### 🛡️ Scenario 3: Trust System & Recovery

**Objective**: Test trust-based storage and fault tolerance

**Prerequisites**:

- All systems running (blockchain, backend, frontend)
- At least 3 nodes registered in smart contract
- Node trust scores initialized to 100

**Steps**:

#### **Step 1: Check Initial Trust Scores**

1. Connect wallet to application
2. Go to "🛡️ Trust Monitor" tab
3. **Verify**:
   - ✅ All nodes display with trust score 100
   - ✅ High Trust Nodes count = total nodes (should be 3)
   - ✅ Medium Trust Nodes count = 0
   - ✅ Low Trust Nodes count = 0
   - ✅ Average Trust = 100
4. **Note**:
   - Green indicator = Node is active
   - Trust score bar shows visual representation
   - Each node shows fragments stored and retrieval stats

#### **Step 2: Upload Medium File to Trusted Nodes**

1. Go to "📤 File Upload" tab
2. Select a medium-sized file (2-5MB recommended):
   - Can use: test video, PDF document, or multiple images
   - Avoid files > 10MB (size limit)
3. Click "Upload & Register"
4. Sign MetaMask transaction
5. **Verify Upload Success**:
   - ✅ File hash displays in success panel
   - ✅ Fragment count shows (typically 4-8 fragments for 2-5MB)
   - ✅ Transaction hash appears
   - ✅ File appears in "My Files" list
6. **Note**: File is automatically distributed to high-trust nodes (≥70 score)

#### **Step 3: Simulate Node Failures**

1. Go to "📁 My Files" tab
2. Find the file you just uploaded
3. Click "🔧 Test Recovery" button
4. **What happens**:
   - Backend randomly simulates 1-2 nodes failing
   - Removes failed fragments from recovery pool
   - Attempts to reconstruct file using remaining fragments
5. **Expected Results**:
   - ✅ File downloads successfully
   - ✅ Recovery test shows success message
   - ✅ Shows "Simulated Node Failures: X"
   - ✅ Indicates which fragments couldn't be accessed
   - ✅ File integrity verified despite failures

#### **Step 4: Check Trust Updates**

1. **Important**: Refresh the page or click "Refresh" in Trust Monitor
   - This fetches updated trust scores from blockchain
2. Go to "🛡️ Trust Monitor" tab
3. **Look for changes**:
   - ⚠️ **Expected**: If nodes truly failed, scores might not show changes in demo
   - 💡 **Note**: In production, `updateTrustScore()` would be called on blockchain
   - For demo purposes, failed nodes should be penalized in next upload cycle
4. **Monitor Statistics**:
   - Watch if any nodes drop below 70 (from high to medium trust)
   - Check if "Medium Trust Nodes" or "Low Trust Nodes" count changes

#### **Step 5: Upload Second File and Observe Node Selection**

1. Go to "📤 File Upload" tab
2. Upload another file (1-3MB)
3. **Expected**:
   - ✅ New file assigned to highest-trust nodes
   - ✅ Previously failed nodes avoided if trust dropped
   - ✅ Maintains fault tolerance via redundancy

#### **Step 6: Test Another Recovery**

1. Download the second file normally: Click "📥 Download"
2. Then test recovery again: Click "🔧 Test Recovery"
3. **Verify**:
   - ✅ Recovery works consistently
   - ✅ System adapts to node failures
   - ✅ File always recoverable with proper fragmentation

**Expected Results**:

- ✅ Files stored on high-trust nodes (≥70)
- ✅ System recovers from simulated node failures
- ✅ Trust scores displayed with visual indicators
- ✅ Recovery shows which nodes failed
- ✅ Files downloaded successfully despite failures
- ✅ Future uploads avoid low-trust nodes

**Key Insights to Demonstrate**:

1. **Fault Tolerance**: System uses fragment redundancy (4-8 fragments per file)
2. **Trust-Based Selection**: Prefers reliable nodes for storage
3. **Graceful Degradation**: Works even when some nodes fail
4. **Transparency**: Users see exactly what happened during recovery

---

### ✅ Scenario 4: File Integrity Verification

**Objective**: Test tamper detection and integrity checks

**Steps**:

1. **Upload Original File**
   - Upload a text document
   - Note the SHA-256 hash
   - Download and save locally

2. **Verify Original File**
   - Go to "File Verification" tab
   - Upload the original file
   - Enter the correct hash
   - Verify integrity check passes

3. **Test Tampered File**
   - Modify the downloaded file (change some text)
   - Try to verify the modified file with original hash
   - Observe integrity check failure

4. **Hash Comparison**
   - Upload modified file to get new hash
   - Compare original vs modified hash
   - Verify hashes are different

**Expected Results**:

- ✅ Original file passes verification
- ✅ Modified file fails verification
- ✅ Different hashes for different files
- ✅ System detects tampering

---

### 🔄 Scenario 5: Multi-User Workflow

**Objective**: Test collaborative file sharing

**Setup**: Use 3 MetaMask accounts (Admin, User1, User2)

**Steps**:

1. **Admin Uploads Files**
   - Upload 3 different files
   - Note all file hashes

2. **Selective Sharing**
   - Grant User1 access to File A & B
   - Grant User2 access to File B & C
   - Keep File A exclusive to Admin & User1

3. **Test User1 Access**
   - Switch to User1 account
   - Verify can see Files A & B only
   - Download both files successfully

4. **Test User2 Access**
   - Switch to User2 account
   - Verify can see Files B & C only
   - Download both files successfully

5. **Cross-Verification**
   - User1 cannot access File C
   - User2 cannot access File A
   - Admin can access all files

**Expected Results**:

- ✅ Users see only permitted files
- ✅ Access restrictions enforced
- ✅ No unauthorized access possible
- ✅ Admin retains full control

---

## 🧪 Advanced Testing

### Performance Testing

```bash
# Test with larger files
- Upload 5MB file
- Upload 10MB file (max size)
- Monitor upload/download times
- Check fragment distribution
```

### Stress Testing

```bash
# Multiple simultaneous operations
- Upload 5 files simultaneously
- Download multiple files at once
- Grant/revoke access rapidly
- Monitor system stability
```

### Edge Cases

```bash
# Test boundary conditions
- Upload 0-byte file
- Upload exactly 10MB file
- Very long filenames
- Special characters in filenames
- Network interruptions during upload
```

---

## 📊 Demo Checklist

### ✅ Core Features

- [ ] File upload/download
- [ ] Encryption/decryption
- [ ] Fragment distribution
- [ ] Hash generation/verification
- [ ] MetaMask integration
- [ ] Blockchain transactions

### ✅ Access Control

- [ ] Grant access
- [ ] Revoke access
- [ ] Permission verification
- [ ] Multi-user scenarios
- [ ] Access restrictions

### ✅ Trust System

- [ ] Trust score display
- [ ] Node selection based on trust
- [ ] Trust score updates
- [ ] Failure simulation
- [ ] Recovery mechanisms

### ✅ Security

- [ ] File integrity verification
- [ ] Tamper detection
- [ ] Unauthorized access prevention
- [ ] Secure authentication
- [ ] Encrypted storage

### ✅ User Experience

- [ ] Intuitive interface
- [ ] Real-time updates
- [ ] Error handling
- [ ] Loading indicators
- [ ] Success/failure feedback

---

## 🐛 Common Issues & Solutions

### MetaMask Issues

```bash
Problem: Transaction fails
Solution: Check gas limit, refresh page, reconnect wallet

Problem: Wrong network
Solution: Switch to Hardhat Local network

Problem: Insufficient funds
Solution: Use test accounts with ETH from Hardhat
```

### Upload Issues

```bash
Problem: File too large
Solution: Use files < 10MB

Problem: Upload hangs
Solution: Check backend connection, restart services

Problem: Hash mismatch
Solution: Verify file wasn't modified during upload
```

### Access Control Issues

```bash
Problem: Access not granted
Solution: Verify correct address, check transaction status

Problem: Still can access after revoke
Solution: Refresh page, check blockchain confirmation

Problem: Wrong permissions
Solution: Verify account addresses, check transaction logs
```

---

## 📈 Success Metrics

### Functionality

- **Upload Success Rate**: > 95%
- **Download Success Rate**: > 95%
- **Access Control Accuracy**: 100%
- **Recovery Success Rate**: > 90%

### Performance

- **Upload Time**: < 30s for 5MB file
- **Download Time**: < 20s for 5MB file
- **Transaction Confirmation**: < 10s
- **Trust Score Update**: < 5s

### Security

- **Integrity Verification**: 100% accurate
- **Unauthorized Access**: 0% success
- **Tamper Detection**: 100% accurate
- **Encryption**: All files encrypted

---

## 🎬 Demo Script

### Opening (2 minutes)

"ChainVault combines blockchain security with decentralized storage. Let me show you how it works."

### Core Demo (10 minutes)

1. **Upload & Security** (3 min)
   - Upload file, show encryption
   - Explain fragmentation
   - Show blockchain registration

2. **Access Control** (4 min)
   - Grant access to second user
   - Switch accounts, show access
   - Revoke access, verify restriction

3. **Trust & Recovery** (3 min)
   - Show trust scores
   - Simulate failures
   - Demonstrate recovery

### Advanced Features (5 minutes)

- File verification
- Integrity checking
- Trust monitoring
- Multi-user scenarios

### Closing (3 minutes)

- Summarize key benefits
- Discuss real-world applications
- Q&A session

---

## 📝 Demo Notes

### Key Points to Highlight

- **Security**: End-to-end encryption, blockchain immutability
- **Decentralization**: No single point of failure
- **Trust**: Dynamic node selection based on reliability
- **Transparency**: All operations auditable on blockchain
- **Usability**: Simple interface, MetaMask integration

### Technical Highlights

- **Smart Contracts**: Solidity-based access control
- **Cryptography**: AES encryption, SHA-256 hashing
- **Web3**: ethers.js integration
- **Architecture**: Microservices design
- **Fault Tolerance**: Automatic recovery mechanisms

---

**Good luck with your demo tomorrow! 🚀**

_Sleep well, partner! The demo guide is ready for your testing session._
