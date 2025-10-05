import React from "react";
import { Navigate, Outlet } from "react-router-dom";

const PrivateStaffRoute = () => {
  const role = sessionStorage.getItem("userRole");
  return role === "staff" ? <Outlet /> : <Navigate to="/login" replace />;
};

export default PrivateStaffRoute;
