import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { MobileBottomNav } from "./MobileBottomNav";
import { SupportWidget } from "../support/SupportWidget";
import { AlertBanner } from "../alerts/AlertBanner";
import { useState } from "react";

export const DashboardLayout = () => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-surface w-full">
      {/* Alert Banner - Global Notifications */}
      <AlertBanner 
        type="warning"
        title="Mise à jour requise"
        message="2 interventions nécessitent une validation"
        onAction={() => {/* Navigate to interventions - handled by parent */}}
        actionLabel="Voir détails"
      />
      
      {/* Header */}
      <DashboardHeader 
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isSidebarCollapsed={isSidebarCollapsed}
      />
      
      <div className="flex w-full">
        {/* Sidebar */}
        <DashboardSidebar collapsed={isSidebarCollapsed} />
        
        {/* Main Content */}
        <main className={`flex-1 transition-all duration-300 ${
          isSidebarCollapsed ? 'lg:ml-16' : 'lg:ml-80'
        } pt-4 lg:pt-0 pb-20 lg:pb-4`}>
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
      
      {/* Floating Support Widget */}
      <SupportWidget />
    </div>
  );
};