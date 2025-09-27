import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface QuickAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}

interface QuickActionsProps {
  title?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const QuickActions = ({ 
  title = "Actions Rapides", 
  actions, 
  columns = 4,
  className = "" 
}: QuickActionsProps) => {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3",
    4: "md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid gap-3 ${gridClass}`}>
          {actions.map((action, index) => (
            <Button 
              key={index}
              variant="outline" 
              className="h-16 flex-col gap-2"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              <action.icon className="h-5 w-5" />
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};