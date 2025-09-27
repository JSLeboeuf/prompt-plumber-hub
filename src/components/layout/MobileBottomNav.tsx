import { NavLink, useLocation } from "react-router-dom";
import { 
  LayoutDashboard,
  Phone,
  Users,
  Wrench,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNavItems = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard
  },
  {
    title: "Appels",
    href: "/dashboard/calls",
    icon: Phone
  },
  {
    title: "CRM",
    href: "/dashboard/crm",
    icon: Users
  },
  {
    title: "Interventions",
    href: "/dashboard/interventions",
    icon: Wrench
  },
  {
    title: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart3
  }
];

export const MobileBottomNav = () => {
  const location = useLocation();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location.pathname === "/dashboard";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50">
      <div className="flex">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          
          return (
            <NavLink
              key={item.href}
              to={item.href}
              className={cn(
                "flex-1 flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200",
                "min-h-[60px]", // Minimum touch target size
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs font-medium truncate w-full text-center">
                {item.title}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
};