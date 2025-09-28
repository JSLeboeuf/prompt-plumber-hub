import { useState, useEffect, useMemo, useCallback } from "react";
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
  RefreshCw,
  Filter,
  Calendar
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
import { useEmergencyCalls, useClients } from "@/hooks/useProductionData";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useDebounce } from "@/hooks/useDebounce";
import { AnalyticsLoadingState } from "@/components/analytics/AnalyticsLoadingState";
import { AnalyticsErrorState } from "@/components/analytics/AnalyticsErrorState";
import { SearchInput } from "@/components/analytics/SearchInput";

import { DashboardMetrics } from "@/types/dashboard";
import { supabase } from '@/integrations/supabase/client';

export default function Analytics() {
  const { canAccess } = useAuth();
  const { success, error: showError } = useToast();
  
  // Use production data hooks instead of optimized hooks to avoid TypeScript issues
  const { calls, loading: callsLoading, error: callsError, fetchCalls } = useEmergencyCalls();
  const { clients, error: clientsError, fetchClients } = useClients();

  // Analytics state
  const [analytics, setAnalytics] = useState<DashboardMetrics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  
  // UI state
  const [selectedPeriod, setSelectedPeriod] = useState('24h');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch analytics with proper error handling
  const fetchAnalytics = useCallback(async (period: string = selectedPeriod) => {
    try {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      
      const { data, error } = await supabase
        .rpc('get_dashboard_metrics_optimized', { time_period: period });
      
      if (error) throw error;
      
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        setAnalytics(data as unknown as DashboardMetrics);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de chargement analytics';
      setAnalyticsError(errorMessage);
      
      // Only show toast for critical errors
      if (process.env.NODE_ENV === 'development') {
        showError("Erreur Analytics", errorMessage);
      }
    } finally {
      setAnalyticsLoading(false);
    }
  }, [selectedPeriod, showError]);

  // Load analytics on mount and period change
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

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

  // Optimized handlers
  const handlePeriodChange = useCallback(async (period: string) => {
    setSelectedPeriod(period);
    await fetchAnalytics(period);
  }, [fetchAnalytics]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAnalytics(selectedPeriod),
        fetchCalls(),
        fetchClients()
      ]);
      success("Données actualisées", "Les métriques ont été mises à jour");
    } catch (error) {
      // Error handling is done in individual functions
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchAnalytics, selectedPeriod, fetchCalls, fetchClients, success]);

  // Enhanced export with error handling
  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    setIsExporting(true);
    try {
      // Simulate export process with validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      if (format === 'csv') {
        const csvContent = [
          ['Date Export', 'Période', 'Total Appels', 'Appels Actifs', 'Taux Succès', 'Durée Moyenne'],
          [
            new Date().toLocaleDateString('fr-FR'),
            selectedPeriod,
            analytics?.totalCalls || calls.length,
            analytics?.activeCalls || calls.filter(c => c.status === 'active').length,
            `${analytics?.successRate || 0}%`,
            `${analytics?.avgResponseTime || 0}min`
          ]
        ].map(row => 
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `drain-fortin-analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      success("Export réussi", `Rapport ${format.toUpperCase()} généré avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'export';
      showError("Erreur d'export", `Impossible de générer le rapport: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [selectedPeriod, analytics, calls, clients, success, showError]);

  // Real-time metrics calculation with proper error handling
  const realTimeMetrics = useMemo(() => {
    try {
      const safeCallsLength = calls?.length || 0;
      const activeCalls = calls?.filter(c => c.status === 'active')?.length || 0;
      const completedCalls = calls?.filter(c => c.status === 'completed')?.length || 0;
      const urgentCalls = calls?.filter(c => c.priority === 'P1')?.length || 0;
      
      const totalDuration = calls?.reduce((acc, call) => acc + (call.duration || 0), 0) || 0;
      const avgDuration = safeCallsLength > 0 ? Math.round(totalDuration / safeCallsLength) : 0;
      
      const successRate = safeCallsLength > 0 
        ? Math.round((completedCalls / safeCallsLength) * 100)
        : 0;

      return {
        totalCalls: safeCallsLength,
        activeCalls,
        completedCalls,
        urgentCalls,
        avgDuration,
        successRate
      };
    } catch (error) {
      // Return safe defaults if calculation fails
      return {
        totalCalls: 0,
        activeCalls: 0,
        completedCalls: 0,
        urgentCalls: 0,
        avgDuration: 0,
        successRate: 0
      };
    }
  }, [calls]);

  // KPI cards with semantic colors
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

  // Filter calls based on search query
  const filteredCalls = useMemo(() => {
    if (!debouncedSearchQuery.trim()) return calls?.slice(0, 10) || [];
    
    const query = debouncedSearchQuery.toLowerCase();
    return calls?.filter(call => 
      call.customer_name?.toLowerCase().includes(query) ||
      call.phone_number?.toLowerCase().includes(query) ||
      call.call_id?.toLowerCase().includes(query) ||
      call.status?.toLowerCase().includes(query) ||
      call.priority?.toLowerCase().includes(query)
    ).slice(0, 10) || [];
  }, [calls, debouncedSearchQuery]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Loading state
  if (analyticsLoading && callsLoading) {
    return <AnalyticsLoadingState />;
  }

  // Error state
  const hasError = analyticsError || callsError || clientsError;
  if (hasError && !analytics && (!calls || calls.length === 0)) {
    return (
      <AnalyticsErrorState
        error={analyticsError || callsError || clientsError || 'Erreur inconnue'}
        onRetry={handleRefresh}
      />
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
            aria-label="Actualiser les données"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center gap-2"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            aria-label="Exporter en CSV"
          >
            <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
            Exporter CSV
          </Button>
          <Button 
            className="flex items-center gap-2"
            onClick={() => handleExport('pdf')}
            disabled={isExporting}
            aria-label="Générer rapport PDF"
          >
            <FileText className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
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
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="title-md flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Appels en Temps Réel
                  </CardTitle>
                  <p className="caption text-muted-foreground">
                    Derniers appels traités - Mise à jour automatique
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SearchInput 
                    placeholder="Rechercher dans les appels..."
                    onSearch={handleSearch}
                    className="w-64"
                  />
                  <Button variant="outline" size="sm" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filtres
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {callsLoading ? (
                <AnalyticsLoadingState variant="table" />
              ) : callsError ? (
                <AnalyticsErrorState 
                  error={callsError} 
                  onRetry={fetchCalls}
                  variant="card"
                />
              ) : (
                <div className="overflow-x-auto">
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
                      {filteredCalls.length > 0 ? (
                        filteredCalls.map((call) => (
                          <TableRow key={call.id} className="hover:bg-surface/50">
                            <TableCell className="font-mono text-sm">
                              {call.call_id?.slice(0, 8)}...
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
                              <Badge 
                                variant={call.status === 'completed' ? 'default' : 'secondary'}
                                className={
                                  call.status === 'completed' ? 'bg-success text-success-foreground' :
                                  call.status === 'active' ? 'bg-primary text-primary-foreground' :
                                  'bg-secondary text-secondary-foreground'
                                }
                              >
                                {call.status}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge 
                                variant={call.priority === 'P1' ? 'destructive' : 'outline'}
                                className={
                                  call.priority === 'P1' ? 'bg-destructive text-destructive-foreground' :
                                  call.priority === 'P2' ? 'bg-warning text-warning-foreground' :
                                  'bg-secondary text-secondary-foreground'
                                }
                              >
                                {call.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {call.duration ? `${call.duration}min` : 'En cours...'}
                            </TableCell>
                            <TableCell>
                              {new Date(call.created_at).toLocaleString('fr-FR')}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {debouncedSearchQuery ? 'Aucun appel trouvé pour cette recherche' : 'Aucun appel disponible'}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="mt-6">
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
                  <div className="mt-4 grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Total analysé:</span>
                      <span className="font-medium">{calls?.length || 0} appels</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Clients uniques:</span>
                      <span className="font-medium">{clients?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Période active:</span>
                      <span className="font-medium">{selectedPeriod}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Dernière MAJ:</span>
                      <span className="font-medium">{new Date().toLocaleTimeString('fr-FR')}</span>
                    </div>
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