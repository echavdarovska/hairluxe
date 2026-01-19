import React from "react";
import { Routes, Route } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Services from "./pages/Services";
import Book from "./pages/Book";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MyAppointments from "./pages/MyAppointments";
import AdminWorkingHours from "./pages/admin/WorkingHoursStaff";
import Notifications from "./pages/Notifications";

import AdminDashboard from "./pages/admin/Dashboard";
import AdminServices from "./pages/admin/ServicesAdmin";
import AdminStaff from "./pages/admin/StaffAdmin";
import AdminAppointments from "./pages/admin/AppointmentsAdmin";
import AdminSettings from "./pages/admin/SettingsAdmin";
import AdminSchedule from "./pages/admin/AdminSchedule";

export default function App() {
  return (
    <>
      <Toaster position="top-right" />
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />

          <Route
            path="/book"
            element={
              <ProtectedRoute>
                <Book />
              </ProtectedRoute>
            }
          />

          <Route
            path="/appointments"
            element={
              <ProtectedRoute>
                <MyAppointments />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notifications"
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/services"
            element={
              <ProtectedRoute role="admin">
                <AdminServices />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/staff"
            element={
              <ProtectedRoute role="admin">
                <AdminStaff />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/working-hours"
            element={
              <ProtectedRoute role="admin">
                <AdminWorkingHours />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/appointments"
            element={
              <ProtectedRoute role="admin">
                <AdminAppointments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/schedule"
            element={
              <ProtectedRoute role="admin">
                <AdminSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute role="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Layout>
    </>
  );
}
