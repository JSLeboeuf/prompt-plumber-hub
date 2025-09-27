import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Download,
  FileText,
  Eye,
  Clock,
  User,
  Database
} from "lucide-react";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

// Mock compliance data
const conformiteData = {
  status: {
    rgpd: { conforme: true, derniereVerification: "2025-09-20" },
    loi25: { conforme: true, derniereVerification: "2025-09-18" },
    auditTrail: { actif: true, dernierAudit: "2025-09-27" },
    chiffrement: { actif: true, dernierTest: "2025-09-25" },
    misesAJour: { requises: 2, description: "Consentements à renouveler" }
  },
  auditLogs: [
    {
      date: "2025-09-27T14:32:00",
      action: "consultation",
      utilisateur: "admin@drainfortin.com",
      ressource: "Client Dupont",
      details: "Accès fiche client pour intervention",
      ip: "192.168.1.100"
    },
    {
      date: "2025-09-27T14:28:00", 
      action: "modification",
      utilisateur: "agent1@drainfortin.com",
      ressource: "Intervention #123",
      details: "Statut changé à 'Terminé'",
      ip: "192.168.1.101"
    },
    {
      date: "2025-09-27T14:15:00",
      action: "export",
      utilisateur: "admin@drainfortin.com", 
      ressource: "Données clients",
      details: "Génération CSV pour comptabilité",
      ip: "192.168.1.100"
    },
    {
      date: "2025-09-27T13:45:00",
      action: "connexion",
      utilisateur: "tech2@drainfortin.com",
      ressource: "Interface mobile",
      details: "Connexion application technicien",
      ip: "192.168.1.102"
    }
  ],
  exports: [
    {
      id: 1,
      demandeur: "admin@drainfortin.com",
      datedemande: "2025-09-25",
      statut: "termine",
      type: "Données personnelles complètes",
      taille: "2.4 MB"
    },
    {
      id: 2,
      demandeur: "client@example.com", 
      datedemande: "2025-09-24",
      statut: "en_cours",
      type: "Historique interventions",
      taille: "En cours..."
    }
  ],
  utilisateurs: [
    {
      email: "admin@drainfortin.com",
      role: "Administrateur",
      derniereConnexion: "2025-09-27T14:32:00",
      statut: "actif"
    },
    {
      email: "agent1@drainfortin.com",
      role: "Agent",
      derniereConnexion: "2025-09-27T14:28:00", 
      statut: "actif"
    },
    {
      email: "tech2@drainfortin.com",
      role: "Technicien",
      derniereConnexion: "2025-09-27T13:45:00",
      statut: "actif"
    }
  ]
};

export default function Conformite() {
  const getActionColor = (action: string) => {
    switch (action) {
      case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'modification': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'export': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'connexion': return 'bg-green-100 text-green-800 border-green-200';
      case 'suppression': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (statut: string) => {
    switch (statut) {
      case 'termine': return 'bg-green-100 text-green-800 border-green-200';
      case 'en_cours': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'echec': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-xl flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            Conformité & Logs
          </h1>
          <p className="subtitle text-muted-foreground">
            Conformité RGPD/Loi 25 et audit trail sécurisé
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Conformité
        </Button>
      </div>

      {/* Status Conformity */}
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="title-md flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-600" />
            Statut de Conformité
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">RGPD</div>
                <div className="text-xs text-green-600">CONFORME</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Loi 25</div>
                <div className="text-xs text-green-600">CONFORME</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Audit Trail</div>
                <div className="text-xs text-green-600">ACTIF</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div>
                <div className="font-medium text-green-800">Chiffrement</div>
                <div className="text-xs text-green-600">ACTIF</div>
              </div>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <div className="font-medium text-orange-800">Mise à jour</div>
                <div className="text-xs text-orange-600">2 requises</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Audit Trail */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="title-md flex items-center gap-2">
              <Database className="h-5 w-5" />
              Historique d'Audit
            </CardTitle>
            <p className="caption text-muted-foreground mt-1">
              Journal détaillé de toutes les actions utilisateurs
            </p>
          </div>
          <Button variant="outline" size="sm">
            Filtrer
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Détails</TableHead>
                <TableHead>IP</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {conformiteData.auditLogs.map((log, index) => (
                <TableRow key={index} className="hover:bg-surface">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {new Date(log.date).toLocaleDateString('fr-CA')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(log.date).toLocaleTimeString('fr-CA')}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`border ${getActionColor(log.action)}`}>
                      {log.action}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">{log.utilisateur}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">{log.ressource}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{log.details}</span>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-surface px-2 py-1 rounded">
                      {log.ip}
                    </code>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Export RGPD & User Management */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="title-md flex items-center gap-2">
              <Download className="h-5 w-5" />
              Exports RGPD
            </CardTitle>
            <p className="caption text-muted-foreground mt-1">
              Demandes d'export de données personnelles
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button className="w-full flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Demander Export Données
              </Button>
              
              <div className="space-y-3">
                <h4 className="font-medium">Exports récents</h4>
                {conformiteData.exports.map((exp) => (
                  <div key={exp.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                    <div>
                      <div className="font-medium text-sm">{exp.type}</div>
                      <div className="caption text-muted-foreground">{exp.demandeur}</div>
                      <div className="caption text-muted-foreground">{exp.datedemande}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={`border text-xs ${getStatusColor(exp.statut)}`}>
                        {exp.statut}
                      </Badge>
                      {exp.statut === 'termine' && (
                        <Button size="sm" variant="ghost">
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="title-md flex items-center gap-2">
              <User className="h-5 w-5" />
              Gestion des Accès
            </CardTitle>
            <p className="caption text-muted-foreground mt-1">
              Utilisateurs et permissions système
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {conformiteData.utilisateurs.map((user, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary-foreground" />
                    </div>
                    <div>
                      <div className="font-medium">{user.email}</div>
                      <div className="caption text-muted-foreground">{user.role}</div>
                      <div className="caption text-muted-foreground">
                        Dernière connexion: {new Date(user.derniereConnexion).toLocaleString('fr-CA')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      {user.statut}
                    </Badge>
                    <Button size="sm" variant="ghost">
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-4">
                Gérer les Permissions
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="title-md">Actions de Conformité</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <FileText className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Rapport Conformité</div>
                <div className="text-xs text-muted-foreground">PDF détaillé</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Shield className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Audit Sécurité</div>
                <div className="text-xs text-muted-foreground">Scan complet</div>
              </div>
            </Button>
            
            <Button variant="outline" className="h-20 flex flex-col gap-2">
              <Database className="h-6 w-6" />
              <div className="text-center">
                <div className="font-medium">Sauvegarde Logs</div>
                <div className="text-xs text-muted-foreground">Export sécurisé</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}