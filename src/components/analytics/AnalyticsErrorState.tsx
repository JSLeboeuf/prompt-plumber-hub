import { AlertTriangle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AnalyticsErrorStateProps {
  error: string;
  onRetry?: () => void;
  variant?: 'full' | 'card' | 'inline';
}

export const AnalyticsErrorState = ({ 
  error, 
  onRetry, 
  variant = 'full' 
}: AnalyticsErrorStateProps) => {
  const isNetworkError = error.toLowerCase().includes('network') || 
                         error.toLowerCase().includes('fetch');

  if (variant === 'inline') {
    return (
      <div className="flex items-center justify-center p-4 text-center">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Erreur de chargement</span>
          </div>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
              <RefreshCw className="h-3 w-3" />
              Réessayer
            </Button>
          )}
        </div>
      </div>
    );
  }

  if (variant === 'card') {
    return (
      <Card className="border-destructive/20">
        <CardContent className="p-6 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              {isNetworkError ? (
                <Wifi className="h-6 w-6 text-destructive" />
              ) : (
                <AlertTriangle className="h-6 w-6 text-destructive" />
              )}
            </div>
            <div className="space-y-2">
              <h3 className="font-medium text-destructive">
                {isNetworkError ? 'Problème de connexion' : 'Erreur de chargement'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {isNetworkError 
                  ? 'Vérifiez votre connexion internet et réessayez.'
                  : 'Une erreur s\'est produite lors du chargement des données.'
                }
              </p>
            </div>
            {onRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Full error state
  return (
    <div className="min-h-[400px] flex items-center justify-center">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            {isNetworkError ? (
              <Wifi className="h-8 w-8 text-destructive" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-destructive" />
            )}
          </div>
          <CardTitle className="text-destructive">
            {isNetworkError ? 'Problème de connexion' : 'Erreur Analytics'}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            {isNetworkError 
              ? 'Impossible de se connecter au serveur. Vérifiez votre connexion internet.'
              : 'Une erreur s\'est produite lors du chargement des analytics.'
            }
          </p>
          
          {process.env.NODE_ENV === 'development' && (
            <details className="text-left text-sm bg-destructive/5 p-3 rounded border">
              <summary className="cursor-pointer font-medium mb-2">Détails de l'erreur</summary>
              <code className="text-xs break-all text-destructive">
                {error}
              </code>
            </details>
          )}
          
          <div className="flex gap-2 justify-center">
            {onRetry && (
              <Button onClick={onRetry} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Réessayer
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};