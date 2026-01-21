import React, { useState } from 'react';
import axios from 'axios';

const FileList = ({ files, loading, onRefresh, backendUrl }) => {
  const [retrieving, setRetrieving] = useState({});
  const [retrievalResults, setRetrievalResults] = useState({});

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handleRetrieveFile = async (fileHash, fileName, simulateFailure = false) => {
    setRetrieving(prev => ({ ...prev, [fileHash]: true }));
    
    try {
      const response = await axios.post(`${backendUrl}/retrieve/${fileHash}`, null, {
        params: { simulate_node_failure: simulateFailure }
      });

      const { file_data, failed_nodes, fragments_used, total_fragments, failed_fragments } = response.data;
      
      // If failures were simulated, notify backend to update trust scores
      if (simulateFailure && failed_nodes && failed_nodes.length > 0) {
        try {
          await axios.post(`${backendUrl}/update-trust-scores`, {
            failed_node_indices: Array.from({length: failed_nodes.length}, (_, i) => i),
            file_hash: fileHash
          });
        } catch (error) {
          console.warn('Note: Trust scores should be updated on blockchain via smart contract');
        }
      }
      
      // Convert base64 to blob and download
      const byteCharacters = atob(file_data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray]);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Store retrieval results
      setRetrievalResults(prev => ({
        ...prev,
        [fileHash]: {
          success: true,
          failedNodes: failed_nodes,
          failedFragments: failed_fragments,
          fragmentsUsed: fragments_used,
          totalFragments: total_fragments,
          recoverySimulated: simulateFailure,
          timestamp: new Date().toLocaleString()
        }
      }));

    } catch (error) {
      console.error('Error retrieving file:', error);
      setRetrievalResults(prev => ({
        ...prev,
        [fileHash]: {
          success: false,
          error: error.response?.data?.detail || error.message,
          timestamp: new Date().toLocaleString()
        }
      }));
    } finally {
      setRetrieving(prev => ({ ...prev, [fileHash]: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <h2>📁 My Files</h2>
        <div className="loading">Loading files...</div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>📁 My Files ({files.length})</h2>
        <button className="btn btn-secondary" onClick={onRefresh}>
          🔄 Refresh
        </button>
      </div>

      {files.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
          <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📂</div>
          <p>No files uploaded yet</p>
          <p style={{ fontSize: '0.9rem' }}>Upload your first file to get started</p>
        </div>
      ) : (
        <div className="file-list">
          {files.map((file) => (
            <div key={file.file_hash} className="file-item">
              <h4>📄 {file.filename}</h4>
              
              <div className="file-meta">
                <span>📏 {formatFileSize(file.size)}</span>
                <span>🕒 {formatDate(file.upload_time)}</span>
                <span>🧩 {file.fragment_count} fragments</span>
                <span title={file.file_hash}>🔗 {file.file_hash && file.file_hash.substring(0, 16)}...</span>
              </div>
              
              {/* Full Hash Display */}
              <div style={{ 
                marginTop: '10px', 
                padding: '8px', 
                background: '#f0f4f8', 
                borderRadius: '4px',
                fontSize: '0.85rem',
                wordBreak: 'break-all',
                fontFamily: 'monospace'
              }}>
                <strong>Hash:</strong> {file.file_hash}
              </div>

              <div className="file-actions">
                <button
                  className="btn btn-small"
                  onClick={() => handleRetrieveFile(file.file_hash, file.filename, false)}
                  disabled={retrieving[file.file_hash]}
                >
                  {retrieving[file.file_hash] ? '⏳' : '📥'} Download
                </button>
                
                <button
                  className="btn btn-small btn-secondary"
                  onClick={() => handleRetrieveFile(file.file_hash, file.filename, true)}
                  disabled={retrieving[file.file_hash]}
                >
                  {retrieving[file.file_hash] ? '⏳' : '🔧'} Test Recovery
                </button>
              </div>

              {/* Retrieval Results */}
              {retrievalResults[file.file_hash] && (
                <div style={{ 
                  marginTop: '15px', 
                  padding: '15px', 
                  background: retrievalResults[file.file_hash].success ? '#c6f6d5' : '#fed7d7',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  borderLeft: '4px solid ' + (retrievalResults[file.file_hash].success ? '#48bb78' : '#f56565')
                }}>
                  {retrievalResults[file.file_hash].success ? (
                    <div>
                      <div style={{ fontWeight: '600', color: '#2f855a', marginBottom: '10px', fontSize: '1rem' }}>
                        {retrievalResults[file.file_hash].recoverySimulated ? '✅ Recovery Test Successful' : '✅ File Retrieved Successfully'}
                      </div>
                      
                      <div style={{ color: '#2f855a', marginBottom: '8px' }}>
                        📊 Fragment Status: Used {retrievalResults[file.file_hash].fragmentsUsed}/{retrievalResults[file.file_hash].totalFragments} fragments
                      </div>
                      
                      {retrievalResults[file.file_hash].recoverySimulated && (
                        <>
                          {retrievalResults[file.file_hash].failedNodes.length > 0 && (
                            <div style={{ color: '#ed8936', marginTop: '8px', padding: '8px', background: 'rgba(237,137,54,0.1)', borderRadius: '4px' }}>
                              <div style={{ fontWeight: '600', marginBottom: '5px' }}>
                                ⚠️ Simulated Node Failures: {retrievalResults[file.file_hash].failedNodes.length}
                              </div>
                              <div style={{ fontSize: '0.85rem' }}>
                                Despite {retrievalResults[file.file_hash].failedNodes.length} node(s) going offline, file was successfully recovered using remaining fragments.
                              </div>
                              {retrievalResults[file.file_hash].failedFragments && retrievalResults[file.file_hash].failedFragments.length > 0 && (
                                <div style={{ fontSize: '0.8rem', marginTop: '5px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                                  Failed fragments: {retrievalResults[file.file_hash].failedFragments.slice(0, 2).join(', ')}
                                </div>
                              )}
                              <div style={{ fontSize: '0.8rem', marginTop: '5px', color: '#2f855a' }}>
                                💡 Tip: Go to Trust Monitor to see how trust scores should be updated for failed nodes
                              </div>
                            </div>
                          )}
                        </>
                      )}
                      
                      <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: '10px' }}>
                        {retrievalResults[file.file_hash].timestamp}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div style={{ fontWeight: '600', color: '#c53030', marginBottom: '5px' }}>
                        ❌ Retrieval failed
                      </div>
                      <div style={{ color: '#c53030' }}>
                        {retrievalResults[file.file_hash].error}
                      </div>
                      <div style={{ color: '#718096', fontSize: '0.8rem', marginTop: '5px' }}>
                        {retrievalResults[file.file_hash].timestamp}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>🔄 File Retrieval:</h4>
        <ul style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
          <li><strong>Download:</strong> Normal file retrieval from all available fragments</li>
          <li><strong>Test Recovery:</strong> Simulates node failures to test redundancy</li>
          <li>Files are automatically decrypted and integrity-verified during retrieval</li>
          <li>System can recover files even if some storage nodes fail</li>
        </ul>
      </div>
    </div>
  );
};

export default FileList;