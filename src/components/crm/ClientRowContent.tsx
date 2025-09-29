import { TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Phone, Mail, Eye, MapPin, Calendar } from 'lucide-react';
import { getStatusColor } from '@/utils/colors';
import { calculateClientScore, getScoreColor, getScoreLabel } from '@/utils/scoring';
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

interface ClientRowContentProps {
  client: Client;
  onViewClient: (client: Client) => void;
  onCallClient: ((phone: string) => void) | undefined;
  onEmailClient: ((email: string) => void) | undefined;
}

export const ClientRowContent = ({ client, onViewClient, onCallClient, onEmailClient }: ClientRowContentProps) => {
  const score = calculateClientScore(client);

  return (
    <>
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
              <a
                href={`tel:${client.phone}`}
                className="text-primary hover:underline caption"
                onClick={(e) => {
                  if (onCallClient) {
                    e.preventDefault();
                    onCallClient(client.phone!);
                  }
                }}
              >
                {client.phone}
              </a>
            </div>
          )}
          {client.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3 w-3" />
              <a
                href={`mailto:${client.email}`}
                className="text-primary hover:underline caption"
                onClick={(e) => {
                  if (onEmailClient) {
                    e.preventDefault();
                    onEmailClient(client.email!);
                  }
                }}
              >
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
            {getScoreLabel(score)}
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
          {client.phone && onCallClient && (
            <Button size="sm" variant="ghost" onClick={() => onCallClient(client.phone!)}>
              <Phone className="h-4 w-4" />
            </Button>
          )}
          {client.email && onEmailClient && (
            <Button size="sm" variant="ghost" onClick={() => onEmailClient(client.email!)}>
              <Mail className="h-4 w-4" />
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={() => onViewClient(client)}>
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </>
  );
};