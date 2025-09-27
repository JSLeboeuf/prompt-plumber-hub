import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard,
  Phone,
  Users,
  Wrench,
  BarChart3,
  Shield,
  HelpCircle,
  Settings,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardSidebarProps {
  collapsed?: boolean;
}

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble"
  },
  {
    title: "File d'Appels",
    href: "/dashboard/calls",
    icon: Phone,
    description: "Appels urgents"
  },
  {
    title: "CRM Clients",
    href: "/dashboard/crm",
    icon: Users,
    description: "Gestion clients"
  },
  {
    title: "Interventions",
    href: "/dashboard/interventions",
    icon: Wrench,
    description: "Suivi terrain"
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Métriques métier"
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    description: "Aide & Contact"
  },
  {
    title: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Configuration"
  }
];

export const DashboardSidebar = ({ collapsed = false }: DashboardSidebarProps) => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside className={cn(
      "fixed left-0 top-16 h-[calc(100vh-4rem)] bg-card border-r border-border transition-all duration-300 z-40",
      collapsed ? "w-16" : "w-80"
    )}>
      <div className="flex flex-col h-full">
        {/* Navigation Header */}
        {!collapsed && (
          <div className="p-6 border-b border-border">
            <h2 className="title-md text-primary">
              Drain Fortin
            </h2>
            <p className="caption mt-1">
              Plateforme de gestion
            </p>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-1">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <NavLink
                key={item.href}
                to={item.href}
                className={cn(
                  "flex items-center rounded-lg transition-colors duration-200 group",
                  collapsed ? "p-3 justify-center" : "p-3",
                  active
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "hover:bg-surface text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  collapsed ? "mx-auto" : "mr-3"
                )} />
                
                {!collapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <div className="label truncate">
                        {item.title}
                      </div>
                      <div className="caption text-xs opacity-75">
                        {item.description}
                      </div>
                    </div>
                    
                    {active && (
                      <ChevronRight className="h-4 w-4 opacity-50" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        {!collapsed && (
          <div className="p-4 border-t border-border">
            <div className="bg-surface rounded-lg p-3">
              <div className="flex items-center gap-2 text-primary">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                <span className="label">Système opérationnel</span>
              </div>
              <p className="caption mt-1">
                Tous les services fonctionnels
              </p>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};