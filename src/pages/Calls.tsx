import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  Search, 
  Filter,
  PhoneCall,
  AlertTriangle,
  Clock,
  User,
  MapPin,
  Plus
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Mock data for calls
const callsData = {
  stats: {
    urgent: 3,
    normal: 7, 
    resolved: 12,
    total: 22
  },
  calls: [
    {
      id: 1,
      heure: "14:32",
      client: "Jean Dupont", 
      telephone: "+1 438 555-0123",
      statut: "en_cours",
      priorite: "P1",
      description: "Tuyau éclaté cuisine - Inondation",
      adresse: "123 Rue Laval, Montréal",
      assignedTo: "Tech-01"
    },
    {
      id: 2,
      heure: "14:28", 
      client: "Marie Martin",
      telephone: "+1 514 555-0456", 
      statut: "en_attente",
      priorite: "P2",
      description: "Chasse d'eau qui fuit",
      adresse: "456 Ave Cartier, Québec",
      assignedTo: null
    },
    {
      id: 3,
      heure: "14:15",
      client: "Pierre Laval", 
      telephone: "+1 450 555-0789",
      statut: "nouveau",
      priorite: "P1", 
      description: "Canalisation bouchée - Urgence",
      adresse: "789 Boul. Saint-Laurent, Longueuil",
      assignedTo: null
    },
    {
      id: 4,
      heure: "13:58",
      client: "Sophie Gagnon",
      telephone: "+1 438 555-0321", 
      statut: "resolu",
      priorite: "P2",
      description: "Réparation robinet terminée",
      adresse: "321 Rue Ontario, Montréal", 
      assignedTo: "Tech-02"
    }
  ]
};

export default function Calls() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'en_attente': return 'bg-orange-100 text-orange-800 border-orange-200'; 
      case 'nouveau': return 'bg-red-100 text-red-800 border-red-200';
      case 'resolu': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priorite: string) => {
    switch (priorite) {
      case 'P1': return 'bg-red-500';
      case 'P2': return 'bg-orange-500'; 
      case 'P3': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (statut: string) => {
    switch (statut) {
      case 'en_cours': return 'En cours';
      case 'en_attente': return 'En attente';
      case 'nouveau': return 'Nouveau';
      case 'resolu': return 'Résolu';
      default: return statut;
    }
  };

  const filteredCalls = callsData.calls.filter(call => {
    const matchesSearch = call.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.telephone.includes(searchTerm) ||
                         call.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "tous" || call.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-red-600">URGENT</p>
                <p className="text-3xl font-bold text-red-800">{callsData.stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <p className="caption text-red-700 mt-2">appels en attente</p>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-orange-600">NORMAL</p>
                <p className="text-3xl font-bold text-orange-800">{callsData.stats.normal}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
            <p className="caption text-orange-700 mt-2">appels actifs</p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-green-600">RÉSOLU</p>
                <p className="text-3xl font-bold text-green-800">{callsData.stats.resolved}</p>
              </div>
              <PhoneCall className="h-8 w-8 text-green-600" />
            </div>
            <p className="caption text-green-700 mt-2">appels terminés</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-blue-600">TOTAL</p>
                <p className="text-3xl font-bold text-blue-800">{callsData.stats.total}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
            <p className="caption text-blue-700 mt-2">aujourd'hui</p>
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
                variant={statusFilter === "nouveau" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("nouveau")}
              >
                Nouveaux
              </Button>
              <Button 
                variant={statusFilter === "en_cours" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("en_cours")}
              >
                En cours
              </Button>
              <Button 
                variant={statusFilter === "resolu" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("resolu")}
              >
                Résolus
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
              {filteredCalls.map((call) => (
                <TableRow key={call.id} className="hover:bg-surface">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{call.heure}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium flex items-center gap-2">
                        <User className="h-4 w-4" />
                        {call.client}
                      </div>
                      <div className="caption text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {call.adresse}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a 
                      href={`tel:${call.telephone}`}
                      className="text-primary hover:underline"
                    >
                      {call.telephone}
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getStatusColor(call.statut)}`}>
                      {getStatusLabel(call.statut)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getPriorityColor(call.priorite)}`} />
                      <span className="font-medium">{call.priorite}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={call.description}>
                      {call.description}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {call.statut === 'nouveau' && (
                        <Button size="sm" variant="default">
                          Prendre
                        </Button>
                      )}
                      {call.statut === 'en_attente' && (
                        <Button size="sm" variant="outline">
                          Assigner
                        </Button>
                      )}
                      {call.statut === 'en_cours' && (
                        <Button size="sm" variant="outline">
                          Terminer
                        </Button>
                      )}
                      <Button size="sm" variant="ghost">
                        <Phone className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}