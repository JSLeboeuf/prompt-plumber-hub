import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/common/StatsGrid";
import { QuickActions } from "@/components/common/QuickActions";
import { 
  Phone, 
  Users, 
  Wrench, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Loader2,
  ArrowRight
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useUltraFastDashboard } from "@/hooks/useUltraFastDashboard";
import { format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const { metrics, isLoading } = useUltraFastDashboard('24h');

  const kpiCards = [
    {
      title: "Appels aujourd'hui",
      value: (metrics as any).totalCalls || 0,
      icon: Phone,
      action: () => navigate('/dashboard/calls')
    },
    {
      title: "Interventions actives", 
      value: (metrics as any).activeCalls || 0,
      icon: Wrench,
      action: () => navigate('/dashboard/interventions')
    },
    {
      title: "Clients actifs",
      value: (metrics as any).activeClients || 0,
      icon: Users,
      action: () => navigate('/dashboard/crm')
    },
    {
      title: "Taux réussite",
      value: `${(metrics as any).successRate || 0}%`,
      icon: TrendingUp,
      action: () => navigate('/dashboard/analytics')
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl">Tableau de Bord</h1>
          <p className="text-muted-foreground">Vue d'ensemble opérationnelle</p>
        </div>
        <div className="flex items-center gap-2 text-success">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          <span className="text-sm">Système opérationnel</span>
        </div>
      </div>

      {/* KPI Cards */}
      <StatsGrid 
        stats={kpiCards.map(kpi => ({
          title: kpi.title,
          value: kpi.value,
          icon: kpi.icon,
          onClick: kpi.action
        }))}
      />

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Urgent Calls */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <CardTitle>Appels Urgents</CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/dashboard/calls')}
            >
              Voir tous
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {((metrics as any).recentCalls || []).filter((call: any) => call.priority === 'P1').length > 0 ? (
              <div className="space-y-3">
                {((metrics as any).recentCalls || []).filter((call: any) => call.priority === 'P1').map((call: any) => (
                  <div 
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                       <Badge variant="destructive" className="text-xs">
                         URGENT
                       </Badge>
                      <div>
                        <div className="font-medium">{call.customer_name}</div>
                        <div className="text-sm text-muted-foreground">
                      {format(new Date(call.created_at || Date.now()), 'HH:mm')}
                        </div>
                      </div>
                    </div>
                    <Button size="sm">
                      Prendre
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto mb-2 text-success" />
                <p>Aucun appel urgent</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Activités Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((metrics as any).recentCalls || []).slice(0, 4).map((call: any) => (
                <div key={call.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {call.status === 'completed' ? 'Appel terminé' : 
                       call.status === 'active' ? 'Appel en cours' : 'Nouvel appel'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {call.customer_name}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {format(new Date(call.created_at || Date.now()), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/dashboard/analytics')}
            >
              Historique complet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <QuickActions
        actions={[
          { label: 'Nouveau Call', icon: Phone, onClick: () => navigate('/dashboard/calls') },
          { label: 'Ajouter Client', icon: Users, onClick: () => navigate('/dashboard/crm') },
          { label: 'Intervention', icon: Wrench, onClick: () => navigate('/dashboard/interventions') },
          { label: 'Analytics', icon: TrendingUp, onClick: () => navigate('/dashboard/analytics') }
        ]}
      />
    </div>
  );
}