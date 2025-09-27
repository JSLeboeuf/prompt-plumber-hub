import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Phone, 
  Search,
  PhoneCall,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Plus,
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
import { useEmergencyCalls } from "@/hooks/useProductionData";
import { useToast } from "@/hooks/useToast";
import { format } from "date-fns";
import { CallsLoadingSkeleton } from "@/components/ui/loading-states";

export default function Calls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const { calls, loading, updateCall } = useEmergencyCalls();
  const toast = useToast();

  // Handle taking a call
  const handleTakeCall = async (callId: string) => {
    setActionLoading(callId);
    try {
      await updateCall(callId);
      toast.success("Appel pris en charge", "Vous êtes maintenant assigné à cet appel");
    } catch (error) {
      toast.error("Erreur", "Impossible de prendre l'appel en charge");
    } finally {
      setActionLoading(null);
    }
  };

  // Handle completing a call
  const handleCompleteCall = async (callId: string) => {
    setActionLoading(callId);
    try {
      await updateCall(callId);
      toast.success("Appel terminé", "L'intervention a été marquée comme terminée");
    } catch (error) {
      toast.error("Erreur", "Impossible de terminer l'appel");
    } finally {
      setActionLoading(null);
    }
  };

  // Calculate real-time stats from actual data
  const stats = {
    urgent: calls.filter(c => ['P1', 'P2'].includes(c.priority) && c.status !== 'completed').length,
    normal: calls.filter(c => c.priority === 'normal' && c.status !== 'completed').length,
    resolved: calls.filter(c => c.status === 'completed').length,
    total: calls.length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending': return 'bg-orange-100 text-orange-800 border-orange-200'; 
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'P1': return 'bg-red-500';
      case 'P2': return 'bg-orange-500'; 
      case 'P3': return 'bg-yellow-500';
      case 'normal': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return 'En cours';
      case 'pending': return 'En attente';
      case 'completed': return 'Terminé';
      case 'cancelled': return 'Annulé';
      default: return status;
    }
  };


  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.phone_number?.includes(searchTerm) ||
                         call.metadata?.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "tous" || call.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return <CallsLoadingSkeleton />;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            <Phone className="h-8 w-8 text-primary" />
            File d'Appels Urgents
          </h1>
          <p className="subtitle text-muted-foreground">
            Gestion des appels entrants et triage des urgences
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nouveau Appel
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card className="border-red-200 bg-red-50 interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-red-600">URGENT</p>
                <p className="text-3xl font-bold text-red-800 animate-scale-in">
                  {stats.urgent}
                  {stats.urgent > 0 && <span className="pulse-ring inline-block w-2 h-2 bg-red-500 rounded-full ml-2"></span>}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600 interactive-icon" />
            </div>
            <p className="caption text-red-700 mt-2">appels en attente</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50 interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-orange-600">NORMAL</p>
                <p className="text-3xl font-bold text-orange-800 animate-scale-in">
                  {stats.normal}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-600 interactive-icon" />
            </div>
            <p className="caption text-orange-700 mt-2">appels actifs</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-green-600">RÉSOLU</p>
                <p className="text-3xl font-bold text-green-800 animate-scale-in">
                  {stats.resolved}
                </p>
              </div>
              <PhoneCall className="h-8 w-8 text-green-600 interactive-icon" />
            </div>
            <p className="caption text-green-700 mt-2">appels terminés</p>
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-primary/5 interactive-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-primary">TOTAL</p>
                <p className="text-3xl font-bold text-primary animate-scale-in">
                  {stats.total}
                </p>
              </div>
              <Phone className="h-8 w-8 text-primary interactive-icon" />
            </div>
            <p className="caption text-primary mt-2">aujourd'hui</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Filtres et Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom, téléphone..."
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
                variant={statusFilter === "pending" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("pending")}
              >
                En attente
              </Button>
              <Button 
                variant={statusFilter === "active" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("active")}
              >
                En cours
              </Button>
              <Button 
                variant={statusFilter === "completed" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("completed")}
              >
                Terminés
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calls Table */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Appels - Temps Réel</CardTitle>
          <p className="caption text-muted-foreground">
            {filteredCalls.length} appel(s) affiché(s)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Heure</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCalls.length > 0 ? (
                filteredCalls.map((call) => (
                  <TableRow key={call.id} className="interactive-row animate-fade-in">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {format(new Date(call.created_at), 'HH:mm')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium flex items-center gap-2">
                          <User className="h-4 w-4" />
                          {call.customer_name}
                        </div>
                        {call.metadata?.address && (
                          <div className="caption text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {call.metadata.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <a 
                        href={`tel:${call.phone_number}`}
                        className="text-primary hover:underline"
                      >
                        {call.phone_number}
                      </a>
                    </TableCell>
                    <TableCell>
                      <Badge className={`border ${getStatusColor(call.status)}`}>
                        {getStatusLabel(call.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${getPriorityColor(call.priority)}`} />
                        <span className="font-medium">{call.priority}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate" title={call.metadata?.description}>
                        {call.metadata?.description || 'Intervention standard'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {call.status === 'pending' && (
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => handleTakeCall(call.id)}
                            disabled={actionLoading === call.id}
                          >
                            {actionLoading === call.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Prendre'
                            )}
                          </Button>
                        )}
                        {call.status === 'active' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCompleteCall(call.id)}
                            disabled={actionLoading === call.id}
                          >
                            {actionLoading === call.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Terminer'
                            )}
                          </Button>
                        )}
                        <Button size="sm" variant="ghost">
                          <Phone className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucun appel trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}