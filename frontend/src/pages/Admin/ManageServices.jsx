import React, { useState, useEffect } from "react";
import "./styles/ManageServices.css";
import { useMutation, useQuery } from "@apollo/client";
import {
  CREATE_SERVICE,
  UPDATE_SERVICE,
  DELETE_SERVICE,
} from "../../graphql/mutation";
import { GET_SERVICES, GET_DEPARTMENTS } from "../../graphql/query";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaConciergeBell,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";
import { IoMdSettings } from "react-icons/io";
import { MdMiscellaneousServices } from "react-icons/md";
import { HiOfficeBuilding } from "react-icons/hi";
import Swal from "sweetalert2";

const ManageServices = () => {
  const [services, setServices] = useState([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [newService, setNewService] = useState({
    serviceName: "",
    departmentId: "",
  });
  const [collapsedDepartments, setCollapsedDepartments] = useState(new Set());
  const [deletingServiceId, setDeletingServiceId] = useState(null);
  const [updatingServiceId, setUpdatingServiceId] = useState(null);

  // Add proper loading and error states for both queries
  const { data: servicesData, loading: servicesLoading, error: servicesError, refetch: refetchServices } = useQuery(GET_SERVICES);
  const { data: departmentsData, loading: departmentsLoading, error: departmentsError } = useQuery(GET_DEPARTMENTS);

  // Check if any data is still loading
  const isLoading = servicesLoading || departmentsLoading;
  
  // Check if any query has errors
  const hasError = servicesError || departmentsError;

  const [createService, { loading: creating }] = useMutation(CREATE_SERVICE, {
    refetchQueries: [{ query: GET_SERVICES }],
    optimisticResponse: {
      __typename: "Mutation",
      createService: {
        __typename: "Service",
        serviceId: `temp-${Date.now()}`,
        serviceName: newService.serviceName,
        department: departmentsData?.departments?.find(
          dept => dept.departmentId === parseInt(newService.departmentId)
        ) || null,
      },
    },
    onCompleted: (data) => {
      // Update local state immediately
      const createdService = data?.createService;
      if (createdService) {
        setServices(prevServices => [...prevServices, createdService]);
      }
      Swal.fire({
        icon: "success",
        title: "Service created!",
        text: "The new service has been added successfully.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Create service error:", error);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: error.message || "Failed to create service!",
      });
    },
  });

  const [updateService, { loading: updating }] = useMutation(UPDATE_SERVICE, {
    refetchQueries: [{ query: GET_SERVICES }],
    optimisticResponse: {
      __typename: "Mutation",
      updateService: {
        __typename: "Service",
        serviceId: editingService?.serviceId,
        serviceName: newService.serviceName,
        department: departmentsData?.departments?.find(
          dept => dept.departmentId === parseInt(newService.departmentId)
        ) || null,
      },
    },
    onCompleted: (data) => {
      // Update local state immediately
      const updatedService = data?.updateService;
      if (updatedService) {
        setServices(prevServices => 
          prevServices.map(service => 
            service.serviceId === editingService.serviceId ? updatedService : service
          )
        );
      }
      setUpdatingServiceId(null);
      Swal.fire({
        icon: "success",
        title: "Service updated!",
        text: "Service updated successfully!",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Update service error:", error);
      setUpdatingServiceId(null);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to update service!",
      });
    },
  });

  const [deleteService, { loading: deleting }] = useMutation(DELETE_SERVICE, {
    refetchQueries: [{ query: GET_SERVICES }],
    optimisticResponse: {
      __typename: "Mutation",
      deleteService: {
        __typename: "Service",
        serviceId: null, // Will be provided when calling the mutation
      },
    },
    onCompleted: (data) => {
      // Update local state immediately
      const deletedService = data?.deleteService;
      if (deletedService) {
        setServices(prevServices => 
          prevServices.filter(service => service.serviceId !== deletedService.serviceId)
        );
      }
      setDeletingServiceId(null);
      Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The service has been successfully deleted.",
        confirmButtonColor: "#3085d6",
      });
    },
    onError: (error) => {
      console.error("Delete service error:", error);
      setDeletingServiceId(null);
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Failed to delete service!",
      });
    },
  });

  useEffect(() => {
    if (servicesData && servicesData.services) {
      setServices(servicesData.services);
    }
  }, [servicesData]);

  const groupedServices = services.reduce((acc, service) => {
    const deptId = service.department?.departmentId || "unassigned";
    const deptName = service.department?.departmentName || "Unassigned Department";

    if (!acc[deptId]) {
      acc[deptId] = {
        departmentId: deptId,
        departmentName: deptName,
        services: [],
      };
    }
    acc[deptId].services.push(service);
    return acc;
  }, {});

  const departmentGroups = Object.values(groupedServices).sort((a, b) => {
    if (a.departmentId === "unassigned") return 1;
    if (b.departmentId === "unassigned") return -1;
    return a.departmentName.localeCompare(b.departmentName);
  });

  const toggleDepartment = (deptId) => {
    setCollapsedDepartments((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deptId)) {
        newSet.delete(deptId);
      } else {
        newSet.add(deptId);
      }
      return newSet;
    });
  };

  const handleAddService = async (e) => {
    e.preventDefault();

    if (editingService) {
      setUpdatingServiceId(editingService.serviceId);
      try {
        await updateService({
          variables: {
            updateServiceInput: {
              serviceId: editingService.serviceId,
              serviceName: newService.serviceName,
              departmentId: parseInt(newService.departmentId),
            },
          },
        });
      } catch (error) {
        console.error("Update error:", error);
        setUpdatingServiceId(null);
      }
      setEditingService(null);
    } else {
      try {
        await createService({
          variables: {
            createServiceInput: {
              serviceName: newService.serviceName,
              departmentId: parseInt(newService.departmentId),
            },
          },
        });
      } catch (error) {
        console.error("Create error:", error);
      }
    }

    setNewService({ serviceName: "", departmentId: "" });
    setShowServiceForm(false);
  };

  const handleEditService = async (service) => {
    const result = await Swal.fire({
      title: "Edit Service?",
      text: `Do you want to edit "${service.serviceName}"?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, edit it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setEditingService(service);
        setNewService({
          serviceName: service.serviceName,
          departmentId: service.department?.departmentId || "",
        });
        setShowServiceForm(true);

        Swal.fire({
          icon: "success",
          title: "Editing Mode Activated!",
          text: "You can now update this service's details.",
          confirmButtonColor: "#3085d6",
        });
      } catch (error) {
        console.error(error);
        Swal.fire({
          icon: "error",
          title: "Oops...",
          text: "Something went wrong while preparing the edit form!",
        });
      }
    }
  };

  const handleDeleteService = async (serviceId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This service will be permanently deleted.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      setDeletingServiceId(serviceId);
      try {
        await deleteService({
          variables: { serviceId: serviceId },
          optimisticResponse: {
            __typename: "Mutation",
            deleteService: {
              __typename: "Service",
              serviceId: serviceId,
            },
          },
        });
      } catch (error) {
        console.error("Delete error:", error);
        setDeletingServiceId(null);
        // Rollback by refetching
        refetchServices();
      }
    }
  };

  const handleCancelForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
    setNewService({ serviceName: "", departmentId: "" });
  };

  // Loading State
  if (isLoading) {
    return (
      <div className="services-content">
        <div className="loading-overlay">
          <div className="spinner"></div>
          <p>Loading services data...</p>
        </div>
      </div>
    );
  }

  // Error State
  if (hasError) {
    const errorMessage = servicesError?.message || departmentsError?.message || "Unknown error occurred";
    return (
      <div className="services-content">
        <div className="error-message">
          Error loading services data: {errorMessage}
        </div>
      </div>
    );
  }

  return (
    <div className="services-content">
      <div className="services-table-container">
        <div className="table-header">
          <div className="table-title">
            <h3>All Services</h3>
            <span className="service-count">{services.length} Total</span>
          </div>
        </div>

        <div className="services-grouped">
          {departmentGroups.length > 0 ? (
            departmentGroups.map((group) => (
              <div key={group.departmentId} className="department-group">
                <div
                  className="department-header"
                  onClick={() => toggleDepartment(group.departmentId)}
                >
                  <div className="department-info">
                    <div className="department-avatar">
                      <HiOfficeBuilding className="department-icon" />
                    </div>
                    <div className="department-details">
                      <h3 className="department-name">{group.departmentName}</h3>
                      <span className="service-badge">
                        {group.services.length} {group.services.length === 1 ? "Service" : "Services"}
                      </span>
                    </div>
                  </div>
                  <button className="collapse-btn">
                    {collapsedDepartments.has(group.departmentId) ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronUp />
                    )}
                  </button>
                </div>

                {!collapsedDepartments.has(group.departmentId) && (
                  <div className="services-list">
                    {group.services.map((service) => {
                      const isDeleting = deletingServiceId === service.serviceId;
                      const isUpdating = updatingServiceId === service.serviceId;
                      const isProcessing = isDeleting || isUpdating;
                      
                      return (
                        <div 
                          key={service.serviceId} 
                          className={`service-card ${isProcessing ? 'processing-service' : ''}`}
                        >
                          <div className="service-info">
                            <div className="service-icon">
                              <FaConciergeBell />
                            </div>
                            <div className="service-details">
                              <span className="service-name">
                                {service.serviceName}
                                {isProcessing && (
                                  <span className="processing-indicator">
                                    <div className="spinner-small"></div>
                                    {isDeleting ? "Deleting..." : "Updating..."}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="service-actions">
                            <button
                              onClick={() => handleEditService(service)}
                              className="edit-btn"
                              title="Edit Service"
                              disabled={isProcessing}
                            >
                              <FaEdit className="btn-icon" />
                              {isUpdating ? "Editing..." : "Edit"}
                            </button>
                            <button
                              onClick={() => handleDeleteService(service.serviceId)}
                              className="delete-btn"
                              title="Delete Service"
                              disabled={isProcessing}
                            >
                              <FaTrash className="btn-icon" />
                              {isDeleting ? "Deleting..." : "Delete"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <FaConciergeBell className="empty-icon" />
              </div>
              <h3>No Services Yet</h3>
              <p>Start by adding services to your municipal system</p>
              <button
                onClick={() => setShowServiceForm(true)}
                className="empty-state-btn"
              >
                <FaPlus className="btn-icon" />
                Create First Service
              </button>
            </div>
          )}
        </div>

        {/* Add Service Floating Button */}
        <button
          onClick={() => setShowServiceForm(true)}
          className="add-service-floating-btn"
          title="Add Service"
          disabled={creating || updating}
        >
          <FaPlus className="btn-icon" />
        </button>
      </div>

      {showServiceForm && (
        <div className="service-form-overlay">
          <div className="service-form-modal">
            <div className="modal-header">
              <h3>{editingService ? "Edit Service" : "Add New Service"}</h3>
              <button 
                onClick={handleCancelForm} 
                className="close-modal-btn"
                disabled={creating || updating}
              >
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddService}>
              <div className="form-group">
                <label>Type of Service</label>
                <input
                  type="text"
                  value={newService.serviceName}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      serviceName: e.target.value,
                    })
                  }
                  placeholder="e.g., Building Permit, Business License, Water Connection"
                  required
                  disabled={creating || updating}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <select
                  value={newService.departmentId}
                  onChange={(e) =>
                    setNewService({
                      ...newService,
                      departmentId: e.target.value,
                    })
                  }
                  required
                  disabled={creating || updating}
                >
                  <option value="">Select Department</option>
                  {departmentsData?.departments?.map((dept) => (
                    <option key={dept.departmentId} value={dept.departmentId}>
                      {dept.departmentName}
                    </option>
                  ))}
                </select>
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
                      {editingService ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    editingService ? "Update Service" : "Create Service"
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

export default ManageServices;