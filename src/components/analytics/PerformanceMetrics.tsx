import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RealTimeMetrics {
  totalCalls: number;
  activeCalls: number;
  completedCalls: number;
  urgentCalls: number;
  avgDuration: number;
  successRate: number;
}

interface Call {
  id: string;
  status: string;
}

interface PerformanceMetricsProps {
  realTimeMetrics: RealTimeMetrics;
  calls: Call[];
}

export const PerformanceMetrics = ({ realTimeMetrics, calls }: PerformanceMetricsProps) => {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Métriques de Performance</CardTitle>
          <p className="caption text-muted-foreground">
            Indicateurs en temps réel
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="font-medium">Taux de réponse</span>
            <Badge variant="default" className="bg-success text-success-foreground">
              {realTimeMetrics.successRate}%
            </Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="font-medium">Appels urgents (P1)</span>
            <Badge variant="destructive">{realTimeMetrics.urgentCalls}</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="font-medium">Temps moyen de résolution</span>
            <Badge variant="outline">{realTimeMetrics.avgDuration}min</Badge>
          </div>
          <div className="flex justify-between items-center p-3 bg-surface rounded-lg">
            <span className="font-medium">Appels actifs maintenant</span>
            <Badge variant="secondary">{realTimeMetrics.activeCalls}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="title-md">Répartition par Statut</CardTitle>
          <p className="caption text-muted-foreground">
            Distribution des appels par état
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-success rounded-full" />
              <span className="font-medium">Terminés</span>
            </div>
            <span className="font-bold text-success">{realTimeMetrics.completedCalls}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-primary rounded-full" />
              <span className="font-medium">En cours</span>
            </div>
            <span className="font-bold text-primary">{realTimeMetrics.activeCalls}</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-surface rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-secondary rounded-full" />
              <span className="font-medium">En attente</span>
            </div>
            <span className="font-bold text-secondary-foreground">
              {calls?.filter(c => c.status === 'pending')?.length || 0}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};