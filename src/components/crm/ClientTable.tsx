import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ClientRow } from "./ClientRow";
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

interface ClientTableProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onCallClient?: (phone: string) => void;
  onEmailClient?: (email: string) => void;
}

export const ClientTable = ({ 
  clients, 
  onViewClient, 
  onCallClient, 
  onEmailClient 
}: ClientTableProps) => {
  return (
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
        {clients.map((client) => (
          <ClientRow
            key={client.id}
            client={client}
            onViewClient={onViewClient}
            onCallClient={onCallClient}
            onEmailClient={onEmailClient}
          />
        ))}
      </TableBody>
    </Table>
  );
};