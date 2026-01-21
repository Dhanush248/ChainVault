import React, { useState, useRef } from 'react';

const FileUpload = ({ onUpload, loading, uploadDetails }) => {
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadResult, setUploadResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleUpload = () => {
    if (selectedFile && onUpload) {
      // Reset upload result when starting new upload
      setUploadResult(null);
      onUpload(selectedFile);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div>
      <h2>📤 Upload File</h2>
      
      <div 
        className={`upload-area ${dragOver ? 'dragover' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="file-input"
          onChange={handleFileSelect}
          disabled={loading}
        />
        
        {!selectedFile ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📁</div>
            <p style={{ marginBottom: '10px', fontSize: '1.1rem', fontWeight: '600' }}>
              Drop your file here or click to browse
            </p>
            <p style={{ color: '#718096', fontSize: '0.9rem' }}>
              Supports all file types • Max size: 10MB
            </p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: '15px' }}>📄</div>
            <p style={{ marginBottom: '5px', fontSize: '1.1rem', fontWeight: '600' }}>
              {selectedFile.name}
            </p>
            <p style={{ color: '#718096', fontSize: '0.9rem', marginBottom: '15px' }}>
              {formatFileSize(selectedFile.size)} • {selectedFile.type || 'Unknown type'}
            </p>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button 
                className="btn" 
                onClick={handleUpload}
                disabled={loading}
              >
                {loading ? 'Uploading...' : 'Upload & Register'}
              </button>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setSelectedFile(null);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="loading">
          <p>🔄 Processing file...</p>
          <p style={{ fontSize: '0.9rem', color: '#718096' }}>
            Encrypting, fragmenting, and registering on blockchain
          </p>
        </div>
      )}

      {/* Upload Success Details */}
      {uploadDetails && (
        <div style={{
          marginTop: '20px',
          padding: '20px',
          background: '#c6f6d5',
          borderRadius: '8px',
          borderLeft: '4px solid #48bb78'
        }}>
          <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#22543d', marginBottom: '15px' }}>
            ✅ File Successfully Uploaded & Registered
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
            <div>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>File Name:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-word', color: '#22543d' }}>
                {uploadDetails.fileName}
              </div>
            </div>

            <div>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>File Size:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#22543d' }}>
                {uploadDetails.fileSize} bytes
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>File Hash (SHA-256):</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: '#22543d', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                {uploadDetails.fileHash}
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>Transaction Hash:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', color: '#22543d', padding: '10px', background: 'rgba(255,255,255,0.5)', borderRadius: '4px' }}>
                {uploadDetails.transactionHash}
              </div>
            </div>

            <div>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>Block Number:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#22543d' }}>
                {uploadDetails.blockNumber}
              </div>
            </div>

            <div>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>Fragment Count:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#22543d' }}>
                {uploadDetails.fragmentCount} fragments
              </div>
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <div style={{ color: '#22543d', fontSize: '0.9rem', marginBottom: '5px' }}>
                <strong>Timestamp:</strong>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: '#22543d' }}>
                {uploadDetails.timestamp}
              </div>
            </div>
          </div>

          <button 
            className="btn" 
            onClick={() => {
              setSelectedFile(null);
              setUploadResult(null);
              if (fileInputRef.current) fileInputRef.current.value = '';
            }}
            style={{ marginTop: '15px' }}
          >
            ➕ Upload Another File
          </button>
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', background: '#f7fafc', borderRadius: '8px' }}>
        <h4 style={{ marginBottom: '10px', color: '#4a5568' }}>📋 Upload Process:</h4>
        <ol style={{ paddingLeft: '20px', color: '#718096', fontSize: '0.9rem' }}>
          <li>File is uploaded to backend server</li>
          <li>File content is encrypted using AES encryption</li>
          <li>Encrypted file is split into fragments</li>
          <li>SHA-256 hash is generated for integrity</li>
          <li>Metadata is registered on blockchain via MetaMask</li>
          <li>Fragments are distributed to trusted storage nodes</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUpload;