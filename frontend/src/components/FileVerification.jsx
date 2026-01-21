import React, { useState, useRef } from 'react';
import axios from 'axios';

const FileVerification = ({ backendUrl }) => {
  const [fileHash, setFileHash] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleVerify = async () => {
    if (!fileHash || !selectedFile) return;

    setVerifying(true);
    setVerificationResult(null);

    try {
      const formData = new FormData();
      formData.append('uploaded_file', selectedFile);

      const response = await axios.post(`${backendUrl}/verify/${fileHash}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setVerificationResult(response.data);
    } catch (error) {
      console.error('Error verifying file:', error);
      setVerificationResult({
        is_valid: false,
        error: error.response?.data?.detail || error.message,
        verification_timestamp: new Date().toISOString()
      });
    } finally {
      setVerifying(false);
    }
  };

  const clearForm = () => {
    setFileHash('');
    setSelectedFile(null);
    setVerificationResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isValidHash = (hash) => {
    return /^[a-fA-F0-9]{64}$/.test(hash);
  };

  return (
    <div>
      <h2>✅ File Verification</h2>
      <p style={{ marginBottom: '20px', color: '#718096' }}>
        Verify file integrity by comparing SHA-256 hashes
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Verification Form */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#4a5568' }}>Verify File Integrity</h3>
          
          <div className="form-group">
            <label>Expected File Hash:</label>
            <input
              type="text"
              value={fileHash}
              onChange={(e) => setFileHash(e.target.value)}
              placeholder="Enter the expected SHA-256 hash"
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
            <label>Select File to Verify:</label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              style={{ display: 'block', width: '100%' }}
            />
            {selectedFile && (
              <div style={{ marginTop: '10px', padding: '10px', background: '#f7fafc', borderRadius: '6px' }}>
                <div style={{ fontWeight: '600', marginBottom: '5px' }}>📄 {selectedFile.name}</div>
                <div style={{ fontSize: '0.9rem', color: '#718096' }}>
                  {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn"
              onClick={handleVerify}
              disabled={verifying || !fileHash || !selectedFile || !isValidHash(fileHash)}
            >
              {verifying ? 'Verifying...' : '🔍 Verify Integrity'}
            </button>
            
            <button
              className="btn btn-secondary"
              onClick={clearForm}
              disabled={verifying}
            >
              🗑️ Clear
            </button>
          </div>
        </div>

        {/* Verification Result */}
        <div>
          <h3 style={{ marginBottom: '15px', color: '#4a5568' }}>Verification Result</h3>
          
          {!verificationResult ? (
            <div style={{ 
              padding: '40px', 
              textAlign: 'center', 
              background: '#f7fafc', 
              borderRadius: '8px',
              color: '#718096'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: '15px' }}>🔍</div>
              <p>Upload a file and enter its expected hash to verify integrity</p>
            </div>
          ) : (
            <div style={{ 
              padding: '20px', 
              background: verificationResult.is_valid ? '#c6f6d5' : '#fed7d7',
              borderRadius: '8px'
            }}>
              <div style={{ 
                fontSize: '3rem', 
                textAlign: 'center', 
                marginBottom: '15px' 
              }}>
                {verificationResult.is_valid ? '✅' : '❌'}
              </div>
              
              <div style={{ 
                fontWeight: '600', 
                fontSize: '1.2rem',
                color: verificationResult.is_valid ? '#2f855a' : '#c53030',
                marginBottom: '15px',
                textAlign: 'center'
              }}>
                {verificationResult.is_valid ? 'File Integrity Verified' : 'File Integrity Failed'}
              </div>

              <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Expected Hash:</strong>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {verificationResult.file_hash}
                  </div>
                </div>
                
                <div style={{ marginBottom: '10px' }}>
                  <strong>Computed Hash:</strong>
                  <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all' }}>
                    {verificationResult.uploaded_hash}
                  </div>
                </div>

                {verificationResult.has_original_stored !== undefined && (
                  <div style={{ marginBottom: '10px' }}>
                    <strong>Original Stored:</strong> {verificationResult.has_original_stored ? 'Yes' : 'No'}
                  </div>
                )}

                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  Verified: {new Date(verificationResult.verification_timestamp).toLocaleString()}
                </div>

                {verificationResult.error && (
                  <div style={{ color: '#c53030', fontSize: '0.8rem', marginTop: '10px' }}>
                    Error: {verificationResult.error}
                  </div>
                )}
              </div>

              <div style={{ 
                marginTop: '15px', 
                padding: '10px', 
                background: 'rgba(255, 255, 255, 0.5)', 
                borderRadius: '6px',
                fontSize: '0.9rem'
              }}>
                <strong>Message:</strong> {verificationResult.message || 
                  (verificationResult.is_valid ? 
                    'The file has not been tampered with and matches the expected hash.' : 
                    'The file has been modified or corrupted since it was originally stored.'
                  )
                }
              </div>
            </div>
          )}
        </div>
      </div>

      {/* How it Works */}
      <div style={{ marginTop: '30px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>🔬 How File Verification Works:</h4>
        <ol style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
          <li>Get the expected file hash from the blockchain or file metadata</li>
          <li>Upload the file you want to verify</li>
          <li>System computes SHA-256 hash of the uploaded file</li>
          <li>Compares computed hash with expected hash</li>
          <li>If hashes match: File is authentic and unmodified</li>
          <li>If hashes don't match: File has been tampered with or corrupted</li>
        </ol>
      </div>

      {/* Use Cases */}
      <div style={{ marginTop: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>💡 Use Cases:</h4>
        <ul style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
          <li><strong>Document Authenticity:</strong> Verify legal documents haven't been altered</li>
          <li><strong>Software Integrity:</strong> Ensure downloaded files haven't been corrupted</li>
          <li><strong>Data Forensics:</strong> Prove data integrity in legal proceedings</li>
          <li><strong>Backup Verification:</strong> Confirm backup files are identical to originals</li>
        </ul>
      </div>
    </div>
  );
};

export default FileVerification;