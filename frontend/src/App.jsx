import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Citizens/Home";
import QueueForm from "./pages/Citizens/QueueForm";
import Login from "./pages/UnifiedLogin/Login";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import PrivateStaffRoute from "./routes/PrivateStaffRoute";
import Dashboard from "./pages/Admin/Dashboard";
import PrivateRoute from "./routes/PrivateRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home />} />
        <Route path="/form" element={<QueueForm />} />
        <Route path="/login" element={<Login />} />
        

        <Route path="/staff" element={<PrivateStaffRoute />}>
          <Route path="dashboard" element={<StaffDashboard />} />
        </Route>
        <Route
          path="/admin/dashboard"
          element={<PrivateRoute element={<Dashboard />} />}
        />

      </Routes>
    </Router>
  );
}

export default App;
