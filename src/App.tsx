import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/providers/ToastProvider";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ModernDashboardLayout } from "./components/layout/ModernDashboardLayout";
import { lazy, Suspense } from "react";
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Calls = lazy(() => import("./pages/Calls"));
const CRM = lazy(() => import("./pages/CRM"));
const Interventions = lazy(() => import("./pages/Interventions"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Conformite = lazy(() => import("./pages/Conformite"));
const Support = lazy(() => import("./pages/Support"));
const NotFound = lazy(() => import("./pages/NotFound"));
const AuthNew = lazy(() => import("./pages/AuthNew"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <ToastProvider>
            <BrowserRouter>
              <Suspense fallback={<div className="p-6">Chargement...</div>}>
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
              </Suspense>
            </BrowserRouter>
          </ToastProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;