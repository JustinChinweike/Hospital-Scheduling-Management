
import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { OfflineProvider } from "./context/OfflineContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import { AuthProvider } from "./context/AuthContext";
import AddSchedulePage from "./pages/AddSchedulePage";
import EditSchedulePage from "./pages/EditSchedulePage";
import ListSchedulePage from "./pages/ListSchedulePage";
import AuthPage from "./pages/AuthPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ProfilePage from "./pages/ProfilePage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import VerifyEmailChangePage from "./pages/VerifyEmailChangePage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CalendarPage from "./pages/CalendarPage";
import { Toaster } from "./components/ui/toaster";
import OverbookConfirmPage from "./pages/OverbookConfirmPage";

// Protected route component that requires authentication
interface RouteProps { children: React.ReactElement }
const ProtectedRoute = ({ children }: RouteProps) => {
  // Get authentication token
  const isAuthenticated = localStorage.getItem("token");
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

// Admin route component that requires admin role
const AdminRoute = ({ children }: RouteProps) => {
  // Get authentication token and user data
  const isAuthenticated = localStorage.getItem("token");
  
  // Try to parse user from localStorage
  let user = null;
  try {
    const userString = localStorage.getItem("user");
    if (userString) {
      user = JSON.parse(userString);
      console.log("Admin route check - User:", user);
    } else {
      console.log("Admin route check - No user data in localStorage");
    }
  } catch (error) {
    console.error("Error parsing user from localStorage:", error);
  }
  
  // If no token, redirect to auth page
  if (!isAuthenticated) {
    console.log("Admin route - Not authenticated, redirecting to /auth");
    return <Navigate to="/auth" />;
  }
  
  // If user is not admin, redirect to home page
  if (!user || user.role !== "ADMIN") {
    console.log("Admin route - Not admin, redirecting to /");
    return <Navigate to="/" />;
  }
  
  // User is authenticated and is admin
  console.log("Admin route - Access granted");
  return children;
};

const App = () => (
  <AuthProvider>
    <OfflineProvider>
      <ScheduleProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/add-schedule" element={
              <ProtectedRoute>
                <AddSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="/edit-schedule/:id" element={
              <ProtectedRoute>
                <EditSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="/list-schedule" element={
              <ProtectedRoute>
                <ListSchedulePage />
              </ProtectedRoute>
            } />
            <Route path="/calendar" element={
              <ProtectedRoute>
                <CalendarPage />
              </ProtectedRoute>
            } />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/overbook/confirm" element={<OverbookConfirmPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email-change" element={<VerifyEmailChangePage />} />
            <Route path="/profile" element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            } />
            <Route path="/admin" element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            } />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </Router>
      </ScheduleProvider>
    </OfflineProvider>
  </AuthProvider>
);

export default App;
