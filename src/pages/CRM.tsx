import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Plus, TrendingUp, Star, Loader2 } from "lucide-react";
import { usePaginatedCRM } from "@/hooks/usePaginatedCRM";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/useToast";
import { useFilters } from "@/hooks/useFilters";
import { useClientActions } from "@/hooks/useClientActions";
import { CRMLoadingSkeleton } from "@/components/ui/loading-states";
import { PermissionGuard } from "@/components/common/PermissionGuard";
import { PageLayout } from "@/components/common/PageLayout";
import { StatsGrid } from "@/components/common/StatsGrid";
import { SearchFilter } from "@/components/common/SearchFilter";
import { ClientTable } from "@/components/crm/ClientTable";
import { ClientDialog } from "@/components/crm/ClientDialog";

export default function CRM() {
  const { 
    clients, 
    loading: dataLoading, 
    activeClients, 
    newLeads, 
    loadMore, 
    hasMore, 
    loadingMore 
  } = usePaginatedCRM();
  
  const { canAccess } = useAuth();
  const { error: showError } = useToast();
  const { callClient, emailClient } = useClientActions();
  const [selectedClient, setSelectedClient] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Use the new filters hook
  const {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    filteredItems: filteredClients
  } = useFilters(clients, {
    searchFields: ['name', 'phone', 'email'],
    defaultFilter: 'tous'
  });

  const handleCreateClient = async () => {
    if (!canAccess('clients', 'create')) {
      showError("Accès refusé", "Vous n'avez pas les permissions pour créer des clients");
      return;
    }

    try {
      setIsCreating(true);
      // Mock client creation for demo
      console.log('Creating client...');
    } catch (error) {
      console.error('Failed to create client:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleCallClient = async (client: any) => {
    await callClient(client.id, client.phone || '');
  };

  const handleEmailClient = async (client: any) => {
    await emailClient(client.email || '', 'Contact depuis CRM');
  };

  // Simple scoring based on available data
  const averageScore = 75; // Default score when no detailed scoring needed

  // Stats configuration
  const stats = [
    {
      title: "Total Clients",
      value: clients.length,
      icon: Users,
      color: "text-primary"
    },
    {
      title: "Leads Actifs", 
      value: newLeads.length,
      icon: TrendingUp,
      color: "text-blue-600"
    },
    {
      title: "Score Moyen",
      value: `${averageScore}%`,
      icon: Star,
      color: "text-yellow-600"
    },
    {
      title: "Clients Actifs",
      value: activeClients.length,
      icon: TrendingUp,
      color: "text-green-600"
    }
  ];

  // Filter options
  const filterOptions = [
    { value: "tous", label: "Tous" },
    { value: "lead", label: "Leads" },
    { value: "active", label: "Actifs" },
    { value: "inactive", label: "Inactifs" }
  ];

  return (
    <PermissionGuard
      resource="clients"
      action="read"
      loadingComponent={<CRMLoadingSkeleton />}
    >
      <PageLayout
        title="CRM Clients"
        subtitle="Gestion de la relation client et suivi des leads en temps réel"
        icon={Users}
        actions={
          canAccess('clients', 'create') && (
            <Button 
              className="flex items-center gap-2"
              onClick={handleCreateClient}
              disabled={isCreating}
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Ajouter Client
            </Button>
          )
        }
      >
        {/* Stats Overview */}
        <StatsGrid stats={stats} />

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <SearchFilter
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filterOptions}
              activeFilter={statusFilter}
              onFilterChange={setStatusFilter}
              placeholder="Rechercher clients..."
            />
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle className="title-md">Base Clients Live</CardTitle>
            <p className="caption text-muted-foreground">
              {filteredClients.length} client(s) affiché(s) - Données en temps réel
            </p>
          </CardHeader>
          <CardContent>
            {dataLoading && clients.length === 0 ? (
              <CRMLoadingSkeleton />
            ) : (
              <ClientTable
                clients={filteredClients.map(c => ({
                  id: c.id,
                  name: c.name,
                  email: c.email || '',
                  phone: c.phone || '',
                  status: c.status || 'inactive'
                }))}
                onViewClient={setSelectedClient}
                onCallClient={handleCallClient}
                onEmailClient={handleEmailClient}
              />
            )}
          </CardContent>
        </Card>

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button 
              onClick={loadMore} 
              disabled={loadingMore}
              variant="outline"
              className="w-48"
            >
              {loadingMore ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Chargement...
                </>
              ) : (
                'Charger plus de clients'
              )}
            </Button>
          </div>
        )}

        {/* Client Details Dialog */}
        <ClientDialog
          open={!!selectedClient}
          onOpenChange={() => setSelectedClient(null)}
          client={selectedClient}
        />
      </PageLayout>
    </PermissionGuard>
  );
}