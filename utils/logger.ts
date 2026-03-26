
import { isProduction } from './env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  log(level: LogLevel, message: string, data?: unknown) {
    if (isProduction() && level === 'debug') return;
    
    const timestamp = new Date().toISOString();
    const prefix = `[Guynode ${level.toUpperCase()}]`;
    
    // In production, we might want to suppress info/debug to keep console clean
    // or pipe critical errors to a service (e.g. Sentry)
    
    const args = [prefix, timestamp, message];
    if (data) args.push(data);

    switch (level) {
      case 'error':
        console.error(...args);
        break;
      case 'warn':
        console.warn(...args);
        break;
      case 'info':
        console.info(...args);
        break;
      case 'debug':
        console.log(...args);
        break;
    }
  }

  info(message: string, data?: unknown) { this.log('info', message, data); }
  warn(message: string, data?: unknown) { this.log('warn', message, data); }
  error(message: string, data?: unknown) { this.log('error', message, data); }
  debug(message: string, data?: unknown) { this.log('debug', message, data); }
}

export const logger = new Logger();
