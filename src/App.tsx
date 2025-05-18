
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
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Toaster } from "./components/ui/toaster";

// Protected route component that requires authentication
const ProtectedRoute = ({ children }) => {
  // This is a placeholder that will get the actual user from AuthContext
  const isAuthenticated = localStorage.getItem("token");
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  return children;
};

// Admin route component that requires admin role
const AdminRoute = ({ children }) => {
  // This is a placeholder that will need to be expanded with actual role checking
  const isAuthenticated = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");
  
  if (!isAuthenticated) {
    return <Navigate to="/auth" />;
  }
  
  if (user.role !== "ADMIN") {
    return <Navigate to="/" />;
  }
  
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
            <Route path="/auth" element={<AuthPage />} />
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
