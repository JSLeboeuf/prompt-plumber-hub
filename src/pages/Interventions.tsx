import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wrench, 
  Calendar,
  MapPin,
  Clock,
  DollarSign,
  User,
  Plus,
  Columns,
  CalendarIcon,
  Loader2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/useToast";

interface Intervention {
  id: string;
  titre: string;
  client_id?: string;
  client_name: string;
  adresse: string;
  date_intervention: string;
  heure_intervention: string;
  statut: 'planifie' | 'en_cours' | 'termine' | 'facture';
  priorite: 'urgent' | 'normal' | 'faible';
  description: string;
  prix_estime?: number;
  technicien_id?: string;
  created_at: string;
  updated_at: string;
}

interface InterventionStats {
  aPlanifier: number;
  enCours: number;
  termine: number;
  facture: number;
}

export default function Interventions() {
  const [view, setView] = useState("kanban");
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [stats, setStats] = useState<InterventionStats>({
    aPlanifier: 0,
    enCours: 0,
    termine: 0,
    facture: 0
  });
  const [loading, setLoading] = useState(true);
  const { success, error } = useToast();

  useEffect(() => {
    fetchInterventions();
  }, []);

  const fetchInterventions = async () => {
    try {
      setLoading(true);
      
      // Table interventions non configurée - affichage état vide
      console.log('Module Interventions: Table non configurée, affichage état vide');
      setInterventions([]);
      setStats({ aPlanifier: 0, enCours: 0, termine: 0, facture: 0 });

    } catch (err) {
      console.error('Erreur lors du chargement des interventions:', err);
      error("Erreur de chargement", "Impossible de charger les interventions");
      setInterventions([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'planifie': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_cours': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'termine': return 'bg-green-100 text-green-800 border-green-200'; 
      case 'facture': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'urgent': return 'border-l-4 border-l-red-500';
      case 'normal': return 'border-l-4 border-l-orange-500';
      case 'faible': return 'border-l-4 border-l-green-500';
      default: return 'border-l-4 border-l-gray-500';
    }
  };

  const kanbanColumns = [
    { id: 'planifie', title: 'À PLANIFIER', color: 'bg-blue-50 border-blue-200' },
    { id: 'en_cours', title: 'EN COURS', color: 'bg-orange-50 border-orange-200' }, 
    { id: 'termine', title: 'TERMINÉ', color: 'bg-green-50 border-green-200' },
    { id: 'facture', title: 'FACTURÉ', color: 'bg-purple-50 border-purple-200' }
  ];

  const getInterventionsByStatus = (status: string) => {
    return interventions.filter(intervention => intervention.statut === status);
  };

  const InterventionCard = ({ intervention }: { intervention: Intervention }) => (
    <Card className={`mb-3 cursor-pointer hover:shadow-md transition-shadow duration-200 ${getPriorityColor(intervention.priorite)}`}>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h4 className="font-medium text-sm">{intervention.titre}</h4>
            <Badge className={`text-xs ${getStatusColor(intervention.statut)}`}>
              {intervention.priorite}
            </Badge>
          </div>
          
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{intervention.client_name}</span>
            </div>
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{intervention.adresse}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{intervention.date_intervention} {intervention.heure_intervention}</span>
            </div>
            {intervention.technicien_id && (
              <div className="flex items-center gap-1">
                <Wrench className="h-3 w-3" />
                <span>Technicien assigné</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center justify-between pt-2">
            {intervention.prix_estime && (
              <div className="flex items-center gap-1 text-green-600 font-medium text-sm">
                <DollarSign className="h-3 w-3" />
                <span>{intervention.prix_estime}$</span>
              </div>
            )}
            <div className="text-xs text-muted-foreground">
              ID: {intervention.id.slice(0, 8)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des interventions...</p>
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
            <Wrench className="h-8 w-8 text-primary" />
            Suivi des Interventions
          </h1>
          <p className="subtitle text-muted-foreground">
            Planification et suivi des interventions terrain
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4" />
            Planifier
          </Button>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Nouvelle Intervention
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-blue-600">À PLANIFIER</p>
                <p className="text-3xl font-bold text-blue-800">{stats.aPlanifier}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-orange-600">EN COURS</p>
                <p className="text-3xl font-bold text-orange-800">{stats.enCours}</p>
              </div>
              <Wrench className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-green-600">TERMINÉ</p>
                <p className="text-3xl font-bold text-green-800">{stats.termine}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-purple-600">FACTURÉ</p>
                <p className="text-3xl font-bold text-purple-800">{stats.facture}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* View Toggle */}
      <Tabs value={view} onValueChange={setView}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="kanban" className="flex items-center gap-2">
              <Columns className="h-4 w-4" />
              Vue Kanban
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Vue Calendrier
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="mt-6">
          {/* Kanban Board */}
          <div className="grid gap-6 md:grid-cols-4">
            {kanbanColumns.map((column) => (
              <Card key={column.id} className={`${column.color} border`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-center">
                    {column.title}
                    <Badge variant="secondary" className="ml-2">
                      {getInterventionsByStatus(column.id).length}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {getInterventionsByStatus(column.id).map((intervention) => (
                      <InterventionCard key={intervention.id} intervention={intervention} />
                    ))}
                    
                    {getInterventionsByStatus(column.id).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground text-sm">
                        Aucune intervention
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {interventions.length === 0 && (
            <Card className="mt-6">
              <CardContent className="p-12 text-center">
                <Wrench className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="title-md text-muted-foreground mb-2">Aucune intervention</h3>
                <p className="body text-muted-foreground max-w-md mx-auto mb-4">
                  Aucune intervention n'est actuellement enregistrée dans le système.
                  Créez votre première intervention pour commencer.
                </p>
                <Button className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Créer une intervention
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="title-md flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Vue Calendrier
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-surface rounded-lg p-12 text-center">
                <CalendarIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="title-md text-muted-foreground mb-2">Vue Calendrier</h3>
                <p className="body text-muted-foreground max-w-md mx-auto">
                  Interface calendrier pour la planification visuelle des interventions.
                  Configuration requise pour l'intégration complète.
                </p>
                <Button variant="outline" className="mt-4" disabled>
                  Configuration requise
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Géolocalisation */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Géolocalisation & Optimisation Trajets
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-surface rounded-lg p-12 text-center">
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="title-md text-muted-foreground mb-2">Carte des Interventions</h3>
            <p className="body text-muted-foreground max-w-md mx-auto">
              Visualisation des adresses clients avec optimisation automatique des trajets.
              Intégration Google Maps disponible avec configuration API.
            </p>
            <Button variant="outline" className="mt-4" disabled>
              Configuration Google Maps requise
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}