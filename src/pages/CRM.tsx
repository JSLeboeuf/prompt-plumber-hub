import { useState } from "react";
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
  Star
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

// Mock data for CRM
const crmData = {
  clients: [
    {
      id: 1,
      nom: "Jean Dupont",
      telephone: "+14385550123", 
      email: "dupont@email.com",
      score: 85,
      statut: "actif",
      adresse: "123 Rue Laval, Montréal",
      notes: "Client régulier, satisfait des services",
      derniereActivite: "2h",
      interventions: 5,
      valeurVie: 2400
    },
    {
      id: 2,
      nom: "Marie Martin", 
      telephone: "+15145550456",
      email: "martin@email.com", 
      score: 42,
      statut: "lead",
      adresse: "456 Ave Cartier, Québec",
      notes: "Intéressée par l'entretien annuel",
      derniereActivite: "3j",
      interventions: 1,
      valeurVie: 350
    },
    {
      id: 3,
      nom: "Pierre Laval",
      telephone: "+14505550789", 
      email: "pierre.laval@email.com",
      score: 72,
      statut: "actif", 
      adresse: "789 Boul. Saint-Laurent, Longueuil",
      notes: "Propriétaire commercial, besoins récurrents",
      derniereActivite: "1j",
      interventions: 12,
      valeurVie: 8900
    }
  ],
  timeline: [
    { date: "15/09/2025", action: "Intervention plomberie", status: "Satisfait" },
    { date: "12/09/2025", action: "Appel de suivi", status: "Positif" },
    { date: "08/09/2025", action: "Devis envoyé", status: "En attente" }
  ]
};

export default function CRM() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("tous");
  const [selectedClient, setSelectedClient] = useState(null);

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'actif': return 'bg-green-100 text-green-800 border-green-200';
      case 'lead': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'inactif': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredClients = crmData.clients.filter(client => {
    const matchesSearch = client.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.telephone.includes(searchTerm) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "tous" || client.statut === statusFilter;
    return matchesSearch && matchesStatus;
  });

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
            Gestion de la relation client et suivi des leads
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Ajouter Client
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Total Clients</p>
                <p className="text-3xl font-bold">{crmData.clients.length}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Leads Actifs</p>
                <p className="text-3xl font-bold">
                  {crmData.clients.filter(c => c.statut === 'lead').length}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Score Moyen</p>
                <p className="text-3xl font-bold">
                  {Math.round(crmData.clients.reduce((acc, c) => acc + c.score, 0) / crmData.clients.length)}%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="label text-muted-foreground">Valeur Totale</p>
                <p className="text-3xl font-bold">
                  {(crmData.clients.reduce((acc, c) => acc + c.valeurVie, 0) / 1000).toFixed(0)}k$
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
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
                variant={statusFilter === "actif" ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter("actif")}
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
          <CardTitle className="title-md">Base Clients</CardTitle>
          <p className="caption text-muted-foreground">
            {filteredClients.length} client(s) affiché(s)
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Score Lead</TableHead>
                <TableHead>Dernière Activité</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Valeur</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.map((client) => (
                <TableRow key={client.id} className="hover:bg-surface">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium">{client.nom}</div>
                      <div className="caption text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {client.adresse}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        <a href={`tel:${client.telephone}`} className="text-primary hover:underline caption">
                          {client.telephone}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        <a href={`mailto:${client.email}`} className="text-primary hover:underline caption">
                          {client.email}
                        </a>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`text-2xl font-bold ${getScoreColor(client.score)}`}>
                        {client.score}%
                      </div>
                      <div className="caption text-muted-foreground">
                        {client.score >= 80 ? 'Chaud' : client.score >= 60 ? 'Tiède' : 'Froid'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>{client.derniereActivite}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getStatusColor(client.statut)}`}>
                      {client.statut}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{client.valeurVie}$</div>
                      <div className="caption text-muted-foreground">{client.interventions} intervention(s)</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost">
                        <Mail className="h-4 w-4" />
                      </Button>
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
                              Fiche Client - {client.nom}
                            </DialogTitle>
                          </DialogHeader>
                          
                          {selectedClient && (
                            <div className="space-y-4">
                              <div className="grid gap-4">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Informations de contact</h4>
                                  <div className="space-y-1 text-sm">
                                    <div className="flex items-center gap-2">
                                      <MapPin className="h-4 w-4" />
                                      {selectedClient.adresse}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Phone className="h-4 w-4" />
                                      {selectedClient.telephone}
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Mail className="h-4 w-4" />
                                      {selectedClient.email}
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium">Score & Statut</h4>
                                  <div className="flex items-center gap-4">
                                    <Badge className={`border ${getStatusColor(selectedClient.statut)}`}>
                                      {selectedClient.statut}
                                    </Badge>
                                    <span className={`text-lg font-bold ${getScoreColor(selectedClient.score)}`}>
                                      {selectedClient.score}% (Lead {selectedClient.score >= 80 ? 'chaud' : selectedClient.score >= 60 ? 'tiède' : 'froid'})
                                    </span>
                                  </div>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium">Notes</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedClient.notes}
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <h4 className="font-medium">Timeline des activités</h4>
                                  <div className="space-y-2">
                                    {crmData.timeline.map((item, index) => (
                                      <div key={index} className="flex items-start gap-3 text-sm">
                                        <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                                        <div>
                                          <div className="font-medium">{item.action}</div>
                                          <div className="text-muted-foreground">{item.date} - {item.status}</div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-2 pt-4">
                                <Button className="flex-1">Modifier</Button>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}