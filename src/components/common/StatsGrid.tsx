import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCard {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  onClick?: () => void;
}

interface StatsGridProps {
  stats: StatCard[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export const StatsGrid = ({ stats, columns = 4, className = "" }: StatsGridProps) => {
  const gridClass = {
    2: "md:grid-cols-2",
    3: "md:grid-cols-3", 
    4: "md:grid-cols-2 lg:grid-cols-4"
  }[columns];

  return (
    <div className={`grid gap-4 ${gridClass} ${className}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index}
            className={`interactive-card ${stat.onClick ? 'cursor-pointer' : ''}`}
            onClick={stat.onClick}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="label text-muted-foreground">{stat.title}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold animate-scale-in">{stat.value}</p>
                    {stat.trend && (
                      <span className={`text-sm ${stat.trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {stat.trend.isPositive ? '+' : ''}{stat.trend.value}%
                      </span>
                    )}
                  </div>
                </div>
                <Icon className={`h-8 w-8 interactive-icon ${stat.color || 'text-primary'}`} />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};