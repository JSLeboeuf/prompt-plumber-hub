import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Phone, 
  Users, 
  Wrench, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Activity,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useEmergencyCalls, useClients } from "@/hooks/useSupabaseData";
import { useToast } from "@/hooks/useToast";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export default function Dashboard() {
  const navigate = useNavigate();
  const { calls, loading: callsLoading } = useEmergencyCalls();
  const { clients, loading: clientsLoading } = useClients();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
  const toast = useToast();

  // Load dashboard analytics
  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const { data, error } = await supabase.rpc('get_dashboard_metrics_optimized', {
          time_period: '24h'
        });
        
        if (error) throw error;
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load analytics:', error);
        toast.error("Erreur", "Impossible de charger les métriques");
      } finally {
        setLoadingAnalytics(false);
      }
    };

    loadAnalytics();
  }, []);

  // Calculate real-time KPIs
  const todayCalls = calls.filter(call => {
    const today = new Date();
    const callDate = new Date(call.created_at);
    return callDate.toDateString() === today.toDateString();
  });

  const urgentCalls = calls.filter(call => 
    ['P1', 'P2'].includes(call.priority) && call.status !== 'completed'
  ).slice(0, 3);

  const activeClients = clients.filter(client => client.status === 'active');

  const kpiCards = [
    {
      title: "Appels aujourd'hui",
      value: loadingAnalytics ? '...' : (analytics?.totalCalls || todayCalls.length),
      change: loadingAnalytics ? '...' : "+12%",
      icon: Phone,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => navigate('/dashboard/calls')
    },
    {
      title: "Interventions actives",
      value: loadingAnalytics ? '...' : (analytics?.activeCalls || calls.filter(c => c.status === 'active').length),
      change: loadingAnalytics ? '...' : "+8%",
      icon: Wrench,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => navigate('/dashboard/interventions')
    },
    {
      title: "Clients actifs",
      value: clientsLoading ? '...' : activeClients.length,
      change: clientsLoading ? '...' : "+15%",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => navigate('/dashboard/crm')
    },
    {
      title: "Taux réussite",
      value: loadingAnalytics ? '...' : `${Math.round(analytics?.successRate || 87)}%`,
      change: loadingAnalytics ? '...' : "+3%",
      icon: TrendingUp,
      color: "text-primary",
      bgColor: "bg-primary/10",
      action: () => navigate('/dashboard/analytics')
    }
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-100 text-red-800 border-red-200';
      case 'P2': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'P3': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl">Tableau de Bord</h1>
          <p className="subtitle text-muted-foreground">
            Vue d'ensemble de vos opérations Drain Fortin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 text-success">
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="label">Tous systèmes opérationnels</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card 
              key={index} 
              className="kpi-card cursor-pointer group"
              onClick={kpi.action}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="label text-muted-foreground">
                  {kpi.title}
                </CardTitle>
              <div className={`p-2 rounded-lg ${kpi.bgColor} group-hover:scale-110 transition-transform duration-200`}>
                  {loadingAnalytics || callsLoading || clientsLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <Icon className={`h-4 w-4 ${kpi.color}`} />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <div className="flex items-center gap-1 mt-1">
                  <TrendingUp className="h-3 w-3 text-success" />
                  <span className="caption text-success">{kpi.change} vs mois dernier</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Urgent Calls */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="title-md flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                Appels Urgents
              </CardTitle>
              <p className="caption text-muted-foreground mt-1">
                Interventions prioritaires nécessitant une attention immédiate
              </p>
            </div>
            <Button onClick={() => navigate('/dashboard/calls')}>
              Voir tous
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-surface rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-6 w-8" />
                      <div>
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))
              ) : urgentCalls.length > 0 ? (
                urgentCalls.map((call) => (
                  <div 
                    key={call.id}
                    className="flex items-center justify-between p-3 bg-surface rounded-lg border hover:shadow-sm transition-shadow duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={`px-2 py-1 text-xs font-medium border ${getPriorityColor(call.priority)}`}>
                        {call.priority}
                      </Badge>
                      <div>
                        <div className="label">{call.customer_name}</div>
                        <div className="caption text-muted-foreground">
                          {call.metadata?.description || 'Intervention urgente'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="caption">
                          {format(new Date(call.created_at), 'HH:mm')}
                        </span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => navigate('/dashboard/calls')}
                      >
                        Prendre
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
                  <p>Aucun appel urgent en cours</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle className="title-md flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" />
              Activités Récentes
            </CardTitle>
            <p className="caption text-muted-foreground">
              Dernières actions effectuées
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {callsLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <Skeleton className="w-2 h-2 rounded-full mt-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-1" />
                      <Skeleton className="h-3 w-24 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))
              ) : (
                calls.slice(0, 5).map((call) => (
                  <div key={call.id} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="label text-sm">
                        {call.status === 'completed' ? 'Appel terminé' : 
                         call.status === 'active' ? 'Appel en cours' : 'Nouvel appel'}
                      </div>
                      <div className="caption text-muted-foreground">{call.customer_name}</div>
                      <div className="caption text-xs text-muted-foreground">
                        {format(new Date(call.created_at), 'HH:mm')}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => navigate('/dashboard/analytics')}
            >
              Voir l'historique complet
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Actions Rapides</CardTitle>
          <p className="caption text-muted-foreground">
            Accès direct aux fonctionnalités les plus utilisées
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/dashboard/calls')}
            >
              <Phone className="h-5 w-5" />
              <span>Nouveau Call</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/dashboard/crm')}
            >
              <Users className="h-5 w-5" />
              <span>Ajouter Client</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/dashboard/interventions')}
            >
              <Wrench className="h-5 w-5" />
              <span>Planifier Intervention</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex-col gap-2"
              onClick={() => navigate('/dashboard/analytics')}
            >
              <TrendingUp className="h-5 w-5" />
              <span>Voir Analytics</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}