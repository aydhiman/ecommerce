import { useState, useRef } from 'react';
import api from '../api/axios';
import { getImageUrl, getPlaceholderImage } from '../utils/imageHelper';

export default function ImageUpload({ onImageUpload, initialImage = null }) {
  const [preview, setPreview] = useState(initialImage);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    setError('');

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Only image files are allowed (JPEG, PNG, GIF, WebP)');
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload file
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      });

      if (response.data.success) {
        onImageUpload(response.data.imagePath);
      } else {
        setError(response.data.message || 'Upload failed');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.response?.data?.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="image-upload-container">
      <div
        className={`upload-area ${dragActive ? 'drag-active' : ''} ${uploading ? 'uploading' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleChange}
          style={{ display: 'none' }}
        />

        {preview ? (
          <div className="preview-container">
            <img src={preview.startsWith('data:') ? preview : getImageUrl(preview)} alt="Preview" className="preview-image" />
            <div className="preview-overlay">
              <p>Click or drag to change image</p>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p className="upload-text">
              {uploading ? 'Uploading...' : 'Drag & drop an image here or click to browse'}
            </p>
            <p className="upload-hint">Supported: JPEG, PNG, GIF, WebP (max 10MB)</p>
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          <p>{error}</p>
        </div>
      )}

      <style jsx>{`
        .image-upload-container {
          width: 100%;
          margin: 10px 0;
        }

        .upload-area {
          border: 2px dashed #cbd5e0;
          border-radius: 8px;
          padding: 40px 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.3s ease;
          background-color: #f7fafc;
        }

        .upload-area:hover {
          border-color: #4299e1;
          background-color: #ebf8ff;
        }

        .upload-area.drag-active {
          border-color: #4299e1;
          background-color: #ebf8ff;
          transform: scale(1.02);
        }

        .upload-area.uploading {
          opacity: 0.6;
          pointer-events: none;
        }

        .preview-container {
          position: relative;
          max-width: 400px;
          margin: 0 auto;
        }

        .preview-image {
          max-width: 100%;
          max-height: 300px;
          object-fit: contain;
          border-radius: 8px;
        }

        .preview-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          border-radius: 8px;
        }

        .preview-overlay p {
          color: white;
          font-size: 14px;
          margin: 0;
        }

        .preview-container:hover .preview-overlay {
          opacity: 1;
        }

        .upload-placeholder {
          color: #718096;
        }

        .upload-placeholder svg {
          margin: 0 auto 16px;
          color: #a0aec0;
        }

        .upload-text {
          font-size: 16px;
          font-weight: 500;
          margin-bottom: 8px;
          color: #2d3748;
        }

        .upload-hint {
          font-size: 13px;
          color: #a0aec0;
          margin-top: 8px;
        }

        .upload-error {
          margin-top: 12px;
          padding: 12px;
          background-color: #fed7d7;
          border: 1px solid #fc8181;
          border-radius: 6px;
        }

        .upload-error p {
          color: #c53030;
          font-size: 14px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
