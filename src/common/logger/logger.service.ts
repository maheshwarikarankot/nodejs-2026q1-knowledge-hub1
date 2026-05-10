import { Injectable, ConsoleLogger, LogLevel } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

export interface LogContext {
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  userId?: string;
  requestId?: string;
  [key: string]: any;
}

@Injectable()
export class LoggerService extends ConsoleLogger {
  private readonly isDevelopment: boolean;
  private readonly logLevel: LogLevel;
  private readonly maxFileSize: number;
  private readonly logDir: string;
  private readonly logFilePath: string;

  constructor() {
    super('App');

    this.isDevelopment = process.env.NODE_ENV !== 'production';
    this.logLevel = this.parseLogLevel(process.env.LOG_LEVEL || 'log');
    this.maxFileSize =
      parseInt(process.env.LOG_MAX_FILE_SIZE || '1024', 10) * 1024; // Convert KB to bytes
    this.logDir = path.join(process.cwd(), 'logs');
    this.logFilePath = path.join(this.logDir, 'app.log');

    this.ensureLogDirectory();
  }

  private parseLogLevel(level: string): LogLevel {
    const validLevels: LogLevel[] = [
      'log',
      'debug',
      'warn',
      'error',
      'verbose',
    ];
    return validLevels.includes(level as LogLevel)
      ? (level as LogLevel)
      : 'log';
  }

  private ensureLogDirectory(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['error', 'warn', 'log', 'verbose', 'debug'];
    const targetIndex = levels.indexOf(this.logLevel);
    const currentIndex = levels.indexOf(level);

    return currentIndex <= targetIndex;
  }

  private rotateLogFile(): void {
    if (fs.existsSync(this.logFilePath)) {
      const stats = fs.statSync(this.logFilePath);
      if (stats.size >= this.maxFileSize) {
        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')
          .slice(0, -5); // Remove milliseconds and Z

        const rotatedFilePath = path.join(this.logDir, `app-${timestamp}.log`);

        fs.renameSync(this.logFilePath, rotatedFilePath);
      }
    }
  }

  private writeToFile(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): void {
    this.rotateLogFile();

    const logEntry = this.isDevelopment
      ? this.formatHumanReadable(level, message, context)
      : this.formatStructured(level, message, context);

    fs.appendFileSync(this.logFilePath, logEntry + '\n', 'utf8');
  }

  private formatHumanReadable(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const timestamp = new Date().toISOString();
    const levelUpper = level.toUpperCase().padEnd(7);
    const contextStr = context ? ` [${JSON.stringify(context)}]` : '';

    return `${timestamp} ${levelUpper} ${message}${contextStr}`;
  }

  private formatStructured(
    level: LogLevel,
    message: string,
    context?: LogContext,
  ): string {
    const logObject = {
      timestamp: new Date().toISOString(),
      level: level.toLowerCase(),
      message,
      ...context,
    };

    return JSON.stringify(logObject);
  }

  private sanitizeData(data: any): any {
    if (!data || typeof data !== 'object') {
      return data;
    }

    const sensitiveFields = [
      'password',
      'token',
      'authorization',
      'auth',
      'secret',
      'key',
    ];
    const sanitized = Array.isArray(data) ? [...data] : { ...data };

    for (const key in sanitized) {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = this.sanitizeData(sanitized[key]);
      }
    }

    return sanitized;
  }

  logRequest(
    method: string,
    url: string,
    body?: any,
    query?: any,
    headers?: any,
    requestId?: string,
  ): void {
    if (!this.shouldLog('log')) return;

    const sanitizedBody = this.sanitizeData(body);
    const sanitizedHeaders = this.sanitizeData(headers);

    const context: LogContext = {
      method,
      url,
      body: sanitizedBody,
      query,
      headers: sanitizedHeaders,
      requestId,
    };

    const message = `Incoming request: ${method} ${url}`;

    this.writeToFile('log', message, context);

    if (this.isDevelopment) {
      super.log(message, this.formatHumanReadable('log', '', context));
    }
  }

  logResponse(
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    requestId?: string,
  ): void {
    if (!this.shouldLog('log')) return;

    const context: LogContext = {
      method,
      url,
      statusCode,
      responseTime,
      requestId,
    };

    const message = `Outgoing response: ${method} ${url} - ${statusCode} (${responseTime}ms)`;

    this.writeToFile('log', message, context);

    if (this.isDevelopment) {
      super.log(message, this.formatHumanReadable('log', '', context));
    }
  }

  override log(message: string, context?: string | LogContext): void {
    if (!this.shouldLog('log')) return;

    const logContext = typeof context === 'string' ? { context } : context;
    this.writeToFile('log', message, logContext);
    super.log(message, typeof context === 'string' ? context : undefined);
  }

  override error(
    message: string,
    trace?: string,
    context?: string | LogContext,
  ): void {
    if (!this.shouldLog('error')) return;

    const logContext =
      typeof context === 'string' ? { context } : context || {};
    if (trace) {
      logContext.trace = trace;
    }

    this.writeToFile('error', message, logContext);
    super.error(
      message,
      trace,
      typeof context === 'string' ? context : undefined,
    );
  }

  override warn(message: string, context?: string | LogContext): void {
    if (!this.shouldLog('warn')) return;

    const logContext = typeof context === 'string' ? { context } : context;
    this.writeToFile('warn', message, logContext);
    super.warn(message, typeof context === 'string' ? context : undefined);
  }

  override debug(message: string, context?: string | LogContext): void {
    if (!this.shouldLog('debug')) return;

    const logContext = typeof context === 'string' ? { context } : context;
    this.writeToFile('debug', message, logContext);
    super.debug(message, typeof context === 'string' ? context : undefined);
  }

  override verbose(message: string, context?: string | LogContext): void {
    if (!this.shouldLog('verbose')) return;

    const logContext = typeof context === 'string' ? { context } : context;
    this.writeToFile('verbose', message, logContext);
    super.verbose(message, typeof context === 'string' ? context : undefined);
  }

  logError(error: Error, context?: LogContext): void {
    const logContext = {
      ...context,
      name: error.name,
      stack: error.stack,
    };

    this.error(error.message, error.stack, logContext);
  }
}
