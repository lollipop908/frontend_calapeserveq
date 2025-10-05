import React from "react";
import { Navigate } from "react-router-dom";

const PrivateRoute = ({ element }) => {
  const role = sessionStorage.getItem("userRole");
  return role === "admin" ? element : <Navigate to="/login" replace />;
};

export default PrivateRoute;
