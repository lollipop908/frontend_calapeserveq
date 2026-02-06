import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./styles/Login.css";
import logo from "/calapelogo.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Swal from "sweetalert2";
import { FaArrowLeft, FaPaperPlane } from "react-icons/fa";
import { useMutation } from "@apollo/client";
import { FORGOT_PASSWORD } from "../../graphql/mutation";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [forgotPassword] = useMutation(FORGOT_PASSWORD);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await forgotPassword({
        variables: { email: email.trim() },
      });

      setIsLoading(false);
      Swal.fire({
        icon: "success",
        title: "Request Sent",
        text:
          data?.forgotPassword ||
          "If an account exists for this email, you will receive a password reset link shortly.",
        confirmButtonColor: "#3085d6",
      }).then(() => {
        navigate("/login");
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Forgot password error:", error);
      Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "Failed to send reset link. Please try again.",
        confirmButtonColor: "#3085d6",
      });
    }
  };

  return (
    <div className="login-page">
      <Header />

      <div className="login-background">
        <img
          src="/municipality.jpg"
          alt="Municipality Background"
          className="bg-image"
        />
        <div className="bg-overlay"></div>
        <div className="circle circle-1"></div>
        <div className="circle circle-2"></div>
        <div className="circle circle-3"></div>
      </div>

      <div className="login-content">
        <div className="login-card">
          <div className="login-header">
            <div className="logo-container">
              <div className="logo">
                <img
                  src={logo}
                  alt="CalapeServeQ Logo"
                  className="logo-image"
                />
              </div>
            </div>
            <h1 className="login-title">Forgot Password</h1>
            <p className="login-subtitle">
              Enter your email to receive a reset link
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="form-input"
                placeholder="Enter your registered email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className={`login-button ${isLoading ? "loading" : ""}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="loading-dots">
                  <div className="dot"></div>
                  <div className="dot"></div>
                  <div className="dot"></div>
                </div>
              ) : (
                <>
                  <FaPaperPlane style={{ marginRight: "10px" }} />
                  Send Reset Link
                </>
              )}
            </button>
          </form>

          <div
            className="forgot-password-footer"
            style={{ marginTop: "24px", textAlign: "center" }}
          >
            <Link
              to="/login"
              className="forgot-password-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <FaArrowLeft size={12} />
              Back to Login
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ForgotPassword;
