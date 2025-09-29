import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface PeriodSelectorProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export const PeriodSelector = ({ selectedPeriod, onPeriodChange }: PeriodSelectorProps) => {
  const periods = ['1h', '24h', '7d', '30d'];

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Période:</span>
          {periods.map((period) => (
            <Button
              key={period}
              variant={selectedPeriod === period ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange(period)}
            >
              {period}
            </Button>
          ))}
          <Badge variant="secondary" className="ml-auto">
            Dernière mise à jour: {new Date().toLocaleTimeString()}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};