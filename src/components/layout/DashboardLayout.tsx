import { Outlet } from "react-router-dom";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
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
        onAction={() => console.log('Navigate to interventions')}
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
          isSidebarCollapsed ? 'ml-16' : 'ml-80'
        }`}>
          <div className="p-8">
            <Outlet />
          </div>
        </main>
      </div>
      
      {/* Floating Support Widget */}
      <SupportWidget />
    </div>
  );
};