import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../logger/logger.service';
import { NotFoundError, ValidationError, UnauthorizedError, ForbiddenError } from '../errors/custom-errors';

export interface ErrorResponse {
  statusCode: number;
  error?: string; // omitted for 2xx responses
  message: string | object;
  timestamp?: string;
  path?: string;
  method?: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: LoggerService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    let status: number;
    let message: string | object;
    
    // Handle custom error classes
    if (this.isCustomError(exception)) {
      status = exception.statusCode;
      message = exception.message;
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = this.getErrorMessage(exceptionResponse);
    }
    // Handle unknown errors
    else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'An unexpected error occurred';
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      // Only include the error label for actual error responses (4xx/5xx).
      // A 2xx with an "error" field would be self-contradictory.
      ...(status >= 400 ? { error: this.getErrorName(status) } : {}),
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
    };

    // Log the error with full context
    const logContext = {
      method: request.method,
      url: request.url,
      statusCode: status,
      requestId: (request as any).requestId,
      userAgent: request.headers['user-agent'],
      ip: request.ip,
    };

    this.logger.logError(exception, logContext);

    response.status(status).json(errorResponse);
  }

  private isCustomError(exception: any): boolean {
    return exception instanceof NotFoundError ||
           exception instanceof ValidationError ||
           exception instanceof UnauthorizedError ||
           exception instanceof ForbiddenError;
  }

  private getErrorMessage(exceptionResponse: any): string | object {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (typeof exceptionResponse === 'object' && exceptionResponse.message) {
      return exceptionResponse.message;
    }

    return exceptionResponse;
  }

  private getErrorName(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return 'Bad Request';
      case HttpStatus.UNAUTHORIZED:
        return 'Unauthorized';
      case HttpStatus.FORBIDDEN:
        return 'Forbidden';
      case HttpStatus.NOT_FOUND:
        return 'Not Found';
      case HttpStatus.CONFLICT:
        return 'Conflict';
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'Unprocessable Entity';
      case HttpStatus.INTERNAL_SERVER_ERROR:
        return 'Internal Server Error';
      default:
        return 'Unknown Error';
    }
  }
}