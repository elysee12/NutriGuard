import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import CHWDashboard from "@/pages/chw/CHWDashboard";
import RegisterChild from "@/pages/chw/RegisterChild";
import CHWAssessments from "@/pages/chw/CHWAssessments";
import CHWResults from "@/pages/chw/CHWResults";
import NurseDashboard from "@/pages/nurse/NurseDashboard";
import NurseAssessments from "@/pages/nurse/NurseAssessments";
import NurseAssessmentView from "@/pages/nurse/NurseAssessmentView";
import NurseCHWMonitoring from "@/pages/nurse/NurseCHWMonitoring";
import NurseReports from "@/pages/nurse/NurseReports";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminCenters from "@/pages/admin/AdminCenters";
import AdminStats from "@/pages/admin/AdminStats";
import AdminLogs from "@/pages/admin/AdminLogs";
import AdminSettings from "@/pages/admin/AdminSettings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { isAuthenticated, user, token } = useAuth();

  // Only show authenticated routes if both user and token exist
  if (!isAuthenticated || !user || !token) {
    return (
      <Routes>
        <Route path="/forgot" element={<ForgotPasswordPage />} />
        <Route path="/reset" element={<ResetPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="*" element={<LoginPage />} />
      </Routes>
    );
  }

  const homePath = user?.role === "admin" ? "/admin" : user?.role === "nurse" ? "/nurse" : "/chw";

  return (
    <Routes>
      <Route path="/" element={<Navigate to={homePath} replace />} />
      {/* CHW */}
      <Route path="/chw" element={<CHWDashboard />} />
      <Route path="/chw/register" element={<RegisterChild />} />
      {/* nurse-specific routes */}
      <Route path="/nurse/register-child" element={<RegisterChild />} />
      <Route path="/chw/assessments" element={<CHWAssessments />} />
      <Route path="/chw/results" element={<CHWResults />} />
      {/* Nurse */}
      <Route path="/nurse" element={<NurseDashboard />} />
      <Route path="/nurse/assessments" element={<NurseAssessments />} />
      <Route path="/nurse/assessments/:id" element={<NurseAssessmentView />} />
      <Route path="/nurse/chw" element={<NurseCHWMonitoring />} />
      <Route path="/nurse/reports" element={<NurseReports />} />
      {/* Admin */}
      <Route path="/admin" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/centers" element={<AdminCenters />} />
      <Route path="/admin/stats" element={<AdminStats />} />
      <Route path="/admin/logs" element={<AdminLogs />} />
      <Route path="/admin/settings" element={<AdminSettings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
