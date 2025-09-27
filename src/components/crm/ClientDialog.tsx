import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Users, MapPin, Phone, Mail } from "lucide-react";
import { getStatusColor } from "@/utils/colors";
import { calculateClientScore, getScoreColor } from "@/utils/scoring";
import { useAuth } from "@/contexts/AuthContext";

interface Client {
  id: string;  
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  service_history?: any[];
  notes?: string;
}

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: Client | null;
}

export const ClientDialog = ({ open, onOpenChange, client }: ClientDialogProps) => {
  const { canAccess } = useAuth();

  if (!client) return null;

  const score = calculateClientScore(client);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Fiche Client - {client.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Informations de contact</h4>
              <div className="space-y-1 text-sm">
                {client.address && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {client.address}
                  </div>
                )}
                {client.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {client.phone}
                  </div>
                )}
                {client.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {client.email}
                  </div>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium">Score & Statut</h4>
              <div className="flex items-center gap-4">
                <Badge className={`border ${getStatusColor(client.status)}`}>
                  {client.status}
                </Badge>
                <span className={`text-lg font-bold ${getScoreColor(score)}`}>
                  {score}% 
                </span>
              </div>
            </div>
            
            {client.notes && (
              <div className="space-y-2">
                <h4 className="font-medium">Notes</h4>
                <p className="text-sm text-muted-foreground">
                  {client.notes}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <h4 className="font-medium">Historique des services</h4>
              <div className="text-sm text-muted-foreground">
                {client.service_history?.length || 0} intervention(s) enregistrée(s)
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
      </DialogContent>
    </Dialog>
  );
};