import React, { useState, useEffect } from "react";
import "./styles/ManageDepartment.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_DEPARTMENT,
  UPDATE_DEPARTMENT,
  DELETE_DEPARTMENT,
} from "../../graphql/mutation";
import { GET_DEPARTMENTS } from "../../graphql/query";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaFolder } from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { HiOfficeBuilding } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageDepartment = ({ departments: propDepartments, setDepartments: propSetDepartments }) => {
  const [showDepartmentForm, setShowDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [newDepartment, setNewDepartment] = useState({
    name: "",
    prefix: "",
  });
  const [deletingDepartmentId, setDeletingDepartmentId] = useState(null);
  const [updatingDepartmentId, setUpdatingDepartmentId] = useState(null);

 
  const isUsingProps = propDepartments !== undefined && propSetDepartments !== undefined;
  

  const [localDepartments, setLocalDepartments] = useState([]);
  

  const departments = isUsingProps ? propDepartments : localDepartments;
  const setDepartments = isUsingProps ? propSetDepartments : setLocalDepartments;

  const { data, loading, error, refetch } = useQuery(GET_DEPARTMENTS, { 
    errorPolicy: 'all',
    fetchPolicy: "network-first" 
  });

  console.log("Department Query - Loading:", loading, "Error:", error, "Data:", data);

  const [updateDepartment, { loading: updating }] = useMutation(UPDATE_DEPARTMENT, {
    refetchQueries: [{ query: GET_DEPARTMENTS }],
    optimisticResponse: {
      __typename: "Mutation",
      updateDepartment: {
        __typename: "Department",
        departmentId: editingDepartment?.departmentId,
        departmentName: newDepartment.name,
        prefix: newDepartment.prefix,
      },
    },
    onCompleted: (data) => {
      const updatedDept = data?.updateDepartment;
      if (updatedDept) {
        setDepartments(prevDepartments => 
          prevDepartments.map(dept => 
            dept.departmentId === editingDepartment.departmentId
              ? { ...updatedDept, departmentId: editingDepartment.departmentId }
              : dept
          )
        );
      }
      setUpdatingDepartmentId(null);
      Swal.fire({
        icon: "success",
        title: "Updated!",
        text: "Department updated successfully.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Update department error:", error);
      setUpdatingDepartmentId(null);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update department!",
      });
    },
  });

  const [deleteDepartment, { loading: deleting }] = useMutation(DELETE_DEPARTMENT, {
    refetchQueries: [{ query: GET_DEPARTMENTS }],
    optimisticResponse: {
      __typename: "Mutation",
      deleteDepartment: {
        __typename: "Department",
        departmentId: null, 
      },
    },
    onCompleted: (data) => {
      const deletedDept = data?.deleteDepartment;
      if (deletedDept) {
        setDepartments(prevDepartments => 
          prevDepartments.filter(dept => dept.departmentId !== deletedDept.departmentId)
        );
      }
      setDeletingDepartmentId(null);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The department has been successfully deleted.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Delete department error:", error);
      setDeletingDepartmentId(null);
      const errorMessage = error?.graphQLErrors?.[0]?.message || error?.message || "Failed to delete department!";
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    },
  });

  const [createDepartment, { loading: creating }] = useMutation(CREATE_DEPARTMENT, {
    refetchQueries: [{ query: GET_DEPARTMENTS }],
    optimisticResponse: {
      __typename: "Mutation",
      createDepartment: {
        __typename: "Department",
        departmentId: `temp-${Date.now()}`,
        departmentName: newDepartment.name,
        prefix: newDepartment.prefix,
      },
    },
    onCompleted: (data) => {
      const createdDept = data?.createDepartment;
      if (createdDept) {
        setDepartments(prevDepartments => [...prevDepartments, createdDept]);
      }
      Swal.fire({
        icon: "success",
        title: "Created!",
        text: "New department has been created.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Create department error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to create department!",
      });
    },
  });

  useEffect(() => {
    if (Array.isArray(data?.departments)) {
      console.log("Setting departments data:", data.departments);
      setDepartments(data.departments);
    }
  }, [data, setDepartments]);

  const handleAddDepartment = async (e) => {
    e.preventDefault();

    if (editingDepartment) {
      setUpdatingDepartmentId(editingDepartment.departmentId);
      try {
        await updateDepartment({
          variables: {
            updateDepartmentInput: {
              departmentId: editingDepartment.departmentId,
              departmentName: newDepartment.name,
              prefix: newDepartment.prefix,
            },
          },
        });
      } catch (error) {
        console.error("Update error:", error);
        setUpdatingDepartmentId(null);
      }
      setEditingDepartment(null);
    } else {
      try {
        await createDepartment({
          variables: {
            createDepartmentInput: {
              departmentName: newDepartment.name,
              prefix: newDepartment.prefix,
            },
          },
        });
      } catch (error) {
        console.error("Create error:", error);
      }
    }

    setNewDepartment({ name: "", prefix: "" });
    setShowDepartmentForm(false);
  };

  const handleEditDepartment = (department) => {
    setEditingDepartment(department);
    setNewDepartment({
      name: department.departmentName,
      prefix: department.prefix || department.departmentName.slice(0, 4).toUpperCase(),
    });
    setShowDepartmentForm(true);
  };

  const handleDeleteDepartment = async (departmentId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This department will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setDeletingDepartmentId(departmentId);
      try {
        await deleteDepartment({
          variables: { removeDepartmentId: parseInt(departmentId) },
          optimisticResponse: {
            __typename: "Mutation",
            deleteDepartment: {
              __typename: "Department",
              departmentId: departmentId,
            },
          },
        });
      } catch (error) {
        console.error("Delete error:", error);
        setDeletingDepartmentId(null);
        
        refetch();
      }
    }
  };

  const handleCancelForm = () => {
    setShowDepartmentForm(false);
    setEditingDepartment(null);
    setNewDepartment({ name: "", prefix: "" });
  };

  
  if (loading) {
    console.log("Showing loading state...");
    return (
      <div className="departments-content">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading department data...</p>
        </div>
      </div>
    );
  }


  if (error) {
    console.log("Showing error state:", error);
    return (
      <div className="departments-content">
        <div className="error-message">
          Error loading department data: {error.message}
        </div>
      </div>
    );
  }

  console.log("Rendering department table with data:", departments);

  return (
    <div className="departments-content">
      <div className="departments-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Departments</h3>
            <span className="department-count">{departments.length} Total</span>
          </div>
        </div>

        <div className="departments-table">
          <table>
            <thead>
              <tr>
                <th>
                  <div className="th-content">
                    <HiOfficeBuilding className="th-icon" />
                    Department
                  </div>
                </th>
                <th>
                  <div className="th-content">
                    <IoMdSettings className="th-icon" />
                    Actions
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {departments.map((department) => {
                const isDeleting = deletingDepartmentId === department.departmentId;
                const isUpdating = updatingDepartmentId === department.departmentId;
                const isProcessing = isDeleting || isUpdating;
                
                return (
                  <tr key={department.departmentId} className={`table-row ${isProcessing ? 'processing-row' : ''}`}>
                    <td className="department-name-cell">
                      <div className="department-info">
                        <div className="department-avatar">
                          {department.departmentName.charAt(0).toUpperCase()}
                        </div>
                        <div className="department-details">
                          <span className="department-name">
                            {department.departmentName}
                            {isProcessing && (
                              <span className="processing-indicator">
                                <div className="spinner-small"></div>
                                {isDeleting ? "Deleting..." : "Updating..."}
                              </span>
                            )}
                          </span>
                          <span className="department-code">
                            {department.prefix || department.departmentName.slice(0, 4).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="actions-cell">
                      <div className="actions">
                        <button
                          onClick={() => handleEditDepartment(department)}
                          className="edit-btn"
                          title="Edit Department"
                          disabled={isProcessing || deleting || updating}
                        >
                          <FaEdit className="btn-icon" />
                          {isUpdating ? "Editing..." : "Edit"}
                        </button>
                    
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {departments.length === 0 && !loading && (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <FaFolder className="empty-icon" />
              </div>
              <h3>No Departments Yet</h3>
              <p>Start organizing your municipal by creating departments</p>
              <button
                onClick={() => setShowDepartmentForm(true)}
                className="empty-state-btn"
                disabled={creating}
              >
                <FaPlus className="btn-icon" />
                Create First Department
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => setShowDepartmentForm(true)}
          className="add-department-floating-btn"
          title="Add Department"
          disabled={creating || updating || deleting}
        >
          <FaPlus className="btn-icon" />
        </button>
      </div>

      {showDepartmentForm && (
        <div className="department-form-overlay">
          <div className="department-form-modal">
            <div className="modal-header">
              <h3>
                {editingDepartment ? "Edit Department" : "Add New Department"}
              </h3>
              <button 
                onClick={handleCancelForm} 
                className="close-modal-btn"
                disabled={creating || updating}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddDepartment}>
              <div className="form-group">
                <label>Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const prefix = name.slice(0, 4).toUpperCase();
                    setNewDepartment({
                      name: name,
                      prefix: prefix,
                    });
                  }}
                  placeholder="e.g., Waterworks, Assesor, Engineering"
                  required
                  disabled={creating || updating}
                />
              </div>

              <div className="form-group">
                <label>Department Code</label>
                <input
                  type="text"
                  value={newDepartment.prefix}
                  placeholder="Auto-generated"
                  maxLength="4"
                  readOnly
                  className="readonly-input"
                />
                <small className="form-help">
                  Automatically generated from department name
                </small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="cancel-btn"
                  disabled={creating || updating}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn"
                  disabled={creating || updating}
                >
                  {creating || updating ? (
                    <>
                      <div className="spinner-small"></div>
                      {editingDepartment ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingDepartment ? "Update Department" : "Create Department"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageDepartment;