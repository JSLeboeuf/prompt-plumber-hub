type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...context
    };

    if (this.isDevelopment) {
      switch (level) {
        case 'debug':
          console.warn(`[${timestamp}] DEBUG:`, message, context || '');
          break;
        case 'info':
          console.warn(`[${timestamp}] INFO:`, message, context || '');
          break;
        case 'warn':
          console.warn(`[${timestamp}] WARN:`, message, context || '');
          break;
        case 'error':
          console.error(`[${timestamp}] ERROR:`, message, context || '');
          break;
      }
    } else {
      // In production, send to logging service
      // This could be replaced with your preferred logging service
      if (level === 'error' || level === 'warn') {
        console.error(JSON.stringify(logEntry));
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
        stack: context.stack,
      });
    } else {
      this.log('error', message, context);
    }
  }
}

export const logger = new Logger();
export default logger;