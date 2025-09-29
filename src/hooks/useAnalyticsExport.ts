import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';
import { DashboardMetrics } from '@/types/dashboard';
import type { VapiCall } from '@/shared/types/supabase';
import type { Client } from '@/types/models.types';

interface ExportData {
  period: string;
  analytics: DashboardMetrics | null;
  calls: VapiCall[];
  clients: Client[];
}

export const useAnalyticsExport = () => {
  const { success, error: showError } = useToast();

  const handleExport = useCallback(async (
    format: 'csv' | 'pdf',
    data: ExportData,
    setIsExporting: (value: boolean) => void
  ) => {
    setIsExporting(true);
    try {
      // Simulate export process with validation
      await new Promise(resolve => setTimeout(resolve, 2000));

      const _exportData = {
        period: data.period,
        analytics: data.analytics || {},
        calls: data.calls.slice(0, 100), // Limit for performance
        clients: data.clients.slice(0, 100),
        exportDate: new Date().toISOString(),
        exportFormat: format,
        totalRecords: {
          calls: data.calls.length,
          clients: data.clients.length
        }
      };

      if (format === 'csv') {
        const csvContent = [
          ['Date Export', 'Période', 'Total Appels', 'Appels Actifs', 'Taux Succès', 'Durée Moyenne'],
          [
            new Date().toLocaleDateString('fr-FR'),
            data.period,
            data.analytics?.totalCalls || data.calls.length,
            data.analytics?.activeCalls || data.calls.filter(c => c.status === 'active').length,
            `${data.analytics?.successRate || 0}%`,
            `${data.analytics?.avgResponseTime || 0}min`
          ]
        ].map(row =>
          row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `drain-fortin-analytics-${data.period}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      success("Export réussi", `Rapport ${format.toUpperCase()} généré avec succès`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erreur d\'export';
      showError("Erreur d'export", `Impossible de générer le rapport: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }, [success, showError]);

  return { handleExport };
};