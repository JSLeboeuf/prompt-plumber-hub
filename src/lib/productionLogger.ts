/**
 * Production-safe logging utility
 * Remplace les console.log/error pour la production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class ProductionLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();

    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.debug(`[${timestamp}] DEBUG:`, message, context || '');
          break;
        case 'info':
          console.info(`[${timestamp}] INFO:`, message, context || '');
          break;
        case 'warn':
          console.warn(`[${timestamp}] WARN:`, message, context || '');
          break;
        case 'error':
          console.error(`[${timestamp}] ERROR:`, message, context || '');
          break;
      }
    } else {
      // En production, log seulement les erreurs critiques
      if (level === 'error') {
        // Envoyer à un service de monitoring (Sentry, LogRocket, etc.)
        console.error(JSON.stringify({
          timestamp,
          level,
          message: message.substring(0, 200), // Limiter la taille
          environment: 'production'
        }));
      }
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext | Error): void {
    if (context instanceof Error) {
      this.log('error', message, {
        error: context.message,
        // Ne pas exposer la stack trace complète en production
        stack: this.isDevelopment ? context.stack : undefined,
      });
    } else {
      this.log('error', message, context);
    }
  }

  // Méthode pour log les erreurs sans context sensible
  errorSafe(message: string, errorCode?: string): void {
    this.log('error', message, { errorCode });
  }
}

export const prodLogger = new ProductionLogger();
export default prodLogger;