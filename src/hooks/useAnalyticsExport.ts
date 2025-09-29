import { useCallback } from 'react';
import { useToast } from '@/hooks/useToast';

export function useAnalyticsExport() {
  const { info } = useToast();

  const exportToPDF = useCallback(() => {
    info("Fonctionnalité à venir", "L'export PDF sera bientôt disponible");
  }, [info]);

  const exportToExcel = useCallback(() => {
    info("Fonctionnalité à venir", "L'export Excel sera bientôt disponible");
  }, [info]);

  const exportToCSV = useCallback(() => {
    info("Fonctionnalité à venir", "L'export CSV sera bientôt disponible");
  }, [info]);

  return {
    exportToPDF,
    exportToExcel,
    exportToCSV,
  };
}