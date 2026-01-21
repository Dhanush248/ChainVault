import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import WalletConnection from './components/WalletConnection';
import FileUpload from './components/FileUpload';
import FileList from './components/FileList';
import TrustMonitor from './components/TrustMonitor';
import AccessControl from './components/AccessControl';
import FileVerification from './components/FileVerification';

// Contract configuration
const CONTRACT_CONFIG = {
  address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
  chainId: 31337,
  abi: [
    {
      "inputs": [
        {"internalType": "string", "name": "fileHash", "type": "string"},
        {"internalType": "string", "name": "fileName", "type": "string"},
        {"internalType": "uint256", "name": "fileSize", "type": "uint256"},
        {"internalType": "string[]", "name": "fragmentHashes", "type": "string[]"},
        {"internalType": "uint256[]", "name": "fragmentSizes", "type": "uint256[]"}
      ],
      "name": "registerFile",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "fileHash", "type": "string"},
        {"internalType": "address", "name": "userAddress", "type": "address"}
      ],
      "name": "grantAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "fileHash", "type": "string"},
        {"internalType": "address", "name": "userAddress", "type": "address"}
      ],
      "name": "revokeAccess",
      "outputs": [],
      "stateMutability": "nonpayable",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "string", "name": "fileHash", "type": "string"}
      ],
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
    },
    {
      "inputs": [
        {"internalType": "string", "name": "fileHash", "type": "string"},
        {"internalType": "address", "name": "userAddress", "type": "address"}
      ],
      "name": "hasFileAccess",
      "outputs": [
        {"internalType": "bool", "name": "", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getTrustedNodes",
      "outputs": [
        {"internalType": "address[]", "name": "", "type": "address[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [],
      "name": "getAllStorageNodes",
      "outputs": [
        {"internalType": "address[]", "name": "", "type": "address[]"}
      ],
      "stateMutability": "view",
      "type": "function"
    },
    {
      "inputs": [
        {"internalType": "address", "name": "", "type": "address"}
      ],
      "name": "storageNodes",
      "outputs": [
        {"internalType": "address", "name": "nodeAddress", "type": "address"},
        {"internalType": "uint256", "name": "trustScore", "type": "uint256"},
        {"internalType": "uint256", "name": "totalStored", "type": "uint256"},
        {"internalType": "uint256", "name": "successfulRetrievals", "type": "uint256"},
        {"internalType": "uint256", "name": "failedRetrievals", "type": "uint256"},
        {"internalType": "bool", "name": "isActive", "type": "bool"},
        {"internalType": "uint256", "name": "lastActivity", "type": "uint256"}
      ],
      "stateMutability": "view",
      "type": "function"
    }
  ]
};

const BACKEND_URL = 'http://localhost:8000';

function App() {
  // Wallet state
  const [account, setAccount] = useState(null);
  const [provider, setProvider] = useState(null);
  const [contract, setContract] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Application state
  const [files, setFiles] = useState([]);
  const [storageNodes, setStorageNodes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [lastUploadDetails, setLastUploadDetails] = useState(null);

  // UI state
  const [activeTab, setActiveTab] = useState('upload');

  // Initialize wallet connection
  useEffect(() => {
    checkWalletConnection();
    
    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, []);

  // Load data when account changes
  useEffect(() => {
    if (account && contract) {
      loadUserFiles();
      loadStorageNodes();
    }
  }, [account, contract]);

  const checkWalletConnection = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          await connectWallet();
        }
      } catch (error) {
        console.error('Error checking wallet connection:', error);
      }
    }
  };

  const connectWallet = async () => {
    if (!window.ethereum) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Create provider and signer
      const provider = new ethers.BrowserProvider(window.ethereum);
      const network = await provider.getNetwork();
      
      // Check if we're on the correct network
      if (Number(network.chainId) !== CONTRACT_CONFIG.chainId) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}` }],
          });
        } catch (switchError) {
          if (switchError.code === 4902) {
            // Network not added, add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: `0x${CONTRACT_CONFIG.chainId.toString(16)}`,
                chainName: 'Hardhat Local',
                nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                rpcUrls: ['http://127.0.0.1:8545'],
              }],
            });
          } else {
            throw switchError;
          }
        }
      }

      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);

      setAccount(accounts[0]);
      setProvider(provider);
      setContract(contract);
      setSuccess('Wallet connected successfully!');
      
    } catch (error) {
      console.error('Error connecting wallet:', error);
      setError('Failed to connect wallet: ' + error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setProvider(null);
    setContract(null);
    setFiles([]);
    setStorageNodes([]);
    setSuccess('Wallet disconnected');
  };

  const handleAccountsChanged = (accounts) => {
    if (accounts.length === 0) {
      disconnectWallet();
    } else if (accounts[0] !== account) {
      setAccount(accounts[0]);
    }
  };

  const handleChainChanged = () => {
    window.location.reload();
  };

  const loadUserFiles = async () => {
    try {
      setLoading(true);
      // Pass account address to backend for access control filtering
      const url = account 
        ? `${BACKEND_URL}/files?account=${account}`
        : `${BACKEND_URL}/files`;
      
      const response = await axios.get(url);
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error loading files:', error);
      setError('Failed to load files');
    } finally {
      setLoading(false);
    }
  };

  const loadStorageNodes = async () => {
    if (!contract) return;

    try {
      const nodeAddresses = await contract.getAllStorageNodes();
      const nodes = [];

      for (const address of nodeAddresses) {
        try {
          const nodeInfo = await contract.storageNodes(address);
          nodes.push({
            address,
            trustScore: Number(nodeInfo.trustScore),
            totalStored: Number(nodeInfo.totalStored),
            successfulRetrievals: Number(nodeInfo.successfulRetrievals),
            failedRetrievals: Number(nodeInfo.failedRetrievals),
            isActive: nodeInfo.isActive,
            lastActivity: Number(nodeInfo.lastActivity)
          });
        } catch (error) {
          console.error(`Error loading node ${address}:`, error);
        }
      }

      setStorageNodes(nodes);
    } catch (error) {
      console.error('Error loading storage nodes:', error);
    }
  };

  const handleFileUpload = async (file) => {
    if (!contract || !account) {
      setError('Please connect your wallet first');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setLastUploadDetails(null);

    try {
      // Upload file to backend with owner address
      const formData = new FormData();
      formData.append('file', file);
      formData.append('owner_address', account);  // Pass owner's address

      const uploadResponse = await axios.post(`${BACKEND_URL}/upload`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const { file_hash, file_name, file_size, fragment_hashes, fragment_sizes } = uploadResponse.data;

      // Register file on blockchain
      const tx = await contract.registerFile(
        file_hash,
        file_name,
        file_size,
        fragment_hashes,
        fragment_sizes
      );

      const receipt = await tx.wait();

      // Store upload details for display
      setLastUploadDetails({
        fileName: file_name,
        fileHash: file_hash,
        fileSize: file_size,
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        timestamp: new Date().toLocaleString(),
        fragmentCount: fragment_hashes.length
      });

      setSuccess(`File "${file_name}" uploaded and registered successfully!`);
      loadUserFiles();

    } catch (error) {
      console.error('Error uploading file:', error);
      setError('Failed to upload file: ' + (error.response?.data?.detail || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleGrantAccess = async (fileHash, userAddress) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.grantAccess(fileHash, userAddress);
      await tx.wait();
      setSuccess('Access granted successfully!');
    } catch (error) {
      console.error('Error granting access:', error);
      setError('Failed to grant access: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeAccess = async (fileHash, userAddress) => {
    if (!contract) return;

    try {
      setLoading(true);
      const tx = await contract.revokeAccess(fileHash, userAddress);
      await tx.wait();
      setSuccess('Access revoked successfully!');
    } catch (error) {
      console.error('Error revoking access:', error);
      setError('Failed to revoke access: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>🔗 ChainVault</h1>
        <p>Trust-Aware Decentralized Data Storage Framework</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="error">
          {error}
          <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}
      
      {success && (
        <div className="success">
          {success}
          <button onClick={clearMessages} style={{ float: 'right', background: 'none', border: 'none', cursor: 'pointer' }}>×</button>
        </div>
      )}

      {/* Wallet Connection */}
      <WalletConnection
        account={account}
        isConnecting={isConnecting}
        onConnect={connectWallet}
        onDisconnect={disconnectWallet}
      />

      {account && (
        <>
          {/* Navigation Tabs */}
          <div className="section">
            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
              <button 
                className={`btn ${activeTab === 'upload' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('upload')}
              >
                📤 File Upload
              </button>
              <button 
                className={`btn ${activeTab === 'files' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('files')}
              >
                📁 My Files
              </button>
              <button 
                className={`btn ${activeTab === 'access' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('access')}
              >
                🔐 Access Control
              </button>
              <button 
                className={`btn ${activeTab === 'verify' ? '' : 'btn-secondary'}`}
                onClick={() => setActiveTab('verify')}
              >
                ✅ Verify Files
              </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'upload' && (
              <FileUpload 
                onUpload={handleFileUpload} 
                loading={loading}
                uploadDetails={lastUploadDetails}
              />
            )}

            {activeTab === 'files' && (
              <FileList 
                files={files} 
                loading={loading} 
                onRefresh={loadUserFiles}
                backendUrl={BACKEND_URL}
              />
            )}

            {activeTab === 'access' && (
              <AccessControl
                contract={contract}
                account={account}
                onGrantAccess={handleGrantAccess}
                onRevokeAccess={handleRevokeAccess}
                loading={loading}
              />
            )}

            {activeTab === 'verify' && (
              <FileVerification backendUrl={BACKEND_URL} />
            )}
          </div>

          {/* Trust Monitor */}
          <TrustMonitor nodes={storageNodes} onRefresh={loadStorageNodes} />
        </>
      )}
    </div>
  );
}

export default App;