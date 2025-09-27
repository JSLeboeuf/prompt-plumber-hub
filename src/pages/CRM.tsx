import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  Search, 
  Plus,
  Phone,
  Mail,
  Eye,
  MapPin,
  Calendar,
  TrendingUp,
  Star,
  Loader2
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { usePaginatedCRM } from "@/hooks/usePaginatedCRM";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { CRMLoadingSkeleton } from "@/components/ui/loading-states";

export default function CRM() {
  const { clients, leads, loading: dataLoading, createClient, activeClients, newLeads, loadMore, hasMore, loadingMore } = usePaginatedCRM();
  const { canAccess, loading: authLoading } = useAuth();
  const { success, error: showError } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Check permissions with auth loading state
  if (authLoading) {
    return <CRMLoadingSkeleton />;
  }

  if (!canAccess('clients', 'read')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="title-md text-muted-foreground mb-2">Accès non autorisé</h3>
          <p className="body text-muted-foreground mb-4">
            Vous n'avez pas les permissions pour accéder au CRM
          </p>
          <a href="/auth" className="btn btn-primary">Se connecter</a>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calculateScore = (client: any) => {
    // Simple scoring algorithm based on activity and service history
    let score = 50; // Base score
    
    if (client.service_history?.length > 5) score += 30;
    else if (client.service_history?.length > 2) score += 20;
    else if (client.service_history?.length > 0) score += 10;
    
    if (client.email && client.phone) score += 10;
    if (client.notes) score += 5;
    if (client.status === 'active') score += 15;
    
    return Math.min(100, score);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.phone?.includes(searchTerm)) ||
                         (client.email?.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "tous" || client.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCreateClient = async (clientData: any) => {
    if (!canAccess('clients', 'create')) {
      showError("Accès refusé", "Vous n'avez pas les permissions pour créer des clients");
      return;
    }

    try {
      setIsCreating(true);
      await createClient(clientData);
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (dataLoading && clients.length === 0) {
    return <CRMLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            <Users className="h-8 w-8 text-primary" />
            CRM Clients
          </h1>
          <p className="subtitle text-muted-foreground">
            Gestion de la relation client et suivi des leads en temps réel
          </p>
        </div>
        {canAccess('clients', 'create') && (
          <Button 
            className="flex items-center gap-2"
            onClick={() => handleCreateClient({
              name: "Nouveau Client",
              status: "lead"
            })}
            disabled={isCreating}
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter Client
          </Button>
        )}
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold animate-scale-in">{clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary interactive-icon" />
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Leads Actifs</p>
                <p className="text-3xl font-bold animate-scale-in">
                  {newLeads.length}
                  {newLeads.length > 0 && 
                    <span className="pulse-ring inline-block w-2 h-2 bg-blue-500 rounded-full ml-2"></span>
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600 interactive-icon" />
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Score Moyen</p>
                <p className="text-3xl font-bold animate-scale-in">
                  {clients.length > 0 
                    ? Math.round(clients.reduce((acc, c) => acc + calculateScore(c), 0) / clients.length)
                    : 0
                  }%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600 interactive-icon" />
            </div>
          </CardContent>
        </Card>

        <Card className="interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Clients Actifs</p>
                <p className="text-3xl font-bold animate-scale-in">
                  {activeClients.length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600 interactive-icon" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant={statusFilter === "tous" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("tous")}
              >
                Tous
              </Button>
              <Button 
                variant={statusFilter === "lead" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("lead")}
              >
                Leads
              </Button>
              <Button 
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                Actifs
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Base Clients Live</CardTitle>
          <p className="caption text-muted-foreground">
            {filteredClients.length} client(s) affiché(s) - Données en temps réel
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Score Lead</TableHead>
                <TableHead>Historique</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Tags</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => {
                const score = calculateScore(client);
                return (
                  <TableRow key={client.id} className="hover:bg-surface">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{client.name}</div>
                        {client.address && (
                          <div className="caption text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {client.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {client.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            <a href={`tel:${client.phone}`} className="text-primary hover:underline caption">
                              {client.phone}
                            </a>
                          </div>
                        )}
                        {client.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <a href={`mailto:${client.email}`} className="text-primary hover:underline caption">
                              {client.email}
                            </a>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}%
                        </div>
                        <div className="caption text-muted-foreground">
                          {score >= 80 ? 'Chaud' : score >= 60 ? 'Tiède' : 'Froid'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{client.service_history?.length || 0} services</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusColor(client.status)}`}>
                        {client.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {client.tags?.slice(0, 2).map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(client.tags?.length || 0) > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{(client.tags?.length || 0) - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {client.phone && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`tel:${client.phone}`)}>
                            <Phone className="h-4 w-4" />
                          </Button>
                        )}
                        {client.email && (
                          <Button size="sm" variant="ghost" onClick={() => window.open(`mailto:${client.email}`)}>
                            <Mail className="h-4 w-4" />
                          </Button>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" onClick={() => setSelectedClient(client)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md">
                            <DialogHeader>
                              <DialogTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Fiche Client - {client.name}
                              </DialogTitle>
                            </DialogHeader>
                            
                            {selectedClient && (
                              <div className="space-y-4">
                                <div className="grid gap-4">
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Informations de contact</h4>
                                    <div className="space-y-1 text-sm">
                                      {selectedClient.address && (
                                        <div className="flex items-center gap-2">
                                          <MapPin className="h-4 w-4" />
                                          {selectedClient.address}
                                        </div>
                                      )}
                                      {selectedClient.phone && (
                                        <div className="flex items-center gap-2">
                                          <Phone className="h-4 w-4" />
                                          {selectedClient.phone}
                                        </div>
                                      )}
                                      {selectedClient.email && (
                                        <div className="flex items-center gap-2">
                                          <Mail className="h-4 w-4" />
                                          {selectedClient.email}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Score & Statut</h4>
                                    <div className="flex items-center gap-4">
                                      <Badge className={`border ${getStatusColor(selectedClient.status)}`}>
                                        {selectedClient.status}
                                      </Badge>
                                      <span className={`text-lg font-bold ${getScoreColor(calculateScore(selectedClient))}`}>
                                        {calculateScore(selectedClient)}% 
                                      </span>
                                    </div>
                                  </div>
                                  
                                  {selectedClient.notes && (
                                    <div className="space-y-2">
                                      <h4 className="font-medium">Notes</h4>
                                      <p className="text-sm text-muted-foreground">
                                        {selectedClient.notes}
                                      </p>
                                    </div>
                                  )}
                                  
                                  <div className="space-y-2">
                                    <h4 className="font-medium">Historique des services</h4>
                                    <div className="text-sm text-muted-foreground">
                                      {selectedClient.service_history?.length || 0} intervention(s) enregistrée(s)
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="flex gap-2 pt-4">
                                  {canAccess('clients', 'write') && (
                                    <Button className="flex-1">Modifier</Button>
                                  )}
                                  <Button variant="outline" className="flex-1">Historique</Button>
                                  <Button variant="outline" className="flex-1">Nouveau RDV</Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button 
            onClick={loadMore} 
            disabled={loadingMore}
            variant="outline"
            className="w-48"
          >
            {loadingMore ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Chargement...
              </>
            ) : (
              'Charger plus de clients'
            )}
          </Button>
        </div>
      )}
    </div>
  );
}