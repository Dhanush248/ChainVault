import React, { useState } from 'react';

const AccessControl = ({ contract, account, onGrantAccess, onRevokeAccess, loading }) => {
  const [fileHash, setFileHash] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(false);
  const [accessResult, setAccessResult] = useState(null);

  const handleGrantAccess = async (e) => {
    e.preventDefault();
    if (!fileHash || !userAddress) return;

    try {
      await onGrantAccess(fileHash, userAddress);
      setFileHash('');
      setUserAddress('');
    } catch (error) {
      console.error('Error granting access:', error);
    }
  };

  const handleRevokeAccess = async (e) => {
    e.preventDefault();
    if (!fileHash || !userAddress) return;

    try {
      await onRevokeAccess(fileHash, userAddress);
      setFileHash('');
      setUserAddress('');
    } catch (error) {
      console.error('Error revoking access:', error);
    }
  };

  const checkAccess = async () => {
    if (!fileHash || !userAddress || !contract) return;

    setCheckingAccess(true);
    try {
      const hasAccess = await contract.hasFileAccess(fileHash, userAddress);
      setAccessResult({
        fileHash,
        userAddress,
        hasAccess,
        timestamp: new Date().toLocaleString()
      });
    } catch (error) {
      console.error('Error checking access:', error);
      setAccessResult({
        fileHash,
        userAddress,
        hasAccess: false,
        error: error.message,
        timestamp: new Date().toLocaleString()
      });
    } finally {
      setCheckingAccess(false);
    }
  };

  const isValidAddress = (address) => {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  };

  const isValidHash = (hash) => {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  };

  return (
    <div>
      <h2>🔐 Access Control</h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        Manage file access permissions for other users
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Grant/Revoke Access */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#4a5568' }}>Manage Permissions</h3>
          
          <form onSubmit={handleGrantAccess}>
            <div className="form-group">
              <label>File Hash:</label>
              <input
                type="text"
                value={fileHash}
                onChange={(e) => setFileHash(e.target.value)}
                placeholder="Enter file hash (64 characters)"
                style={{ 
                  borderColor: fileHash && !isValidHash(fileHash) ? '#f56565' : '#e2e8f0' 
                }}
              />
              {fileHash && !isValidHash(fileHash) && (
                <div style={{ color: '#f56565', fontSize: '0.8rem', marginTop: '5px' }}>
                  Invalid hash format (must be 64 hex characters)
                </div>
              )}
            </div>

            <div className="form-group">
              <label>User Address:</label>
              <input
                type="text"
                value={userAddress}
                onChange={(e) => setUserAddress(e.target.value)}
                placeholder="0x..."
                style={{ 
                  borderColor: userAddress && !isValidAddress(userAddress) ? '#f56565' : '#e2e8f0' 
                }}
              />
              {userAddress && !isValidAddress(userAddress) && (
                <div style={{ color: '#f56565', fontSize: '0.8rem', marginTop: '5px' }}>
                  Invalid Ethereum address format
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="submit"
                className="btn"
                disabled={loading || !fileHash || !userAddress || !isValidHash(fileHash) || !isValidAddress(userAddress)}
              >
                {loading ? 'Processing...' : '✅ Grant Access'}
              </button>
              
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleRevokeAccess}
                disabled={loading || !fileHash || !userAddress || !isValidHash(fileHash) || !isValidAddress(userAddress)}
              >
                {loading ? 'Processing...' : '❌ Revoke Access'}
              </button>
            </div>
          </form>
        </div>

        {/* Check Access */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#4a5568' }}>Check Access</h3>
          
          <div className="form-group">
            <label>File Hash:</label>
            <input
              type="text"
              value={fileHash}
              onChange={(e) => setFileHash(e.target.value)}
              placeholder="Enter file hash to check"
            />
          </div>

          <div className="form-group">
            <label>User Address:</label>
            <input
              type="text"
              value={userAddress}
              onChange={(e) => setUserAddress(e.target.value)}
              placeholder="Enter user address to check"
            />
          </div>

          <button
            className="btn btn-secondary"
            onClick={checkAccess}
            disabled={checkingAccess || !fileHash || !userAddress || !isValidHash(fileHash) || !isValidAddress(userAddress)}
          >
            {checkingAccess ? 'Checking...' : '🔍 Check Access'}
          </button>

          {/* Access Check Result */}
          {accessResult && (
            <div style={{ 
              marginTop: '15px', 
              padding: '15px', 
              background: accessResult.hasAccess ? '#c6f6d5' : '#fed7d7',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontWeight: '600', 
                color: accessResult.hasAccess ? '#2f855a' : '#c53030',
                marginBottom: '10px'
              }}>
                {accessResult.hasAccess ? '✅ Access Granted' : '❌ Access Denied'}
              </div>
              
              <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                <div>File: {accessResult.fileHash.substring(0, 16)}...</div>
                <div>User: {accessResult.userAddress.substring(0, 16)}...</div>
                <div style={{ fontSize: '0.8rem', color: '#718096', marginTop: '5px' }}>
                  Checked: {accessResult.timestamp}
                </div>
              </div>

              {accessResult.error && (
                <div style={{ color: '#c53030', fontSize: '0.8rem', marginTop: '5px' }}>
                  Error: {accessResult.error}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Current Account Info */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>👤 Current Account:</h4>
        <div className="address" style={{ marginBottom: '10px' }}>{account}</div>
        <p style={{ fontSize: '0.9rem', color: '#718096' }}>
          You can only grant/revoke access for files you own. File ownership is determined by the wallet address that uploaded the file.
        </p>
      </div>

      {/* Instructions */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>📋 How to use:</h4>
        <ol style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
          <li>Get the file hash from your uploaded files list</li>
          <li>Enter the Ethereum address of the user you want to grant access to</li>
          <li>Click "Grant Access" to allow them to download the file</li>
          <li>Use "Revoke Access" to remove permissions</li>
          <li>Use "Check Access" to verify current permissions</li>
        </ol>
      </div>
    </div>
  );
};

export default AccessControl;