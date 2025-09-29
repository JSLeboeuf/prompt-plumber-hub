import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Phone, Wrench, Star, DollarSign } from 'lucide-react';
import { DashboardMetrics } from '@/types/dashboard';

interface RealTimeMetrics {
  totalCalls: number;
  completedCalls: number;
  successRate: number;
  avgDuration: number;
}

interface KpiCardsProps {
  analytics: DashboardMetrics | null;
  realTimeMetrics: RealTimeMetrics;
}

export const KpiCards = ({ analytics, realTimeMetrics }: KpiCardsProps) => {
  const kpiCards = useMemo(() => [
    {
      title: "Appels Total",
      value: analytics?.totalCalls || realTimeMetrics.totalCalls,
      evolution: "+12%",
      icon: Phone,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Interventions",
      value: analytics?.completedCalls || realTimeMetrics.completedCalls,
      evolution: "+8%",
      icon: Wrench,
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      title: "Taux Succès",
      value: `${analytics?.successRate || realTimeMetrics.successRate}%`,
      evolution: "+0.2%",
      icon: Star,
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      title: "Durée Moyenne",
      value: `${analytics?.avgResponseTime || realTimeMetrics.avgDuration}min`,
      evolution: "-5%",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10"
    }
  ], [analytics, realTimeMetrics]);

  return (
    <div className="grid gap-6 md:grid-cols-4">
      {kpiCards.map((kpi, index) => {
        const Icon = kpi.icon;
        const isPositive = kpi.evolution.startsWith('+');

        return (
          <Card key={index} className="kpi-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="label text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{kpi.value}</div>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className={`h-3 w-3 ${isPositive ? 'text-success' : 'text-destructive'}`} />
                <span className={`caption ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {kpi.evolution} vs période précédente
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};