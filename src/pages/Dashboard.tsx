import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Phone, 
  Users, 
  Wrench, 
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data for dashboard overview
const dashboardData = {
  kpis: {
    callsToday: { value: 47, change: "+12%", trend: "up" },
    activeInterventions: { value: 23, change: "+8%", trend: "up" },
    clientsSatisfaction: { value: "4.6/5", change: "+0.2", trend: "up" },
    monthlyRevenue: { value: "24,350$", change: "+15%", trend: "up" }
  },
  urgentCalls: [
    { id: 1, client: "Jean Dupont", time: "14:32", priority: "P1", issue: "Tuyau éclaté cuisine" },
    { id: 2, client: "Marie Martin", time: "14:28", priority: "P2", issue: "Chasse d'eau qui fuit" },
    { id: 3, client: "Pierre Laval", time: "14:15", priority: "P1", issue: "Canalisation bouchée" }
  ],
  recentActivities: [
    { id: 1, action: "Intervention terminée", client: "Sophie Gagnon", time: "13:45" },
    { id: 2, action: "Nouveau client ajouté", client: "Marc Tremblay", time: "13:30" },
    { id: 3, action: "Devis envoyé", client: "Julie Moreau", time: "13:15" }
  ]
};

export default function Dashboard() {
  const navigate = useNavigate();

  const kpiCards = [
    {
      title: "Appels aujourd'hui",
      value: dashboardData.kpis.callsToday.value,
      change: dashboardData.kpis.callsToday.change,
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
      action: () => navigate('/dashboard/calls')
    },
    {
      title: "Interventions actives",
      value: dashboardData.kpis.activeInterventions.value,
      change: dashboardData.kpis.activeInterventions.change,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
      action: () => navigate('/dashboard/interventions')
    },
    {
      title: "Satisfaction clients",
      value: dashboardData.kpis.clientsSatisfaction.value,
      change: dashboardData.kpis.clientsSatisfaction.change,
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-100",
      action: () => navigate('/dashboard/crm')
    },
    {
      title: "CA mensuel",
      value: dashboardData.kpis.monthlyRevenue.value,
      change: dashboardData.kpis.monthlyRevenue.change,
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
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
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
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
              {dashboardData.urgentCalls.map((call) => (
                <div 
                  key={call.id}
                  className="flex items-center justify-between p-3 bg-surface rounded-lg border hover:shadow-sm transition-shadow duration-200"
                >
                  <div className="flex items-center gap-3">
                    <Badge className={`px-2 py-1 text-xs font-medium border ${getPriorityColor(call.priority)}`}>
                      {call.priority}
                    </Badge>
                    <div>
                      <div className="label">{call.client}</div>
                      <div className="caption text-muted-foreground">{call.issue}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span className="caption">{call.time}</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Prendre
                    </Button>
                  </div>
                </div>
              ))}
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
              {dashboardData.recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="label text-sm">{activity.action}</div>
                    <div className="caption text-muted-foreground">{activity.client}</div>
                    <div className="caption text-xs text-muted-foreground">{activity.time}</div>
                  </div>
                </div>
              ))}
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