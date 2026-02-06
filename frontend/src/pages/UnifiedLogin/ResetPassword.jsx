import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client";
import { RESET_PASSWORD_WITH_TOKEN } from "../../graphql/mutation";
import Swal from "sweetalert2";
import "./styles/Login.css";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [resetPassword] = useMutation(RESET_PASSWORD_WITH_TOKEN);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Mismatch",
        text: "Passwords do not match.",
      });
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword({
        variables: { token, newPassword },
      });

      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: "Success",
        text: "Your password has been reset successfully. Please login with your new password.",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      setIsLoading(false);
      Swal.fire({
        icon: "error",
        title: "Error",
        text:
          error.message || "Failed to reset password. The link may be expired.",
      });
    }
  };

  return (
    <div className="login-page">
      <Header />
      <div className="login-background">
        <div className="bg-overlay"></div>
      </div>
      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <h1 className="login-title">Reset Password</h1>
            <p className="login-subtitle">Enter your new password below</p>
          </div>
          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className="form-input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="New password"
                disabled={isLoading}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                className="form-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm password"
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ResetPassword;
