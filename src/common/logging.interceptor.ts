import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { LoggerService } from './logger/logger.service';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const method = req.method;
    const url = req.url;
    const query = req.query;
    const body = req.body;
    const headers = req.headers;
    const requestId = uuidv4();
    const startTime = Date.now();

    // Add request ID to request for potential use in other parts of the application
    req.requestId = requestId;
    res.setHeader('X-Request-ID', requestId);

    // Log incoming request
    this.logger.logRequest(method, url, body, query, headers, requestId);

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const statusCode = res.statusCode;

          // Log outgoing response
          this.logger.logResponse(
            method,
            url,
            statusCode,
            responseTime,
            requestId,
          );
        },
        error: (error) => {
          const responseTime = Date.now() - startTime;
          const statusCode = res.statusCode || 500;

          // Log error response
          this.logger.logResponse(
            method,
            url,
            statusCode,
            responseTime,
            requestId,
          );

          // Log the error details
          this.logger.logError(error, {
            method,
            url,
            requestId,
            responseTime,
          });
        },
      }),
    );
  }
}
