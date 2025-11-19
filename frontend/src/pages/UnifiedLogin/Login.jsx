import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@apollo/client/react";
import { LOGIN } from "../../graphql/mutation";
import "./styles/Login.css";
import logo from "/calapelogo.png";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import Swal from "sweetalert2";

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [login] = useMutation(LOGIN);

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data } = await login({
        variables: {
          staffUsername: username.trim(),
          staffPassword: password.trim(),
        },
      });

      const loginData = data?.login;

      if (!loginData?.success) {
        Swal.fire({
          icon: "error",
          title: "Invalid credentials",
          text: "Please check your username and password.",
          confirmButtonColor: "#3085d6",
        });
        return;
      }

      const access_token = loginData.access_token || "";
      let role =
        loginData.role?.trim().toLowerCase() ||
        loginData.staff?.role?.roleName?.trim().toLowerCase() ||
        "";

      if (role.includes("queue") && role.includes("staff")) role = "queuestaff";

      sessionStorage.clear();
      localStorage.clear();
      localStorage.setItem("token", access_token);
      localStorage.setItem("role", role);
      sessionStorage.setItem("userRole", role);

      const staff = loginData.staff || {};
      const department = staff.department || {};
      const dept = department.departmentId
        ? {
            id: parseInt(department.departmentId),
            name: department.departmentName?.trim() || "",
            prefix: department.prefix?.trim() || "",
          }
        : { id: 0, name: "", prefix: "" };

      Swal.fire({
        icon: "success",
        title: "Login successful",
        text: `Welcome ${staff.staffFirstname || ""}! Redirecting...`,
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
      });

      setTimeout(() => {
        if (role === "admin") {
          sessionStorage.setItem("isAdminLoggedIn", "true");
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "queuestaff") {
          const staffInfo = {
            id: staff.staffId || Date.now(),
            username: staff.staffUsername || username,
            firstName: staff.staffFirstname || "",
            lastName: staff.staffLastname || "",
            role: "queuestaff",
            department: dept,
            token: access_token,
            loginTime: new Date().toISOString(),
          };
          localStorage.setItem("staffId", staff.staffId);
          localStorage.setItem("staffUsername", staff.staffUsername);
          localStorage.setItem("staffRole", role);
          localStorage.setItem("staffDepartment", dept.name);
          sessionStorage.setItem("staffInfo", JSON.stringify(staffInfo));
          sessionStorage.setItem("isQueueStaffLoggedIn", "true");
          navigate("/queuestaff/dashboard", { replace: true });
        } else {
          if (!dept.id || !dept.name || !dept.prefix) {
            Swal.fire({
              icon: "error",
              title: "Invalid department information",
              text: "Please contact administrator.",
              confirmButtonColor: "#3085d6",
            });
            return;
          }
          const staffInfo = {
            id: staff.staffId || Date.now(),
            username: staff.staffUsername || username,
            department: dept,
            token: access_token,
            loginTime: new Date().toISOString(),
          };
          sessionStorage.setItem("staffInfo", JSON.stringify(staffInfo));
          navigate("/staff/dashboard", { replace: true });
        }
      }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      let message = "Login failed. Please try again.";
      if (error.graphQLErrors?.length) message = error.graphQLErrors[0].message;
      else if (error.networkError)
        message = "Network error. Check your connection.";

      Swal.fire({
        icon: "error",
        title: "Login failed",
        text: message,
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => setShowPassword((prev) => !prev);

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
            <h1 className="login-title">Login</h1>
            <p className="login-subtitle">
              Municipality of Calape Service Management
            </p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            <div className="form-group">
              <label htmlFor="username" className="form-label">
                Username
              </label>
              <input
                type="text"
                id="username"
                className="form-input"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="password-input-container">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="password-input"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={togglePasswordVisibility}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                >
                  {}
                </button>
              </div>
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
                "Login"
              )}
            </button>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
