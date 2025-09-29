import { useState, DragEvent } from 'react';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { ClientRowContent } from "./ClientRowContent";
import { cn } from "@/lib/utils";
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

interface DraggableClientTableProps {
  clients: Client[];
  onViewClient: (client: Client) => void;
  onCallClient?: (phone: string) => void;
  onEmailClient?: (email: string) => void;
  onReorder?: (clients: Client[]) => void;
}

export const DraggableClientTable = ({
  clients: initialClients,
  onViewClient,
  onCallClient,
  onEmailClient,
  onReorder
}: DraggableClientTableProps) => {
  const [clients, setClients] = useState(initialClients);
  const [draggedItem, setDraggedItem] = useState<Client | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: DragEvent<HTMLTableRowElement>, client: Client) => {
    setDraggedItem(client);
    e.dataTransfer.effectAllowed = 'move';
    // Add visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: DragEvent<HTMLTableRowElement>) => {
    // Reset visual feedback
    if (e.currentTarget) {
      e.currentTarget.style.opacity = '1';
    }
    setDraggedItem(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e: DragEvent<HTMLTableRowElement>, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: DragEvent<HTMLTableRowElement>, dropIndex: number) => {
    e.preventDefault();

    if (!draggedItem) return;

    const draggedIndex = clients.findIndex(c => c.id === draggedItem.id);

    if (draggedIndex === dropIndex) {
      setDragOverIndex(null);
      return;
    }

    const newClients = [...clients];
    // Remove dragged item
    newClients.splice(draggedIndex, 1);
    // Insert at new position
    newClients.splice(dropIndex, 0, draggedItem);

    setClients(newClients);
    setDragOverIndex(null);

    // Notify parent of reorder
    if (onReorder) {
      onReorder(newClients);
    }
  };

  // Update clients when props change
  if (initialClients !== clients && initialClients.length !== clients.length) {
    setClients(initialClients);
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10"></TableHead>
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
          {clients.map((client, index) => (
            <TableRow
              key={client.id}
              draggable
              onDragStart={(e) => handleDragStart(e, client)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              className={cn(
                "cursor-move transition-all",
                dragOverIndex === index && "bg-muted/50 border-t-2 border-primary",
                draggedItem?.id === client.id && "opacity-50"
              )}
            >
              <td className="text-center text-muted-foreground">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                  className="inline-block"
                >
                  <path d="M5 3a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2zm6-10a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2zm0 5a1 1 0 110-2 1 1 0 010 2z"/>
                </svg>
              </td>
              <ClientRowContent
                client={client}
                onViewClient={onViewClient}
                onCallClient={onCallClient}
                onEmailClient={onEmailClient}
              />
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {clients.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          Aucun client trouvé
        </div>
      )}
    </div>
  );
};