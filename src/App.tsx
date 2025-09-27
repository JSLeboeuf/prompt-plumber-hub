import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/providers/ToastProvider";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModernDashboardLayout } from "./components/layout/ModernDashboardLayout";
import { SupportWidget } from "./components/support/SupportWidget";
import { AlertBanner } from "./components/alerts/AlertBanner";
import Dashboard from "./pages/Dashboard";
import Calls from "./pages/Calls";
import CRM from "./pages/CRM";
import Interventions from "./pages/Interventions";
import Analytics from "./pages/Analytics";
import Conformite from "./pages/Conformite";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";
import AuthNew from "./pages/AuthNew";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/auth" element={<AuthNew />} />
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <ModernDashboardLayout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Dashboard />} />
                  <Route path="calls" element={<Calls />} />
                  <Route path="crm" element={<CRM />} />
                  <Route path="interventions" element={<Interventions />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="conformite" element={<Conformite />} />
                  <Route path="support" element={<Support />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;