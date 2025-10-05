import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiHome,
  FiUser,
  FiUsers,
  FiLogOut,
  FiSettings,
} from "react-icons/fi";
import { MdDashboard } from "react-icons/md";
import { Building2 } from "lucide-react";
// import Profile from "./Profile";
// import ManageStaff from "./ManageStaff";
// import ManageDepartment from "./ManageDepartment";
import "./styles/Dashboard.css";
// import { useQuery } from "@apollo/client";
// import { GET_ROLES, GET_DEPARTMENTS, GET_ALL_STAFF } from "../../graphql/query";
import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import logo from "/calapelogo.png";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [adminProfile, setAdminProfile] = useState({
    username: "admin",
    profilePicture: null,
    email: "admin@calape.gov.ph",
    fullName: "Administrator",
    phone: "+63 909 909 839",
  });
  const [findAllStaff, setStaffList] = useState([]);
  const [departments, setDepartments] = useState([]);

  // TODO: Uncomment when backend is ready
  // const { data: rolesData } = useQuery(GET_ROLES);
  // const { data: deptData, refetch: refetchDepartments } = useQuery(GET_DEPARTMENTS);
  // const { data: staffData } = useQuery(GET_ALL_STAFF);

  useEffect(() => {
    const isLoggedIn = sessionStorage.getItem("isAdminLoggedIn");
    if (!isLoggedIn) {
      navigate("/admin");
    }
  }, [navigate]);

  // TODO: Uncomment when backend is ready
  // useEffect(() => {
  //   if (deptData && deptData.departments) {
  //     setDepartments(deptData.departments);
  //   }
  // }, [deptData]);

  // useEffect(() => {
  //   if (staffData && staffData.findAllStaff) {
  //     setStaffList(staffData.findAllStaff);
  //   }
  // }, [staffData]);

  const handleLogout = () => {
    sessionStorage.clear();
    localStorage.clear();
    navigate("/login");
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="welcome-section">
        <div className="welcome-header">
          <h1>Municipality of Calape</h1>
          <p>Smart Queue Management System</p>
        </div>
        <div className="welcome-time">
          <span>{new Date().toLocaleDateString()}</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card staff-card">
          <div className="stat-icon">
            <FiUsers size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{findAllStaff.length}</div>
            <div className="stat-label">Total Staff</div>
            <div className="stat-change">+2 this month</div>
          </div>
        </div>

        <div className="stat-card department-card">
          <div className="stat-icon">
            <Building2 size={24} />
          </div>
          <div className="stat-content">
            <div className="stat-number">{departments.length}</div>
            <div className="stat-label">Departments</div>
            <div className="stat-change">Active</div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button
            className="action-btn primary"
            onClick={() => setActiveSection("staff")}
          >
            <FiUsers className="action-icon" size={20} />
            <span>Manage Staff</span>
          </button>
          <button
            className="action-btn secondary"
            onClick={() => setActiveSection("departments")}
          >
            <Building2 className="action-icon" size={20} />
            <span>Manage Departments</span>
          </button>
          <button
            className="action-btn tertiary"
            onClick={() => setActiveSection("profile")}
          >
            <FiSettings className="action-icon" size={20} />
            <span>System Settings</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case "dashboard":
        return renderDashboard();
      case "profile":
        return (
          <Profile
            adminProfile={adminProfile}
            setAdminProfile={setAdminProfile}
          />
        );
      case "staff":
        return (
          <ManageStaff
            findAllStaff={findAllStaff}
            setStaffList={setStaffList}
            departments={departments}
            // roles={rolesData?.findAllRoles || []}
            roles={[]}
          />
        );
      case "departments":
        return (
          <ManageDepartment
            departments={departments}
            setDepartments={setDepartments}
          />
        );
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="admin-dashboard-container">
      <Header />

      <div className="admin-dashboard">
        <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <div className="sidebar-header">
            <div className="logo">
              <img src={logo} alt="Calape Logo" className="logo-image" />
            </div>
            <h3>Admin Panel</h3>
          </div>

          <nav className="sidebar-nav">
            <button
              className={`nav-item ${
                activeSection === "dashboard" ? "active" : ""
              }`}
              onClick={() => setActiveSection("dashboard")}
            >
              <MdDashboard className="nav-icon" size={20} />
              <span className="nav-text">Dashboard</span>
            </button>

            <button
              className={`nav-item ${
                activeSection === "profile" ? "active" : ""
              }`}
              onClick={() => setActiveSection("profile")}
            >
              <FiUser className="nav-icon" size={20} />
              <span className="nav-text">Profile</span>
            </button>

            <button
              className={`nav-item ${activeSection === "staff" ? "active" : ""}`}
              onClick={() => setActiveSection("staff")}
            >
              <FiUsers className="nav-icon" size={20} />
              <span className="nav-text">Manage Staff</span>
            </button>

            <button
              className={`nav-item ${
                activeSection === "departments" ? "active" : ""
              }`}
              onClick={() => setActiveSection("departments")}
            >
              <FiHome className="nav-icon" size={20} />
              <span className="nav-text">Manage Departments</span>
            </button>
          </nav>

          <div className="sidebar-footer">
            <div className="admin-info">
              <div className="admin-avatar">
                {adminProfile.profilePicture ? (
                  <img src={adminProfile.profilePicture} alt="Admin" />
                ) : (
                  <span>{adminProfile.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="admin-details">
                <span className="admin-name">{adminProfile.fullName}</span>
                <span className="admin-role">Administrator</span>
              </div>
            </div>
            <button onClick={handleLogout} className="logout-btn">
              <FiLogOut className="nav-icon" size={18} />
              <span className="nav-textlog">Logout</span>
            </button>
          </div>
        </div>

        <div
          className={`main-content ${
            sidebarOpen ? "sidebar-open" : "sidebar-closed"
          }`}
        >
          <div className="content-header">
            <div className="header-left">
              <button
                className="hamburger-btn"
                onClick={toggleSidebar}
                aria-label="Toggle sidebar"
              >
                {sidebarOpen ? <FiX size={20} /> : <FiMenu size={20} />}
              </button>
              <div className="page-title">
                <h1>
                  {activeSection === "dashboard" && "Dashboard"}
                  {activeSection === "profile" && "Profile Settings"}
                  {activeSection === "staff" && "Staff Management"}
                  {activeSection === "departments" && "Department Management"}
                </h1>
                <p className="page-subtitle">
                  {activeSection === "dashboard" &&
                    "Overview of municipal operations"}
                  {activeSection === "profile" && "Manage your account settings"}
                  {activeSection === "staff" && "Manage staff members and roles"}
                  {activeSection === "departments" &&
                    "Organize departments and structure"}
                </p>
              </div>
            </div>
          </div>

          <div className="content-body">{renderContent()}</div>
        </div>

        {sidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default AdminDashboard;