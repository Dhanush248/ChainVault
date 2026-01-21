import React from 'react';

const WalletConnection = ({ account, isConnecting, onConnect, onDisconnect }) => {
  return (
    <div className="wallet-section">
      <h2>🦊 Wallet Connection</h2>
      
      {!account ? (
        <div>
          <p style={{ marginBottom: '15px', color: '#718096' }}>
            Connect your MetaMask wallet to start using ChainVault
          </p>
          <button 
            className="btn" 
            onClick={onConnect} 
            disabled={isConnecting}
          >
            {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
          </button>
          
          {!window.ethereum && (
            <p style={{ marginTop: '15px', color: '#f56565', fontSize: '0.9rem' }}>
              ⚠️ MetaMask not detected. Please install MetaMask to continue.
            </p>
          )}
        </div>
      ) : (
        <div>
          <div className="wallet-info">
            <div className="status-indicator"></div>
            <div>
              <strong>Connected Account:</strong>
              <div className="address">{account}</div>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-secondary" onClick={onDisconnect}>
              Disconnect
            </button>
            <div style={{ fontSize: '0.9rem', color: '#718096', alignSelf: 'center' }}>
              Network: Hardhat Local (Chain ID: 31337)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletConnection;