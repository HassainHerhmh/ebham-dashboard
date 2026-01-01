import React from "react";
import { Navigate } from "react-router-dom";
import { hasPermission } from "../utils/permissions";

interface Props {
  children: React.ReactNode;
  section: string;
  action?: "view" | "add" | "edit" | "delete" | "print";
}

const ProtectedRoute: React.FC<Props> = ({
  children,
  section,
  action = "view",
}) => {
  const user = JSON.parse(localStorage.getItem("user") || "null");

  // غير مسجل دخول
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // غير مصرح
  if (!hasPermission(user, section, action)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // مسموح
  return <>{children}</>;
};

export default ProtectedRoute;
