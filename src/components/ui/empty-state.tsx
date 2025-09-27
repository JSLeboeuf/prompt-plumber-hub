import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon, Users, Wrench, HelpCircle } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ""
}: EmptyStateProps) {
  return (
    <Card className={`border-dashed ${className}`}>
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
        
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
        
        {actionLabel && onAction && (
          <Button 
            onClick={onAction} 
            className="mt-6"
            variant="outline"
          >
            {actionLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// States spécialisés pour l'app
export function EmptyClients({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Users}
      title="Aucun client"
      description="Commencez par ajouter votre premier client pour gérer vos interventions."
      actionLabel="Ajouter un client"
      onAction={onAction}
    />
  );
}

export function EmptyInterventions({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={Wrench}
      title="Aucune intervention"
      description="Planifiez votre première intervention pour commencer le suivi terrain."
      actionLabel="Planifier intervention"
      onAction={onAction}
    />
  );
}

export function EmptyTickets({ onAction }: { onAction?: () => void }) {
  return (
    <EmptyState
      icon={HelpCircle}
      title="Aucun ticket"
      description="Tous vos tickets de support apparaîtront ici une fois créés."
      actionLabel="Créer un ticket"
      onAction={onAction}
    />
  );
}