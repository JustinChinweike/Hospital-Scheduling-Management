
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { OfflineProvider } from "./context/OfflineContext";
import { ScheduleProvider } from "./context/ScheduleContext";
import AddSchedulePage from "./pages/AddSchedulePage";
import EditSchedulePage from "./pages/EditSchedulePage";
import ListSchedulePage from "./pages/ListSchedulePage";
import TaskPage from "./pages/TaskPage";
import AuthPage from "./pages/AuthPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const App = () => (
  <OfflineProvider>
    <ScheduleProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/add-schedule" element={<AddSchedulePage />} />
          <Route path="/edit-schedule/:id" element={<EditSchedulePage />} />
          <Route path="/list-schedule" element={<ListSchedulePage />} />
          <Route path="/tasks" element={<TaskPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ScheduleProvider>
  </OfflineProvider>
);

export default App;
