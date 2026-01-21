import React from 'react';

const TrustMonitor = ({ nodes, onRefresh }) => {
  const getTrustLevel = (score) => {
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    return 'low';
  };

  const getTrustColor = (score) => {
    if (score >= 70) return '#48bb78';
    if (score >= 50) return '#ed8936';
    return '#f56565';
  };

  const formatAddress = (address) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const formatDate = (timestamp) => {
    if (timestamp === 0) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="section trust-monitor">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>🛡️ Storage Node Trust Monitor</h2>
        <button className="btn btn-secondary" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {nodes.length === 0 ? (
        <div className="loading">
          <p>Loading storage nodes...</p>
        </div>
      ) : (
        <>
          <div className="nodes-grid">
            {nodes.map((node) => (
              <div 
                key={node.address} 
                className={`node-card ${getTrustLevel(node.trustScore)}-trust`}
              >
                <div className="node-header">
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                      📡 {formatAddress(node.address)}
                    </div>
                    <div 
                      className={`trust-score ${getTrustLevel(node.trustScore)}`}
                      style={{ color: getTrustColor(node.trustScore) }}
                    >
                      Trust: {node.trustScore}/100
                    </div>
                  </div>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    borderRadius: '50%', 
                    background: node.isActive ? '#48bb78' : '#f56565' 
                  }} />
                </div>

                <div className="node-stats">
                  <div style={{ marginBottom: '5px' }}>
                    📦 Stored: {node.totalStored} fragments
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    ✅ Successful: {node.successfulRetrievals}
                  </div>
                  <div style={{ marginBottom: '5px' }}>
                    ❌ Failed: {node.failedRetrievals}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#a0aec0' }}>
                    Last active: {formatDate(node.lastActivity)}
                  </div>
                </div>

                {/* Trust Score Bar */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ 
                    width: '100%', 
                    height: '6px', 
                    background: '#e2e8f0', 
                    borderRadius: '3px',
                    overflow: 'hidden'
                  }}>
                    <div style={{ 
                      width: `${node.trustScore}%`, 
                      height: '100%', 
                      background: getTrustColor(node.trustScore),
                      transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Trust Statistics */}
          <div style={{ marginTop: '30px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                {nodes.filter(n => n.trustScore >= 70).length}
              </div>
              <div style={{ color: '#48bb78', fontWeight: '600' }}>High Trust Nodes</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>≥70 trust score</div>
            </div>

            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                {nodes.filter(n => n.trustScore >= 50 && n.trustScore < 70).length}
              </div>
              <div style={{ color: '#ed8936', fontWeight: '600' }}>Medium Trust Nodes</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>50-69 trust score</div>
            </div>

            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                {nodes.filter(n => n.trustScore < 50).length}
              </div>
              <div style={{ color: '#f56565', fontWeight: '600' }}>Low Trust Nodes</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>&lt;50 trust score</div>
            </div>

            <div style={{ background: '#f7fafc', padding: '15px', borderRadius: '8px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '5px' }}>
                {Math.round(nodes.reduce((sum, n) => sum + n.trustScore, 0) / nodes.length) || 0}
              </div>
              <div style={{ color: '#4a5568', fontWeight: '600' }}>Average Trust</div>
              <div style={{ fontSize: '0.8rem', color: '#718096' }}>Network average</div>
            </div>
          </div>

          {/* Trust Explanation */}
          <div style={{ marginTop: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
            <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>🎯 Trust Score System:</h4>
            <ul style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
              <li><strong>High Trust (≥70):</strong> Preferred for storing file fragments</li>
              <li><strong>Medium Trust (50-69):</strong> Used as backup storage nodes</li>
              <li><strong>Low Trust (&lt;50):</strong> Avoided for new file storage</li>
              <li>Trust scores update based on successful/failed retrievals</li>
              <li>Only trusted nodes (≥70) are selected for new file fragments</li>
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default TrustMonitor;