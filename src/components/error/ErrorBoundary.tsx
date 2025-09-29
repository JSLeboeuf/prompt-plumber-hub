import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Bug, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ErrorHandler } from '@/lib/errors/ErrorHandler';
import { AppError } from '@/lib/errors/AppError';
import { ErrorCategory, ErrorSeverity } from '@/lib/errors/types';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  level?: 'page' | 'component' | 'feature';
  name?: string;
  onError?: (error: AppError, errorInfo: ErrorInfo) => void;
  enableRecovery?: boolean;
}

interface State {
  hasError: boolean;
  error: AppError | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private errorHandler: ErrorHandler;
  private readonly maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
    this.errorHandler = ErrorHandler.getInstance();
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    return { hasError: true };
  }

  async componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Convert to AppError for standardized handling
    const appError = new AppError({
      code: 'UNK_002',
      message: error.message,
      category: ErrorCategory.UNKNOWN,
      severity: this.getSeverityFromLevel(),
      source: this.props.name || 'ErrorBoundary',
      details: {
        componentStack: errorInfo.componentStack,
        errorBoundaryLevel: this.props.level || 'component',
        retryCount: this.state.retryCount
      },
      cause: error
    });

    // Handle error through centralized handler
    await this.errorHandler.handleError(error, {
      component: this.props.name || 'ErrorBoundary',
      operation: 'render',
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      additionalData: {
        level: this.props.level,
        componentStack: errorInfo.componentStack
      }
    }, {
      enableUserFeedback: false,
      enableRecovery: this.props.enableRecovery || false
    });

    this.setState({ error: appError, errorInfo });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(appError, errorInfo);
    }
  }

  private getSeverityFromLevel(): ErrorSeverity {
    switch (this.props.level) {
      case 'page':
        return ErrorSeverity.HIGH;
      case 'feature':
        return ErrorSeverity.MEDIUM;
      case 'component':
      default:
        return ErrorSeverity.LOW;
    }
  }

  reset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: this.state.retryCount + 1
    });
  };

  goHome = () => {
    window.location.href = '/';
  };

  reportError = () => {
    if (this.state.error) {
      // Create error report
      const report = {
        error: this.state.error.toJSON(),
        errorInfo: this.state.errorInfo,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString()
      };

      // Copy to clipboard for user to send
      navigator.clipboard.writeText(JSON.stringify(report, null, 2));

      // Could also open email client or feedback form
      const subject = encodeURIComponent(`Erreur Application: ${this.state.error.code}`);
      const body = encodeURIComponent(`Une erreur s'est produite:\n\nCode: ${this.state.error.code}\nMessage: ${this.state.error.message}\n\nLes détails techniques ont été copiés dans le presse-papiers.`);
      window.open(`mailto:contact@autoscaleai.ca?subject=${subject}&body=${body}`);
    }
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const error = this.state.error;
      const level = this.props.level || 'component';
      const canRetry = this.state.retryCount < this.maxRetries;
      const showDetailedError = process.env.NODE_ENV === 'development';

      // Component-level errors show smaller UI
      if (level === 'component') {
        return (
          <div className="border border-destructive/20 rounded-lg p-4 bg-destructive/5">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Erreur de Composant</span>
              {error && (
                <Badge variant="outline" className="text-xs">
                  {error.code}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              {error?.userMessage || 'Un composant a rencontré une erreur.'}
            </p>

            {showDetailedError && error && (
              <details className="text-xs bg-background p-2 rounded border mb-3">
                <summary className="cursor-pointer font-medium">Détails techniques</summary>
                <pre className="mt-2 text-xs overflow-auto">
                  {error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-2">
              {canRetry && (
                <Button size="sm" onClick={this.reset} className="gap-1">
                  <RefreshCw className="h-3 w-3" />
                  Réessayer
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => window.location.reload()}>
                Recharger
              </Button>
            </div>
          </div>
        );
      }

      // Page-level or feature-level errors show full-screen UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-8 w-8 text-destructive" />
              </div>
              <CardTitle className="text-destructive flex items-center justify-center gap-2">
                {level === 'page' ? 'Erreur de Page' : 'Erreur de Fonctionnalité'}
                {error && (
                  <Badge variant="destructive" className="text-xs">
                    {error.code}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <p className="text-muted-foreground">
                  {error?.userMessage || 'Une erreur inattendue s\'est produite.'}
                </p>

                {error?.severity === ErrorSeverity.HIGH && (
                  <p className="text-sm text-destructive mt-2">
                    Cette erreur nécessite une attention immédiate.
                  </p>
                )}
              </div>

              {showDetailedError && error && (
                <details className="text-left text-sm bg-destructive/5 p-3 rounded border">
                  <summary className="cursor-pointer font-medium mb-2">
                    Détails de l'erreur
                  </summary>
                  <div className="space-y-2">
                    <div>
                      <strong>Message:</strong> <code className="text-xs">{error.message}</code>
                    </div>
                    <div>
                      <strong>Source:</strong> <code className="text-xs">{error.source}</code>
                    </div>
                    <div>
                      <strong>Catégorie:</strong> <code className="text-xs">{error.category}</code>
                    </div>
                    <div>
                      <strong>ID:</strong> <code className="text-xs">{error.id}</code>
                    </div>
                    {this.state.errorInfo?.componentStack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-xs mt-1 overflow-auto max-h-32 bg-background p-2 rounded">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              <div className="flex flex-col gap-2">
                <div className="flex gap-2 justify-center">
                  {canRetry && (
                    <Button onClick={this.reset} className="gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Réessayer {this.state.retryCount > 0 && `(${this.state.retryCount}/${this.maxRetries})`}
                    </Button>
                  )}

                  <Button variant="outline" onClick={() => window.location.reload()}>
                    Recharger la page
                  </Button>
                </div>

                <div className="flex gap-2 justify-center">
                  <Button variant="ghost" onClick={this.goHome} className="gap-2">
                    <Home className="h-4 w-4" />
                    Retour à l'accueil
                  </Button>

                  <Button variant="ghost" onClick={this.reportError} className="gap-2">
                    <Bug className="h-4 w-4" />
                    Signaler l'erreur
                  </Button>
                </div>

                {this.state.retryCount >= this.maxRetries && (
                  <div className="text-center text-sm text-muted-foreground mt-4 p-3 bg-muted rounded">
                    Trop de tentatives échouées. Veuillez recharger la page ou contacter le support.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;