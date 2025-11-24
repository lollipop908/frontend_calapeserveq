import React, { useState, useEffect } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import Swal from "sweetalert2";
import { FiImage, FiTrash2, FiUpload } from "react-icons/fi";
import "./styles/ManageAds.css";

// ✅ Get API URLs from environment
const GRAPHQL_URI = import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";
const API_BASE_URL = GRAPHQL_URI.replace('/graphql', '');

const GET_ADS = gql`
  query GetAds {
    ads {
      id
      filename
      filepath
      mimetype
      createdAt
    }
  }
`;

const UPLOAD_AD = gql`
  mutation UploadAd($file: Upload!) {
    uploadAd(file: $file)
  }
`;

const DELETE_AD = gql`
  mutation DeleteAd($id: Int!) {
    deleteAd(id: $id)
  }
`;

const ManageAds = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data, loading, error, refetch } = useQuery(GET_ADS);
  const [uploadAd] = useMutation(UPLOAD_AD);
  const [deleteAd] = useMutation(DELETE_AD);

  const ads = data?.ads || [];

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm'];
      if (!validTypes.includes(file.type)) {
        Swal.fire({
          icon: 'error',
          title: 'Invalid File Type',
          text: 'Please select an image (JPEG, PNG, GIF, WebP) or video (MP4, WebM) file.'
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select a file smaller than 10MB.'
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
  if (!selectedFile) {
    Swal.fire({
      icon: 'warning',
      title: 'No File Selected',
      text: 'Please select a file to upload.'
    });
    return;
  }

  setIsUploading(true);
  try {
    // Create FormData with graphql-upload format
    const formData = new FormData();
    
    const operations = {
      query: `
        mutation UploadAd($file: Upload!) {
          uploadAd(file: $file)
        }
      `,
      variables: {
        file: null
      }
    };
    
    const map = {
      '0': ['variables.file']
    };
    
    formData.append('operations', JSON.stringify(operations));
    formData.append('map', JSON.stringify(map));
    formData.append('0', selectedFile);

    // Get token from localStorage if exists
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(GRAPHQL_URI, {
      method: 'POST',
      headers: headers,
      body: formData,
      credentials: 'include',
    });

    // Check if response is ok
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Response error:', errorText);
      throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Upload result:', result); // Debug log

    if (result.data?.uploadAd) {
      Swal.fire({
        icon: 'success',
        title: 'Upload Successful!',
        text: 'Advertisement uploaded successfully!'
      });
      setSelectedFile(null);
      document.getElementById('file-input').value = '';
      refetch();
    } else if (result.errors) {
      console.error('GraphQL errors:', result.errors);
      throw new Error(result.errors[0].message);
    }
  } catch (error) {
    console.error('Upload error:', error);
    Swal.fire({
      icon: 'error',
      title: 'Upload Failed',
      text: error.message || 'Failed to upload advertisement. Please try again.'
    });
  } finally {
    setIsUploading(false);
  }
};

  const handleDelete = async (adId, filename) => {
    const result = await Swal.fire({
      title: 'Delete Advertisement?',
      text: `Are you sure you want to delete "${filename}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    });

    if (result.isConfirmed) {
      try {
        await deleteAd({
          variables: { id: adId }
        });

        Swal.fire({
          icon: 'success',
          title: 'Deleted!',
          text: 'Advertisement has been deleted.',
          timer: 1500
        });

        refetch();
      } catch (error) {
        console.error('Delete error:', error);
        Swal.fire({
          icon: 'error',
          title: 'Delete Failed',
          text: error.message || 'Failed to delete advertisement. Please try again.'
        });
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isImage = (mimetype) => {
    return mimetype.startsWith('image/');
  };

  const isVideo = (mimetype) => {
    return mimetype.startsWith('video/');
  };

  if (loading) return <div className="loading">Loading advertisements...</div>;
  if (error) return <div className="error">Error: {error.message}</div>;

  return (
    <div className="manage-ads">
      <div className="ads-header">
        <h2>Advertisement Management</h2>
        <p>Upload and manage advertisements for TV monitor displays</p>
      </div>

      {/* Upload Section */}
      <div className="upload-section">
        <div className="upload-card">
          <h3>Upload New Advertisement</h3>
          <div className="upload-area">
            <input
              type="file"
              id="file-input"
              onChange={handleFileSelect}
              accept="image/*,video/*"
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              <FiUpload size={24} />
              <span>Choose File</span>
              {selectedFile && (
                <div className="selected-file">
                  Selected: {selectedFile.name}
                </div>
              )}
            </label>
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className="upload-btn"
            >
              {isUploading ? 'Uploading...' : 'Upload Advertisement'}
            </button>
          </div>
          <div className="upload-info">
            <p>Supported formats: JPEG, PNG, GIF, WebP, MP4, WebM</p>
            <p>Max file size: 10MB</p>
          </div>
        </div>
      </div>

      {/* Ads List Section */}
      <div className="ads-list-section">
        <h3>Current Advertisements ({ads.length})</h3>
        {ads.length === 0 ? (
          <div className="no-ads">
            <FiImage size={48} />
            <p>No advertisements uploaded yet.</p>
          </div>
        ) : (
          <div className="ads-grid">
            {ads.map((ad) => (
              <div key={ad.id} className="ad-card">
                <div className="ad-preview">
                  {isImage(ad.mimetype) ? (
                    <img 
                      src={`${API_BASE_URL}/uploads/${ad.filename}`}
                      alt={ad.filename}
                      onError={(e) => {
                        e.target.src = '/placeholder-image.jpg';
                      }}
                    />
                  ) : isVideo(ad.mimetype) ? (
                    <video controls>
                      <source 
                        src={`${API_BASE_URL}/uploads/${ad.filename}`}
                        type={ad.mimetype}
                      />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <div className="file-placeholder">
                      <FiImage size={32} />
                      <span>Unsupported format</span>
                    </div>
                  )}
                </div>
                <div className="ad-info">
                  <h4 className="ad-filename">{ad.filename}</h4>
                  <p className="ad-type">{ad.mimetype}</p>
                  <p className="ad-date">Uploaded: {formatDate(ad.createdAt)}</p>
                </div>
                <div className="ad-actions">
                  <button
                    onClick={() => handleDelete(ad.id, ad.filename)}
                    className="delete-btn"
                    title="Delete advertisement"
                  >
                    <FiTrash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageAds;