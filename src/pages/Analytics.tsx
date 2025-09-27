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

// Mock analytics data
const analyticsData = {
  kpis: {
    appels: { valeur: 127, evolution: "+12%" },
    interventions: { valeur: 89, evolution: "+8%" },
    satisfaction: { valeur: 4.6, evolution: "+0.2" },
    ca: { valeur: 24350, evolution: "+15%" }
  },
  evolution: [
    { periode: "Semaine 37", appels: 98, interventions: 72, conversion: 73, ca: 18900, satisfaction: 4.5 },
    { periode: "Semaine 38", appels: 113, interventions: 83, conversion: 73, ca: 21200, satisfaction: 4.4 },
    { periode: "Semaine 39", appels: 127, interventions: 89, conversion: 70, ca: 24350, satisfaction: 4.6 }
  ],
  typeInterventions: {
    urgence: 45,
    entretien: 32, 
    reparation: 12
  },
  sourcesAppels: {
    site: 40,
    telephone: 35,
    recommandation: 25
  }
};

export default function Analytics() {
  const kpiCards = [
    {
      title: "Appels Mensuels",
      value: analyticsData.kpis.appels.valeur,
      evolution: analyticsData.kpis.appels.evolution,
      icon: Phone,
      color: "text-blue-600",
      bgColor: "bg-blue-100"
    },
    {
      title: "Interventions",
      value: analyticsData.kpis.interventions.valeur, 
      evolution: analyticsData.kpis.interventions.evolution,
      icon: Wrench,
      color: "text-orange-600",
      bgColor: "bg-orange-100"
    },
    {
      title: "Satisfaction",
      value: `${analyticsData.kpis.satisfaction.valeur}/5`,
      evolution: analyticsData.kpis.satisfaction.evolution,
      icon: Star,
      color: "text-yellow-600", 
      bgColor: "bg-yellow-100"
    },
    {
      title: "CA Mensuel",
      value: `${(analyticsData.kpis.ca.valeur / 1000).toFixed(1)}k$`,
      evolution: analyticsData.kpis.ca.evolution,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100"
    }
  ];

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
            Métriques de performance et insights business
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exporter CSV
          </Button>
          <Button className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Rapport PDF
          </Button>
        </div>
      </div>

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
                    {kpi.evolution} vs mois dernier
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts and Tables */}
      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="types">Types d'Interventions</TabsTrigger>
          <TabsTrigger value="sources">Sources d'Appels</TabsTrigger>
          <TabsTrigger value="conversion">Taux de Conversion</TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Évolution des Métriques (30 derniers jours)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Chart Placeholder */}
              <div className="h-64 bg-surface rounded-lg flex items-center justify-center mb-6">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="title-md text-muted-foreground mb-2">Graphique Évolution</h3>
                  <p className="body text-muted-foreground">
                    Courbes d'évolution des appels, interventions et CA sur 30 jours
                  </p>
                </div>
              </div>
              
              {/* Data Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Période</TableHead>
                    <TableHead>Appels</TableHead>
                    <TableHead>Interventions</TableHead>
                    <TableHead>Taux Conversion</TableHead>
                    <TableHead>CA</TableHead>
                    <TableHead>Satisfaction</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.evolution.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{row.periode}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-blue-600" />
                          {row.appels}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Wrench className="h-4 w-4 text-orange-600" />
                          {row.interventions}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={row.conversion >= 70 ? "default" : "secondary"}>
                          {row.conversion}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-green-600 font-medium">
                          <DollarSign className="h-4 w-4" />
                          {row.ca.toLocaleString()}$
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Star className="h-4 w-4 text-yellow-600" />
                          {row.satisfaction}/5
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="title-md">Répartition par Type d'Intervention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-surface rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="title-md text-muted-foreground mb-2">Graphique Secteurs</h3>
                    <p className="body text-muted-foreground">
                      Distribution des types d'interventions
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full" />
                      <span>Urgences</span>
                    </div>
                    <span className="font-medium">{analyticsData.typeInterventions.urgence}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full" />
                      <span>Entretien</span>
                    </div>
                    <span className="font-medium">{analyticsData.typeInterventions.entretien}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Réparations</span>
                    </div>
                    <span className="font-medium">{analyticsData.typeInterventions.reparation}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="title-md">Sources d'Appels</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 bg-surface rounded-lg flex items-center justify-center mb-4">
                  <div className="text-center">
                    <Phone className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="title-md text-muted-foreground mb-2">Graphique Sources</h3>
                    <p className="body text-muted-foreground">
                      Origine des appels clients
                    </p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-purple-500 rounded-full" />
                      <span>Site Web</span>
                    </div>
                    <span className="font-medium">{analyticsData.sourcesAppels.site}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-orange-500 rounded-full" />
                      <span>Téléphone Direct</span>
                    </div>
                    <span className="font-medium">{analyticsData.sourcesAppels.telephone}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-teal-500 rounded-full" />
                      <span>Recommandations</span>
                    </div>
                    <span className="font-medium">{analyticsData.sourcesAppels.recommandation}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="conversion" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md">Taux de Conversion Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-surface rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="title-md text-muted-foreground mb-2">Graphique Zone</h3>
                  <p className="body text-muted-foreground">
                    Évolution du taux de conversion des leads en clients payants
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md flex items-center gap-2">
            <Download className="h-5 w-5" />
            Actions d'Export
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="flex items-center gap-2 h-20 flex-col">
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Rapport PDF</div>
                <div className="text-xs text-muted-foreground">Analyse complète</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2 h-20 flex-col">
              <Download className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Export CSV</div>
                <div className="text-xs text-muted-foreground">Données brutes</div>
              </div>
            </Button>
            
            <Button variant="outline" className="flex items-center gap-2 h-20 flex-col">
              <Calendar className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Période Custom</div>
                <div className="text-xs text-muted-foreground">Filtres avancés</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}