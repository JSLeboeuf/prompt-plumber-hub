import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "@/components/providers/ToastProvider";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import { DashboardLayout } from "./components/layout/DashboardLayout";
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
import Auth from "./pages/Auth";
import Settings from "./pages/Settings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <ToastProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {/* Global Alert Banner */}
          <AlertBanner
            type="warning"
            title="Mise à jour système"
            message="Maintenance programmée ce soir de 2h à 4h - Services limités"
            dismissible={true}
          />
          
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<DashboardLayout />}>
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
          
          {/* Global Support Widget */}
          <SupportWidget />
        </BrowserRouter>
        </ToastProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
