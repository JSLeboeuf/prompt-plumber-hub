import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Phone, Mail, MapPin, Eye } from "lucide-react";
import { getStatusColor } from "@/utils/colors";
import { calculateClientScore, getScoreColor, getScoreLabel } from "@/utils/scoring";
import type { ServiceHistory } from '@/types/models.types';

interface Client {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  status: string;
  service_history?: ServiceHistory[];
  tags?: string[];
}

interface ClientCardProps {
  client: Client;
  onView: (client: Client) => void;
  onCall?: (phone: string) => void;
  onEmail?: (email: string) => void;
}

export const ClientCard = ({ client, onView, onCall, onEmail }: ClientCardProps) => {
  const score = calculateClientScore(client);

  return (
    <div className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-medium">{client.name}</h3>
          {client.address && (
            <div className="caption text-muted-foreground flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {client.address}
            </div>
          )}
        </div>
        <Badge className={`border ${getStatusColor(client.status)}`}>
          {client.status}
        </Badge>
      </div>

      <div className="space-y-2 mb-3">
        {client.phone && (
          <div className="flex items-center gap-2">
            <Phone className="h-3 w-3" />
            <span className="caption">{client.phone}</span>
          </div>
        )}
        {client.email && (
          <div className="flex items-center gap-2">
            <Mail className="h-3 w-3" />
            <span className="caption">{client.email}</span>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={`text-lg font-bold ${getScoreColor(score)}`}>
            {score}%
          </span>
          <span className="caption text-muted-foreground">
            {getScoreLabel(score)}
          </span>
        </div>
        <span className="caption text-muted-foreground">
          {client.service_history?.length || 0} services
        </span>
      </div>

      {client.tags && client.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {client.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {client.tags.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{client.tags.length - 2}
            </Badge>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {client.phone && onCall && (
          <Button size="sm" variant="ghost" onClick={() => onCall(client.phone!)}>
            <Phone className="h-4 w-4" />
          </Button>
        )}
        {client.email && onEmail && (
          <Button size="sm" variant="ghost" onClick={() => onEmail(client.email!)}>
            <Mail className="h-4 w-4" />
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={() => onView(client)}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};