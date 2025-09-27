import { useState } from "react";
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
  ChevronRight,
  Zap
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";

const navigationItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    description: "Vue d'ensemble",
    badge: null
  },
  {
    title: "File d'Appels",
    href: "/dashboard/calls",
    icon: Phone,
    description: "Appels urgents",
    badge: { text: "3", variant: "destructive" as const }
  },
  {
    title: "CRM Clients",
    href: "/dashboard/crm",
    icon: Users,
    description: "Gestion clients",
    badge: { text: "5", variant: "secondary" as const }
  },
  {
    title: "Interventions",
    href: "/dashboard/interventions",
    icon: Wrench,
    description: "Suivi terrain",
    badge: { text: "2", variant: "default" as const }
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3,
    description: "Métriques métier",
    badge: null
  },
  {
    title: "Conformité",
    href: "/dashboard/conformite",
    icon: Shield,
    description: "RGPD & Audit",
    badge: null
  },
  {
    title: "Support",
    href: "/dashboard/support",
    icon: HelpCircle,
    description: "Aide & Contact",
    badge: { text: "3", variant: "outline" as const }
  },
  {
    title: "Paramètres",
    href: "/dashboard/settings",
    icon: Settings,
    description: "Configuration",
    badge: null
  }
];

export function AppSidebar() {
  const { state: sidebarState } = useSidebar();
  const location = useLocation();
  const { profile } = useAuth();
  const currentPath = location.pathname;

  // Helper functions
  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard";
    }
    return currentPath.startsWith(href);
  };

  const isExpanded = navigationItems.some((item) => isActive(item.href));

  const getNavClassName = (href: string) => {
    const active = isActive(href);
    return active ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground";
  };

  const collapsed = sidebarState === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Header avec logo */}
        <div className="p-4 border-b border-sidebar-border">
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-sidebar-foreground">
                  Drain Fortin
                </h2>
                <p className="text-xs text-sidebar-foreground/60">
                  Plateforme de gestion
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Zap className="h-4 w-4" />
              </div>
            </div>
          )}
        </div>

        {/* Navigation principale */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild className={getNavClassName(item.href)}>
                      <NavLink to={item.href} end={item.href === "/dashboard"}>
                        <Icon className="h-4 w-4" />
                        {!collapsed && (
                          <>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate">
                                {item.title}
                              </div>
                              <div className="text-xs opacity-60 truncate">
                                {item.description}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {item.badge && (
                                <Badge variant={item.badge.variant} className="text-xs px-1.5 py-0.5">
                                  {item.badge.text}
                                </Badge>
                              )}
                              {active && (
                                <ChevronRight className="h-3 w-3 opacity-50" />
                              )}
                            </div>
                          </>
                        )}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer avec statut */}
        {!collapsed && (
          <div className="mt-auto p-4 border-t border-sidebar-border">
            <div className="rounded-lg bg-sidebar-accent/30 p-3">
              <div className="flex items-center gap-2 text-sidebar-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-sm font-medium">Système opérationnel</span>
              </div>
              <p className="text-xs text-sidebar-foreground/60 mt-1">
                Tous les services fonctionnels
              </p>
              {profile && (
                <div className="mt-2 pt-2 border-t border-sidebar-border/50">
                  <p className="text-xs text-sidebar-foreground/80">
                    Connecté: {profile.email}
                  </p>
                  <p className="text-xs text-sidebar-foreground/60">
                    Rôle: {profile.role}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </SidebarContent>
    </Sidebar>
  );
}