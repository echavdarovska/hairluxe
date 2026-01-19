import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../state/auth";

export default function ProtectedRoute({ children, role }) {
  const { user, booting } = useAuth();

  if (booting) {
    return (
      <div className="p-8 text-center text-sm text-black/60">Loading...</div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (role && user.role !== role) return <Navigate to="/" replace />;

  return children;
}
