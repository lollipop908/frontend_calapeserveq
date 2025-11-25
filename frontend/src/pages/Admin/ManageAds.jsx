import React, { useState } from "react";
import { useMutation, useQuery, gql } from "@apollo/client";
import Swal from "sweetalert2";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";
import "./styles/ManageAds.css";

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

const GET_AD = gql`
  query GetAd($id: Int!) {
    ad(id: $id) {
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

const UPDATE_AD = gql`
  mutation UpdateAd($id: Int!, $file: Upload!) {
    updateAd(id: $id, file: $file)
  }
`;

const DELETE_AD = gql`
  mutation DeleteAd($id: Int!) {
    deleteAd(id: $id)
  }
`;

const ManageAds = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingAd, setEditingAd] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const { data, loading, refetch } = useQuery(GET_ADS);
  const [uploadAd] = useMutation(UPLOAD_AD);
  const [updateAd] = useMutation(UPDATE_AD);
  const [deleteAd] = useMutation(DELETE_AD);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Swal.fire("No file selected", "", "warning");
      return;
    }

    setIsUploading(true);
    try {
      // Create FormData according to GraphQL multipart request spec
      // This format is required by graphql-upload-ts
      const formData = new FormData();

      // The operations field contains the GraphQL query/mutation
      // Must match the exact mutation signature
      const operations = {
        query: `mutation UploadAd($file: Upload!) { uploadAd(file: $file) }`,
        variables: {
          file: null, // Will be replaced by the map
        },
      };

      // The map field tells the server which file corresponds to which variable
      const map = {
        '0': ['variables.file'],
      };

      // Append all parts in the correct order - use JSON.stringify for operations and map
      formData.append('operations', JSON.stringify(operations));
      formData.append('map', JSON.stringify(map));
      formData.append('0', selectedFile, selectedFile.name); // The actual file with name

      // Debug: Log what we're sending
      console.log("FormData contents:", {
        operations: JSON.stringify(operations),
        map: JSON.stringify(map),
        fileName: selectedFile.name,
        fileSize: selectedFile.size,
        fileType: selectedFile.type,
      });

      const token = localStorage.getItem("token");
      
      const graphqlUri = import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";
      console.log("Sending request to:", graphqlUri);

      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      const response = await fetch(graphqlUri, {
        method: "POST",
        body: formData,
        headers: headers, // No Content-Type - browser sets it automatically
        credentials: "include",
      });

      console.log("Response status:", response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response error text:", errorText);
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Response result:", result);

      if (result.errors) {
        console.error("GraphQL errors:", result.errors);
        throw new Error(result.errors[0]?.message || "Upload failed");
      }

      if (result.data?.uploadAd === true) {
        Swal.fire("Uploaded!", "Advertisement uploaded successfully!", "success");
        setSelectedFile(null);
        const fileInput = document.getElementById("file-input");
        if (fileInput) fileInput.value = "";
        refetch();
      } else {
        throw new Error("Upload failed - unexpected response");
      }
    } catch (err) {
      console.error("Upload error:", err);
      const errorMessage = err?.message || "Upload failed";
      Swal.fire("Upload failed", errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdate = async (adId) => {
    if (!selectedFile) {
      Swal.fire("No file selected", "", "warning");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      const operations = {
        query: `mutation UpdateAd($id: Int!, $file: Upload!) { updateAd(id: $id, file: $file) }`,
        variables: {
          id: adId,
          file: null,
        },
      };

      const map = {
        '0': ['variables.file'],
      };

      formData.append('operations', JSON.stringify(operations));
      formData.append('map', JSON.stringify(map));
      formData.append('0', selectedFile, selectedFile.name);

      const token = localStorage.getItem("token");
      const graphqlUri = import.meta.env.VITE_GRAPHQL_URI || "http://localhost:3000/graphql";
      
      const headers = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(graphqlUri, {
        method: "POST",
        body: formData,
        headers: headers,
        credentials: "include",
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();

      if (result.errors) {
        throw new Error(result.errors[0]?.message || "Update failed");
      }

      if (result.data?.updateAd === true) {
        Swal.fire("Updated!", "Advertisement updated successfully!", "success");
        setSelectedFile(null);
        setEditingAd(null);
        const fileInput = document.getElementById("file-input");
        if (fileInput) fileInput.value = "";
        refetch();
      } else {
        throw new Error("Update failed - unexpected response");
      }
    } catch (err) {
      console.error("Update error:", err);
      const errorMessage = err?.message || "Update failed";
      Swal.fire("Update failed", errorMessage, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (adId, filename) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Delete "${filename}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        const { data } = await deleteAd({
          variables: { id: adId },
        });

        if (data?.deleteAd === true) {
          Swal.fire("Deleted!", "Advertisement deleted successfully!", "success");
          refetch();
        }
      } catch (err) {
        console.error("Delete error:", err);
        const errorMessage = err?.graphQLErrors?.[0]?.message || err?.message || "Delete failed";
        Swal.fire("Delete failed", errorMessage, "error");
      }
    }
  };

  const handleEdit = (ad) => {
    setEditingAd(ad);
    setSelectedFile(null);
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
  };

  const handleCancelEdit = () => {
    setEditingAd(null);
    setSelectedFile(null);
    const fileInput = document.getElementById("file-input");
    if (fileInput) fileInput.value = "";
  };

  return (
    <div className="upload-container">
      <div className="upload-section">
        <h2>{editingAd ? "Update Advertisement" : "Upload New Advertisement"}</h2>
        <input
          type="file"
          id="file-input"
          onChange={handleFileSelect}
          accept="image/*,video/*"
          disabled={isUploading}
        />
        <div className="upload-actions">
          {editingAd ? (
            <>
              <button 
                onClick={() => handleUpdate(editingAd.id)} 
                disabled={isUploading || !selectedFile}
                className="btn-update"
              >
                {isUploading ? "Updating..." : "Update"}
              </button>
              <button 
                onClick={handleCancelEdit} 
                disabled={isUploading}
                className="btn-cancel"
              >
                <FaTimes /> Cancel
              </button>
            </>
          ) : (
            <button 
              onClick={handleUpload} 
              disabled={isUploading || !selectedFile}
              className="btn-upload"
            >
              {isUploading ? "Uploading..." : "Upload"}
            </button>
          )}
        </div>
      </div>

      <div className="uploaded-files">
        <h3>Uploaded Advertisements</h3>
        {loading ? (
          <p>Loading...</p>
        ) : data?.ads?.length === 0 ? (
          <p className="no-ads">No advertisements uploaded yet.</p>
        ) : (
          <div className="ads-list">
            {data?.ads?.map((ad) => (
              <div key={ad.id} className="ad-item">
                <div className="ad-info">
                  <p className="ad-filename">{ad.filename}</p>
                  <p className="ad-meta">
                    {ad.mimetype} • {new Date(ad.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="ad-actions">
                  <button
                    onClick={() => handleEdit(ad)}
                    className="btn-edit"
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    onClick={() => handleDelete(ad.id, ad.filename)}
                    className="btn-delete"
                    title="Delete"
                  >
                    <FaTrash />
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
