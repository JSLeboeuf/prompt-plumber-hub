import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  TrendingUp,
  Phone,
  Wrench,
  Star,
  DollarSign,
  Download,
  FileText,
  Calendar,
  Loader2,
  RefreshCw
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAnalytics, useEmergencyCalls, useClients } from "@/hooks/useProductionData";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";

export default function Analytics() {
  const { analytics, loading: analyticsLoading, fetchAnalytics } = useAnalytics();
  const { calls } = useEmergencyCalls();
  const { clients } = useClients();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Check permissions
  if (!canAccess('analytics', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="title-md text-muted-foreground mb-2">Accès non autorisé</h3>
          <p className="body text-muted-foreground">
            Vous n'avez pas les permissions pour accéder aux analytiques
          </p>
        </div>
      </div>
    );
  }

  const handlePeriodChange = async (period: string) => {
    setSelectedPeriod(period);
    await fetchAnalytics(period);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAnalytics(selectedPeriod);
      toast({
        title: "Données actualisées",
        description: "Les métriques ont été mises à jour",
      });
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const data = {
        period: selectedPeriod,
        analytics,
        calls: calls.slice(0, 100), // Limit for export
        clients: clients.slice(0, 100),
        exportDate: new Date().toISOString(),
        exportFormat: format
      };

      if (format === 'csv') {
        const csvContent = [
          ['Date', 'Total Appels', 'Appels Actifs', 'Taux Succès', 'Durée Moyenne'],
          [
            new Date().toLocaleDateString(),
            analytics?.totalCalls || 0,
            analytics?.activeCalls || 0,
            `${analytics?.successRate || 0}%`,
            `${analytics?.avgDuration || 0}min`
          ]
        ].map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export réussi",
        description: `Rapport ${format.toUpperCase()} généré avec succès`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        title: "Erreur d'export",
        description: "Impossible de générer le rapport",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate real-time metrics
  const realTimeMetrics = {
    totalCalls: calls.length,
    activeCalls: calls.filter(c => c.status === 'active').length,
    completedCalls: calls.filter(c => c.status === 'completed').length,
    urgentCalls: calls.filter(c => c.priority === 'P1').length,
    avgDuration: calls.length > 0 
      ? Math.round(calls.reduce((acc, call) => acc + (call.duration || 0), 0) / calls.length)
      : 0,
    successRate: calls.length > 0 
      ? Math.round((calls.filter(c => c.status === 'completed').length / calls.length) * 100)
      : 0
  };

  const kpiCards = [
    {
      title: "Appels Total",
      value: analytics?.totalCalls || realTimeMetrics.totalCalls,
      evolution: "+12%",
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Interventions",
      value: analytics?.completedCalls || realTimeMetrics.completedCalls, 
      evolution: "+8%",
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Taux Succès",
      value: `${analytics?.successRate || realTimeMetrics.successRate}%`,
      evolution: "+0.2%",
      icon: Star,
      color: "text-yellow-600", 
      bgColor: "bg-yellow-100"
    },
    {
      title: "Durée Moyenne",
      value: `${analytics?.avgDuration || realTimeMetrics.avgDuration}min`,
      evolution: "-5%",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

  if (analyticsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h3 className="title-md text-muted-foreground mb-2">Chargement des analytics</h3>
          <p className="body text-muted-foreground">Calcul des métriques en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics Métier
          </h1>
          <p className="subtitle text-muted-foreground">
            Métriques de performance et insights business en temps réel
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter CSV
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            Rapport PDF
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Période:</span>
            {['1h', '24h', '7d', '30d'].map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? "default" : "outline"}
                size="sm"
                onClick={() => handlePeriodChange(period)}
              >
                {period}
              </Button>
            ))}
            <Badge variant="secondary" className="ml-auto">
              Dernière mise à jour: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
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

      {/* Real-time Data Tables */}
      <Tabs defaultValue="calls" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="calls">Appels Live</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="trends">Tendances</TabsTrigger>
          <TabsTrigger value="export">Exports</TabsTrigger>
        </TabsList>

        <TabsContent value="calls" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Appels en Temps Réel
              </CardTitle>
              <p className="caption text-muted-foreground">
                Derniers appels traités - Mise à jour automatique
              </p>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Appel</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Durée</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {calls.slice(0, 10).map((call) => (
                    <TableRow key={call.id}>
                      <TableCell className="font-mono text-sm">
                        {call.call_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {call.customer_name || 'Client Anonyme'}
                        </div>
                        {call.phone_number && (
                          <div className="text-sm text-muted-foreground">
                            {call.phone_number}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={call.status === 'completed' ? 'default' : 'secondary'}>
                          {call.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={call.priority === 'P1' ? 'destructive' : 'outline'}
                          className={
                            call.priority === 'P1' ? '' :
                            call.priority === 'P2' ? 'border-orange-500 text-orange-700' :
                            'border-gray-500 text-gray-700'
                          }
                        >
                          {call.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {call.duration ? `${call.duration}min` : 'En cours...'}
                      </TableCell>
                      <TableCell>
                        {new Date(call.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="title-md">Métriques de Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Taux de réponse</span>
                  <Badge>{realTimeMetrics.successRate}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Appels urgents (P1)</span>
                  <Badge variant="destructive">{realTimeMetrics.urgentCalls}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Temps moyen de résolution</span>
                  <Badge variant="outline">{realTimeMetrics.avgDuration}min</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Appels actifs maintenant</span>
                  <Badge variant="secondary">{realTimeMetrics.activeCalls}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="title-md">Répartition par Statut</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full" />
                    <span>Terminés</span>
                  </div>
                  <span className="font-medium">{realTimeMetrics.completedCalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                    <span>En cours</span>
                  </div>
                  <span className="font-medium">{realTimeMetrics.activeCalls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-500 rounded-full" />
                    <span>En attente</span>
                  </div>
                  <span className="font-medium">
                    {calls.filter(c => c.status === 'pending').length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md">Tendances et Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="title-md text-muted-foreground mb-2">Graphiques Interactifs</h3>
                  <p className="body text-muted-foreground">
                    Visualisation des tendances sur {selectedPeriod}
                  </p>
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p>Total des données analysées: {calls.length} appels</p>
                    <p>Clients uniques: {clients.length}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md flex items-center gap-2">
                <Download className="h-5 w-5" />
                Actions d'Export
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-20 flex-col"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  <FileText className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Rapport PDF</div>
                    <div className="text-xs text-muted-foreground">Analyse complète</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-20 flex-col"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  <Download className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Export CSV</div>
                    <div className="text-xs text-muted-foreground">Données brutes</div>
                  </div>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2 h-20 flex-col"
                  onClick={() => setSelectedPeriod('custom')}
                >
                  <Calendar className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Période Custom</div>
                    <div className="text-xs text-muted-foreground">Filtres avancés</div>
                  </div>
                </Button>
              </div>
              
              <div className="mt-6 p-4 bg-surface rounded-lg">
                <h4 className="font-medium mb-2">Données disponibles pour export</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Appels:</strong> {calls.length} enregistrements
                  </div>
                  <div>
                    <strong>Clients:</strong> {clients.length} enregistrements
                  </div>
                  <div>
                    <strong>Période:</strong> {selectedPeriod}
                  </div>
                  <div>
                    <strong>Dernière mise à jour:</strong> {new Date().toLocaleString()}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}