import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useMemo } from "react";
import {
  Building2,
  Users,
  ChevronDown,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
  ArrowLeft,
  User,
  Settings,
  LogOut,
} from "lucide-react";
import "./styles/QueueForm.css";
import QueueModal from "./QueueModal";
import { useNavigate } from "react-router-dom";
import { GET_DEPARTMENTS, GET_SERVICES, GET_QUEUESTAFF_PROFILE } from "../../graphql/query";
import { CREATE_QUEUE, UPDATE_QUEUESATFF_PROFILE } from "../../graphql/mutation";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const QueueForm = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    departmentId: "",
    serviceId: "",
    priority: "",
  });
  const [queueStaffMenuOpen, setQueueStaffMenuOpen] = useState(false);

  // Get staffId from localStorage only
  const staffId = localStorage.getItem("staffId") || localStorage.getItem("userId");

  console.log("Retrieved staffId:", staffId);
  console.log("staffId type:", typeof staffId);
  console.log("Parsed staffId:", staffId ? parseInt(staffId, 10) : null); // Debug log

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff
  } = useQuery(GET_QUEUESTAFF_PROFILE, {
    variables: { 
      staffId: staffId ? parseInt(staffId, 10) : null 
    },
    skip: !staffId,
    fetchPolicy: "network-only",
    onCompleted: (data) => {
      console.log("Staff query completed:", data);
    },
    onError: (error) => {
      console.error("Staff query error:", error);
    }
  });

  console.log("Staff query result:", { staffData, staffLoading, staffError }); // Debug log

  // Handle different possible response structures
  const staffInfo = staffData?.staff || staffData?.getQueueStaffProfile || staffData?.queueStaff || null;
  
  console.log("Full staffData response:", staffData); // Debug the full response

  const {
    data: departmentsData,
    loading: departmentsLoading,
    error: departmentsError,
  } = useQuery(GET_DEPARTMENTS, {
    fetchPolicy: "network-only",
  });

  const {
    data: servicesData,
    loading: servicesLoading,
    error: servicesError,
  } = useQuery(GET_SERVICES, {
    fetchPolicy: "network-only",
    onError: (e) => {
      console.error("Services query error:", e);
      if (e?.graphQLErrors?.length)
        console.error("GQL errors:", e.graphQLErrors);
      if (e?.networkError) console.error("Network error:", e.networkError);
    },
  });

  const departmentOptions = useMemo(() => {
    const direct = Array.isArray(departmentsData?.departments)
      ? departmentsData.departments
      : null;
    if (direct && direct.length) return direct;

    const services = Array.isArray(servicesData?.services)
      ? servicesData.services
      : [];
    const map = new Map();
    for (const s of services) {
      if (s?.department?.departmentId && s?.department?.departmentName) {
        map.set(s.department.departmentId, {
          departmentId: s.department.departmentId,
          departmentName: s.department.departmentName,
        });
      }
    }
    return Array.from(map.values());
  }, [departmentsData, servicesData]);

  const [createQueue] = useMutation(CREATE_QUEUE);
  const [updateStaff] = useMutation(UPDATE_QUEUESATFF_PROFILE);

  const [queueNumber, setQueueNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [filteredServices, setFilteredServices] = useState([]);

  useEffect(() => {
    if (servicesData?.services && formData.departmentId) {
      const filtered = servicesData.services.filter(
        (service) =>
          String(service.department.departmentId) ===
          String(formData.departmentId)
      );
      setFilteredServices(filtered);
    } else {
      setFilteredServices([]);
    }
  }, [formData.departmentId, servicesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue =
      name === "departmentId" || name === "serviceId"
        ? parseInt(value, 10)
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: processedValue,
      ...(name === "departmentId" && { serviceId: "" }),
    }));
    if (error) setError("");
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.departmentId) {
      setError("Please select a department");
      return;
    }
    if (currentStep === 2 && !formData.serviceId) {
      setError("Please select a service");
      return;
    }
    if (currentStep === 3 && !formData.priority) {
      setError("Please select a priority level");
      return;
    }

    setError("");
    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const selectedService = filteredServices.find(
        (service) => String(service.serviceId) === String(formData.serviceId)
      );

      const selectedDepartment = departmentOptions?.find(
        (dept) => String(dept.departmentId) === String(formData.departmentId)
      );

      if (!selectedService || !selectedDepartment) {
        throw new Error("Selected service or department not found");
      }

      const normalizedPriority =
        String(formData.priority).toLowerCase() === "priority"
          ? "senior/pwd/pregnant"
          : "regular";

      const createQueueInput = {
        departmentId: Number(formData.departmentId),
        serviceId: Number(formData.serviceId),
        priority: normalizedPriority,
      };

      const { data } = await createQueue({
        variables: { createQueueInput },
      });

      if (data?.createQueue) {
        setQueueNumber(data.createQueue);
        setShowModal(true);

        try {
          const deptId = Number(formData.departmentId);
          if (!Number.isNaN(deptId)) {
            const channel = new BroadcastChannel(`queue-${deptId}`);
            channel.postMessage({
              type: "NEW_QUEUE",
              data: {
                queueNumber: data.createQueue,
                departmentId: deptId,
                serviceId: Number(formData.serviceId),
                priority: normalizedPriority,
                status: "Waiting",
                createdAt: new Date().toISOString(),
              },
            });
            channel.close();
          }
        } catch (e) {
          console.warn("Broadcast channel not available:", e);
        }

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 2000);
        }
      }
    } catch (error) {
      console.error("Error creating queue:", error);
      const gqlMsg =
        error?.graphQLErrors?.[0]?.message ||
        error?.networkError?.result?.errors?.[0]?.message ||
        error?.networkError?.message ||
        error?.message;
      setError(gqlMsg || "Failed to create queue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      departmentId: "",
      serviceId: "",
      priority: "",
    });
    setCurrentStep(1);
    setError("");
  };

  const handleLogout = () => {
    localStorage.removeItem("staffId");
    localStorage.removeItem("userId");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleManageAccount = () => {
    navigate("/staff/profile");
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Department Selection";
      case 2:
        return "Type of Service";
      case 3:
        return "Priority Level";
      case 4:
        return "Generate Queue Number";
      default:
        return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "Choose the destination department";
      case 2:
        return "Select the type of service";
      case 3:
        return "Choose priority level";
      case 4:
        return "Review information and generate queue number";
      default:
        return "";
    }
  };

  const getSelectedDepartmentName = () => {
    const dept = departmentOptions?.find(
      (d) => d.departmentId === formData.departmentId
    );
    return dept?.departmentName || "";
  };

  const getSelectedServiceName = () => {
    const service = filteredServices.find(
      (s) => s.serviceId === formData.serviceId
    );
    return service?.serviceName || "";
  };

  const hasDeptArray = Array.isArray(departmentsData?.departments);
  const hasServicesArray = Array.isArray(servicesData?.services);
  
  // Show loading state while fetching staff data
  if (staffLoading) {
    return (
      <div className="queue-page-wrapper">
        <Header />
        <div className="queue-home-container">
          <div className="queue-loading-message">
            <Loader2 className="queue-spinner" size={24} />
            <p>Loading staff information...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error if staff data fails to load
  if (staffError) {
    console.error("Staff query error details:", staffError);
    return (
      <div className="queue-page-wrapper">
        <Header />
        <div className="queue-home-container">
          <div className="queue-error-message">
            <p>Error loading staff information: {staffError.message}</p>
            <p>Staff ID used: {staffId}</p>
            <button 
              className="queue-retry-btn" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (
    !departmentsLoading &&
    !servicesLoading &&
    !hasDeptArray &&
    !hasServicesArray
  ) {
    return (
      <div className="queue-page-wrapper">
        <Header />
        <div className="queue-home-container">
          <div className="queue-error-message">
            <p>Error loading data. Please refresh the page.</p>
            <p>
              {(departmentsError?.graphQLErrors?.[0]?.message ||
                departmentsError?.message ||
                servicesError?.graphQLErrors?.[0]?.message ||
                servicesError?.message) ??
                ""}
            </p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Get staff display info from fetched GraphQL data with better error handling
  const staffDisplayName = staffInfo
    ? `${staffInfo.staffFirstname || staffInfo.firstName || ''} ${staffInfo.staffLastname || staffInfo.lastName || ''}`.trim()
    : "Loading...";

  console.log("Staff info for display:", { 
    staffInfo, 
    staffDisplayName,
    fullStaffData: staffData 
  }); // Debug log

  return (
    <div className="queue-page-wrapper">
      <Header />
      <div className="queue-home-container">
        {/* Enhanced User Menu */}
        <div className="queue-staff-menu-container">
          <button 
            className="queue-staff-menu-toggle"
            onClick={() => setQueueStaffMenuOpen(!queueStaffMenuOpen)}
          >
            <div className="queue-staff-avatar">
              <User size={20} />
            </div>
            <div className="queue-staff-info">
              <span className="queue-staff-name">{staffDisplayName}</span>
              <span className="queue-staff-role">staff</span>
            </div>
            <ChevronDown size={18} className={`queue-staff-chevron ${queueStaffMenuOpen ? 'queue-staff-chevron-open' : ''}`} />
          </button>
          
          {queueStaffMenuOpen && (
            <div className="queue-staff-menu-dropdown">
              <button className="queue-staff-menu-item" onClick={handleManageAccount}>
                <Settings size={18} />
                <span>Manage Account</span>
              </button>
              <div className="queue-staff-menu-divider"></div>
              <button className="queue-staff-menu-item queue-staff-menu-logout" onClick={handleLogout}>
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>

        <div className="queue-form-container">
          <div className="queue-form-header">
            <div className="queue-progress-container">
              <div className="queue-progress-steps">
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`queue-progress-step ${currentStep >= step ? "queue-progress-step-active" : ""} ${currentStep > step ? "queue-progress-step-completed" : ""}`}
                  >
                    <div className="queue-step-circle">
                      {currentStep > step ? <Check size={14} /> : step}
                    </div>
                    <div className="queue-step-label">Step {step}</div>
                  </div>
                ))}
              </div>
              <div className="queue-progress-bar">
                <div
                  className="queue-progress-fill"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                ></div>
              </div>
            </div>

            <div className="queue-form-title-section">
              <h2 className="queue-form-title">{getStepTitle()}</h2>
              <p className="queue-form-subtitle">{getStepSubtitle()}</p>
            </div>
          </div>

          <div className="queue-form-wrapper">
            {error && (
              <div className="queue-error-message">
                <p>{error}</p>
              </div>
            )}

            <div className="queue-form">
              <div className="queue-form-slides">
                {currentStep === 1 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Building2 className="queue-section-icon" size={20} />
                          Select Department
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="departmentId">Department</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="departmentId"
                            name="departmentId"
                            value={formData.departmentId}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                            disabled={departmentsLoading}
                          >
                            <option value="" disabled>
                              {departmentsLoading
                                ? "Loading departments..."
                                : "-- Select Department --"}
                            </option>
                            {departmentOptions?.map((dept) => (
                              <option
                                key={dept.departmentId}
                                value={dept.departmentId}
                              >
                                {dept.departmentName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="queue-select-arrow" size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Users className="queue-section-icon" size={20} />
                          Type of Service
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="serviceId">Service Type</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="serviceId"
                            name="serviceId"
                            value={formData.serviceId}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                            disabled={servicesLoading || !formData.departmentId}
                          >
                            <option value="" disabled>
                              {!formData.departmentId
                                ? "Please select a department first"
                                : servicesLoading
                                  ? "Loading services..."
                                  : "-- Select Service Type --"}
                            </option>
                            {filteredServices.map((service) => (
                              <option
                                key={service.serviceId}
                                value={service.serviceId}
                              >
                                {service.serviceName}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="queue-select-arrow" size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 3 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>
                          <Users className="queue-section-icon" size={20} />
                          Priority Level
                        </h3>
                      </div>

                      <div className="queue-form-group">
                        <label htmlFor="priority">Priority Level</label>
                        <div className="queue-select-wrapper">
                          <select
                            id="priority"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            required
                            className="queue-form-select"
                          >
                            <option value="" disabled>
                              -- Select Priority --
                            </option>
                            <option value="Regular">Regular</option>
                            <option value="Priority">
                              Priority (Senior/PWD/Pregnant)
                            </option>
                          </select>
                          <ChevronDown className="queue-select-arrow" size={14} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentStep === 4 && (
                  <div className="queue-form-slide queue-form-slide-active">
                    <div className="queue-form-section">
                      <div className="queue-section-header">
                        <h3>Review Your Information</h3>
                      </div>

                      <div className="queue-review-info">
                        <div className="queue-review-item">
                          <strong>Department:</strong>
                          <span>{getSelectedDepartmentName()}</span>
                        </div>
                        <div className="queue-review-item">
                          <strong>Service Type:</strong>
                          <span>{getSelectedServiceName()}</span>
                        </div>
                        <div className="queue-review-item">
                          <strong>Priority Level:</strong>
                          <span>{formData.priority}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Form Actions */}
              <div className="queue-form-actions">
                <div className="queue-actions-left">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      className="queue-previous-btn"
                      onClick={handlePrevious}
                      disabled={isSubmitting}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </button>
                  )}
                </div>

                <div className="queue-actions-center">
                  {currentStep >= 2 && (
                    <button 
                      type="button" 
                      className="queue-reset-btn" 
                      onClick={resetForm}
                    >
                      <RotateCcw size={16} />
                      Reset
                    </button>
                  )}
                </div>

                <div className="queue-actions-right">
                  {currentStep < 4 ? (
                    <button type="button" className="queue-next-btn" onClick={handleNext}>
                      Next
                      <ArrowRight size={16} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      className={`queue-submit-btn ${isSubmitting ? "queue-submit-btn-loading" : ""}`}
                      disabled={isSubmitting}
                      onClick={handleSubmit}
                    >
                      {!isSubmitting ? (
                        <>
                          <span>Generate Queue Number</span>
                          <ArrowRight size={18} />
                        </>
                      ) : (
                        <>
                          <Loader2 className="queue-spinner" size={18} />
                          <span>Processing...</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {showModal && (
            <QueueModal
              queueNumber={queueNumber}
              department={getSelectedDepartmentName()}
              onClose={() => {
                setShowModal(false);
                resetForm();
                if (onSuccess) {
                  onSuccess();
                }
              }}
            />
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QueueForm;