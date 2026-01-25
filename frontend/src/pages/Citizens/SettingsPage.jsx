import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Palette,
  Save,
  Eye,
  EyeOff,
  Loader2,
  WifiOff,
  X,
} from "lucide-react";
import "./styles/SettingsPage.css";
import { useMutation, useQuery } from "@apollo/client";
import { GET_QUEUESTAFF_PROFILE } from "../../graphql/query";
import { UPDATE_PASSWORD } from "../../graphql/mutation";

const SettingsPage = ({ onClose }) => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("account");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const getQueueStaffCredentials = () => {
    if (location.pathname.includes("/queuestaff/dashboard")) {
      const id = localStorage.getItem("queueStaffId");
      const username = localStorage.getItem("queueStaffUsername");
      const queueStaffInfoStr = localStorage.getItem("queueStaffInfo");

      if (id) {
        if (queueStaffInfoStr) {
          try {
            const parsed = JSON.parse(queueStaffInfoStr);
            const parsedRole = parsed.role?.toLowerCase().replace(/\s+/g, "");
            if (
              parsedRole === "queuestaff" &&
              parsed.id &&
              String(parsed.id) === String(id)
            ) {
              return {
                staffId: id,
                staffUsername:
                  parsed.username || username || "Queue Staff User",
              };
            }
          } catch (e) {
            console.error("Error parsing queueStaffInfo:", e);
          }
        }

        return {
          staffId: id,
          staffUsername: username || "Queue Staff User",
        };
      }

      console.warn(
        "No queuestaff-specific data found in localStorage for route:",
        location.pathname
      );
      return {
        staffId: null,
        staffUsername: null,
      };
    }
    return {
      staffId: localStorage.getItem("queueStaffId"),
      staffUsername: localStorage.getItem("queueStaffUsername"),
    };
  };

  const { staffId, staffUsername } = getQueueStaffCredentials();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const {
    data: staffData,
    loading: staffLoading,
    error: staffError,
    refetch: refetchStaff,
  } = useQuery(GET_QUEUESTAFF_PROFILE, {
    variables: {
      staffId: staffId ? parseInt(staffId, 10) : null,
    },
    skip: !staffId,
    fetchPolicy: "network-only",
  });

  const staffInfo =
    staffData?.staff ||
    staffData?.getQueueStaffProfile ||
    staffData?.queueStaff ||
    null;

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [themeSettings, setThemeSettings] = useState({
    theme: localStorage.getItem("theme") || "light",
  });

  const [updatePassword] = useMutation(UPDATE_PASSWORD);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") || "light";
    document.documentElement.setAttribute("data-theme", savedTheme);
  }, []);

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
    setMessage({ type: "", text: "" });
  };

  const handleThemeChange = (theme) => {
    setThemeSettings({ theme });
    localStorage.setItem("theme", theme);
    document.documentElement.setAttribute("data-theme", theme);

    try {
      const channel = new BroadcastChannel("theme-updates");
      channel.postMessage({ type: "THEME_CHANGED", theme });
      channel.close();
    } catch (e) {
      console.warn("BroadcastChannel not available:", e);
    }

    setMessage({
      type: "success",
      text: `Theme changed to ${theme}`,
    });
    setTimeout(() => setMessage({ type: "", text: "" }), 3000);
  };

  const handlePasswordSubmit = async (e) => {
  e.preventDefault();

  if (!isOnline) {
    setMessage({
      type: "error",
      text: "No internet connection. Please check your network.",
    });
    return;
  }

  const { currentPassword, newPassword, confirmPassword } = passwordForm;

  // Validation
  if (!currentPassword) {
    setMessage({ type: "error", text: "Current password is required" });
    return;
  }

  if (!newPassword) {
    setMessage({ type: "error", text: "New password is required" });
    return;
  }

  if (newPassword !== confirmPassword) {
    setMessage({ type: "error", text: "New passwords do not match" });
    return;
  }

  if (newPassword.length < 6) {
    setMessage({ 
      type: "error", 
      text: "New password must be at least 6 characters" 
    });
    return;
  }

  // Validate current password (you might need to implement this on backend)
  // For now, we'll assume the backend handles current password validation
  // If your backend requires current password, add it to the mutation
  
  setIsSubmitting(true);
  setMessage({ type: "", text: "" });

  try {
    // Make sure staffId is properly parsed as a float
    const { data } = await updatePassword({
      variables: {
        staffId: parseFloat(staffId), // Use parseFloat instead of parseInt
        newPassword: newPassword,
      },
    });

    // Check the response structure - adjust based on what your backend returns
    if (data?.updatePassword) {
      setMessage({ 
        type: "success", 
        text: "Password updated successfully!" 
      });
      setPasswordForm({ 
        currentPassword: "", 
        newPassword: "", 
        confirmPassword: "" 
      });

      setTimeout(() => setMessage({ type: "", text: "" }), 3000);
    } else {
      throw new Error("Unexpected response from server");
    }
  } catch (error) {
    console.error("Error updating password:", error);
    
    // More detailed error handling
    let errorMessage = "Failed to update password";
    
    if (error.graphQLErrors && error.graphQLErrors.length > 0) {
      errorMessage = error.graphQLErrors[0].message;
    } else if (error.networkError) {
      errorMessage = "Network error - please check your connection";
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    setMessage({
      type: "error",
      text: errorMessage
    });
  } finally {
    setIsSubmitting(false);
  }
};

  if (staffLoading) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div
          className="settings-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-loading-container">
            <Loader2 className="settings-spinner" size={40} />
            <p>Loading settings...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isOnline || staffError) {
    return (
      <div className="settings-modal-overlay" onClick={onClose}>
        <div
          className="settings-modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="settings-error-container">
            <WifiOff size={48} className="settings-error-icon" />
            <h2>Connection Error</h2>
            <p>
              {!isOnline
                ? "No internet connection. Please check your network."
                : staffError?.message || "Failed to load settings."}
            </p>
            <button
              className="settings-retry-btn"
              onClick={() => {
                if (isOnline) {
                  refetchStaff();
                } else {
                  window.location.reload();
                }
              }}
            >
              Retry
            </button>
            <button className="settings-back-btn-error" onClick={onClose}>
              <ArrowLeft size={18} />
              Back to Queue Form
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="settings-modal-overlay" onClick={onClose}>
      <div
        className="settings-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="settings-header">
          <button className="settings-back-btn" onClick={onClose}>
            <ArrowLeft size={18} />
          </button>
          <div className="settings-header-content">
            <h1 className="settings-title">Queue Staff Settings</h1>
            <p className="settings-subtitle">
              Manage your queue staff account preferences
            </p>
          </div>
          <button className="settings-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Offline Warning */}
        {!isOnline && (
          <div className="settings-message settings-message-warning">
            <WifiOff size={16} />
            <span>You are currently offline. Some features may not work.</span>
          </div>
        )}

        {/* Message Display */}
        {message.text && (
          <div className={`settings-message settings-message-${message.type}`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${
              activeTab === "account" ? "settings-tab-active" : ""
            }`}
            onClick={() => setActiveTab("account")}
          >
            <User size={16} />
            <span>Account</span>
          </button>
          <button
            className={`settings-tab ${
              activeTab === "theme" ? "settings-tab-active" : ""
            }`}
            onClick={() => setActiveTab("theme")}
          >
            <Palette size={16} />
            <span>Theme</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="settings-content-area">
          {activeTab === "account" && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Queue Staff Account Information</h2>
                <p>View your queue staff account details</p>
              </div>

              {/* Account Info - Read Only */}
              <div className="settings-info-section">
                <div className="settings-info-item">
                  <label>Username</label>
                  <div className="settings-info-value">{staffUsername}</div>
                </div>

                <div className="settings-info-item">
                  <label>First Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffFirstname ||
                      staffInfo?.firstName ||
                      staffInfo?.firstname}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>Last Name</label>
                  <div className="settings-info-value">
                    {staffInfo?.staffLastname ||
                      staffInfo?.lastName ||
                      staffInfo?.lastname}
                  </div>
                </div>

                <div className="settings-info-item">
                  <label>User Type</label>
                  <div className="settings-info-value">Queue Staff</div>
                </div>
              </div>

              <div className="settings-divider"></div>

              {/* Password Change Form */}
              <form onSubmit={handlePasswordSubmit} className="settings-form">
                <h3 className="settings-subsection-title">Change Password</h3>
                <p className="settings-subsection-subtitle">
                  Update your queue staff account password
                </p>

                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password *</label>
                  <div className="settings-password-wrapper">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      className="settings-input"
                      required
                    />
                    <button
                      type="button"
                      className="settings-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="settings-form-row">
                  <div className="settings-form-group">
                    <label htmlFor="newPassword">New Password *</label>
                    <div className="settings-password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        name="newPassword"
                        value={passwordForm.newPassword}
                        onChange={handlePasswordChange}
                        className="settings-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="settings-form-group">
                    <label htmlFor="confirmPassword">
                      Confirm New Password *
                    </label>
                    <div className="settings-password-wrapper">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="confirmPassword"
                        name="confirmPassword"
                        value={passwordForm.confirmPassword}
                        onChange={handlePasswordChange}
                        className="settings-input"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        className="settings-password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? (
                          <EyeOff size={16} />
                        ) : (
                          <Eye size={16} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="settings-form-actions">
                  <button
                    type="submit"
                    className="settings-save-btn"
                    disabled={isSubmitting || !isOnline}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="settings-spinner" size={16} />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save size={16} />
                        Update Password
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === "theme" && (
            <div className="settings-section">
              <div className="settings-section-header">
                <h2>Theme Preferences</h2>
                <p>Choose your preferred color scheme</p>
              </div>

              <div className="theme-options">
                <div
                  className={`theme-option ${
                    themeSettings.theme === "light" ? "theme-option-active" : ""
                  }`}
                  onClick={() => handleThemeChange("light")}
                >
                  <div className="theme-preview theme-preview-light">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Light</h3>
                    <p>Classic bright theme</p>
                  </div>
                  {themeSettings.theme === "light" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>

                <div
                  className={`theme-option ${
                    themeSettings.theme === "dark" ? "theme-option-active" : ""
                  }`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <div className="theme-preview theme-preview-dark">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Dark</h3>
                    <p>Easy on the eyes</p>
                  </div>
                  {themeSettings.theme === "dark" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>

                <div
                  className={`theme-option ${
                    themeSettings.theme === "dim" ? "theme-option-active" : ""
                  }`}
                  onClick={() => handleThemeChange("dim")}
                >
                  <div className="theme-preview theme-preview-dim">
                    <div className="theme-preview-header"></div>
                    <div className="theme-preview-body"></div>
                  </div>
                  <div className="theme-info">
                    <h3>Dim Light</h3>
                    <p>Softer alternative</p>
                  </div>
                  {themeSettings.theme === "dim" && (
                    <div className="theme-checkmark">✓</div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
 