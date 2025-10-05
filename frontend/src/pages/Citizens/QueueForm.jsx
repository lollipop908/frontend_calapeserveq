import React, { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Users,
  ChevronDown,
  ArrowRight,
  Loader2,
  RotateCcw,
  Check,
} from "lucide-react";
import "./styles/QueueForm.css";
import QueueModal from "./QueueModal";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import { useNavigate } from "react-router-dom";

const QueueForm = ({ onBack }) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    department: "",
    citizenType: "",
    priority: "",
  });

  const departments = [
    { id: 1, departmentName: "Business Permits and Licensing", prefix: "BPL" },
    { id: 2, departmentName: "Civil Registry Office", prefix: "CRO" },
    { id: 3, departmentName: "Municipal Assessor's Office", prefix: "MAO" },
    { id: 4, departmentName: "Municipal Treasurer's Office", prefix: "MTO" },
    { id: 5, departmentName: "Municipal Planning Office", prefix: "MPO" },
    { id: 6, departmentName: "Social Services", prefix: "SSO" },
    { id: 7, departmentName: "Municipal Mayor's Office", prefix: "MMO" },
    { id: 8, departmentName: "Municipal Engineering Office", prefix: "MEO" },
  ];

  const [queueNumber, setQueueNumber] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleNext = () => {
    if (currentStep === 1 && !formData.department) {
      setError("Please select a department");
      return;
    }
    if (currentStep === 2 && !formData.citizenType) {
      setError("Please select a service type");
      return;
    }
    if (currentStep === 3 && !formData.priority) {
      setError("Please select a priority level");
      return;
    }
    
    setError("");
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError("");
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError("");

    try {
      const selectedDepartment = departments.find(
        (dept) => dept.departmentName === formData.department
      );

      if (!selectedDepartment) {
        throw new Error("Selected department not found");
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      const queueNum = Math.floor(Math.random() * 999) + 1;
      const displayQueueNumber = `${selectedDepartment.prefix}-${queueNum
        .toString()
        .padStart(3, "0")}`;

      setQueueNumber(displayQueueNumber);
      setShowModal(true);
    } catch (error) {
      setError(error.message || "Failed to create queue. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      department: "",
      citizenType: "",
      priority: "",
    });
    setCurrentStep(1);
    setError("");
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1: return "Department Selection";
      case 2: return "Type of Service";
      case 3: return "Priority Level";
      case 4: return "Generate Queue Number";
      default: return "";
    }
  };

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1: return "Choose your destination municipal department";
      case 2: return "Select the type of service you need";
      case 3: return "Choose your priority level";
      case 4: return "Review your information and generate queue number";
      default: return "";
    }
  };

  return (
    <div className="home-container">
      <Header />
      <div className="back-btn-container">
        <button className="back-btn-header" onClick={() => navigate("/home")}>
          <ArrowLeft className="back-icon" size={18} />
          Back to Home
        </button>
      </div>
      
      <div className="queue-form-container">
        <div className="form-header">
          <div className="progress-container">
            <div className="progress-steps">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''} ${currentStep > step ? 'completed' : ''}`}>
                  <div className="step-circle">
                    {currentStep > step ? <Check size={14} /> : step}
                  </div>
                  <div className="step-label">
                    Step {step}
                  </div>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          <div className="form-title-section">
            <h2 className="form-title">{getStepTitle()}</h2>
            <p className="form-subtitle">{getStepSubtitle()}</p>
          </div>
        </div>

        <div className="form-wrapper">
          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="queue-form">
            <div className="form-slides">
              {/* Step 1: Department Selection */}
              {currentStep === 1 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Building2 className="section-icon" size={20} />
                        Select Department
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="department">Department</label>
                      <div className="select-wrapper">
                        <select
                          id="department"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                          className="form-select"
                        >
                          <option value="" disabled>
                            -- Select Department --
                          </option>
                          {departments.map((dept) => (
                            <option key={dept.id} value={dept.departmentName}>
                              {dept.departmentName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Service Type */}
              {currentStep === 2 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Users className="section-icon" size={20} />
                        Type of Service
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="citizenType">Service Type</label>
                      <div className="select-wrapper">
                        <select
                          id="citizenType"
                          name="citizenType"
                          value={formData.citizenType}
                          onChange={handleChange}
                          required
                          className="form-select"
                        >
                          <option value="" disabled>
                            -- Select Service Type --
                          </option>
                          <option value="New Application">New Application</option>
                          <option value="Renewal">Renewal</option>
                          <option value="Follow-up">Follow-up</option>
                          <option value="Inquiry">Inquiry</option>
                        </select>
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Priority Level */}
              {currentStep === 3 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>
                        <Users className="section-icon" size={20} />
                        Priority Level
                      </h3>
                    </div>

                    <div className="form-group">
                      <label htmlFor="priority">Priority Level</label>
                      <div className="select-wrapper">
                        <select
                          id="priority"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          required
                          className="form-select"
                        >
                          <option value="" disabled>
                            -- Select Priority --
                          </option>
                          <option value="Regular">Regular</option>
                          <option value="Priority">Priority (Senior/PWD/Pregnant)</option>
                        </select>
                        <ChevronDown className="select-arrow" size={14} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review and Submit */}
              {currentStep === 4 && (
                <div className="form-slide active">
                  <div className="form-section">
                    <div className="section-header">
                      <h3>Review Your Information</h3>
                    </div>

                    <div className="review-info">
                      <div className="review-item">
                        <strong>Department:</strong>
                        <span>{formData.department}</span>
                      </div>
                      <div className="review-item">
                        <strong>Service Type:</strong>
                        <span>{formData.citizenType}</span>
                      </div>
                      <div className="review-item">
                        <strong>Priority Level:</strong>
                        <span>{formData.priority}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="form-actions">
              {currentStep > 1 && (
                <button 
                  type="button" 
                  className="previous-btn" 
                  onClick={handlePrevious}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                  Previous
                </button>
              )}

              {currentStep < 4 ? (
                <button 
                  type="button" 
                  className="next-btn" 
                  onClick={handleNext}
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  className={`submit-btn ${isSubmitting ? "loading" : ""}`}
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
                      <Loader2 className="spinner" size={18} />
                      <span>Processing...</span>
                    </>
                  )}
                </button>
              )}

              <button type="button" className="reset-btn" onClick={resetForm}>
                <RotateCcw size={16} />
                Reset
              </button>
            </div>
          </div>
        </div>

        {showModal && (
          <QueueModal
            queueNumber={queueNumber}
            department={formData.department}
            onClose={() => {
              setShowModal(false);
              resetForm();
            }}
          />
        )}
      </div>

      <Footer />
    </div>
  );
};

export default QueueForm;