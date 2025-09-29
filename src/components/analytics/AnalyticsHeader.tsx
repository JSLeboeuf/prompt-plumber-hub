import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, Download, FileText } from 'lucide-react';

interface AnalyticsHeaderProps {
  isRefreshing: boolean;
  isExporting: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
  onExportPdf: () => void;
}

export const AnalyticsHeader = ({
  isRefreshing,
  isExporting,
  onRefresh,
  onExportCsv,
  onExportPdf
}: AnalyticsHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="title-xl flex items-center gap-2">
          <BarChart3 className="h-8 w-8 text-primary" />
          Analytics Métier
        </h1>
        <p className="subtitle text-muted-foreground">
          Métriques de performance et insights business en temps réel
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onRefresh}
          disabled={isRefreshing}
          aria-label="Actualiser les données"
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button
          variant="outline"
          className="flex items-center gap-2"
          onClick={onExportCsv}
          disabled={isExporting}
          aria-label="Exporter en CSV"
        >
          <Download className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
          Exporter CSV
        </Button>
        <Button
          className="flex items-center gap-2"
          onClick={onExportPdf}
          disabled={isExporting}
          aria-label="Générer rapport PDF"
        >
          <FileText className={`h-4 w-4 ${isExporting ? 'animate-pulse' : ''}`} />
          Rapport PDF
        </Button>
      </div>
    </div>
  );
};