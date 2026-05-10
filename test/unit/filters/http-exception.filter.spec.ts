import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ArgumentsHost,
  HttpException,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  UnprocessableEntityException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  HttpExceptionFilter,
  ErrorResponse,
} from '../../../src/common/filters/http-exception.filter';
import { LoggerService } from '../../../src/common/logger/logger.service';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;

  const mockRequest = {
    url: '/test-endpoint',
    method: 'GET',
    // Filter logs request metadata (user-agent, ip, requestId) — provide
    // these so the production code path doesn't crash on undefined access.
    headers: {
      'user-agent': 'vitest-mock-agent',
    },
    ip: '127.0.0.1',
    requestId: 'test-request-id',
  };

  const mockResponse = {
    status: vi.fn().mockImplementation(() => mockResponse),
    json: vi.fn(),
  };

  const createMockArgumentsHost = (): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
      getArgs: vi.fn(),
      getArgByIndex: vi.fn(),
      switchToRpc: vi.fn(),
      switchToWs: vi.fn(),
      getType: vi.fn(),
    } as any;
  };

  // Stub the LoggerService. The filter calls a custom logError() method
  // (in addition to the standard NestJS LoggerService methods), so include
  // both so any code path inside catch() resolves to a no-op.
  const loggerServiceMock = {
    logError: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    log: vi.fn(),
    debug: vi.fn(),
    verbose: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HttpExceptionFilter,
        {
          provide: LoggerService,
          useValue: loggerServiceMock,
        },
      ],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Reset mocks
    vi.clearAllMocks();
    mockResponse.status.mockImplementation(() => mockResponse);
  });

  describe('catch', () => {
    it('should handle BadRequestException with correct status and error shape', () => {
      const exception = new BadRequestException('Invalid input data');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.BAD_REQUEST,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          method: 'GET',
          message: 'Invalid input data',
          error: 'Bad Request',
        }),
      );
    });

    it('should handle UnauthorizedException with correct status and error shape', () => {
      const exception = new UnauthorizedException('Token is missing');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNAUTHORIZED,
          timestamp: expect.any(String),
          path: '/test-endpoint',
          method: 'GET',
          message: 'Token is missing',
          error: 'Unauthorized',
        }),
      );
    });

    it('should handle ForbiddenException with correct status and error shape', () => {
      const exception = new ForbiddenException('Access denied');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Access denied',
          error: 'Forbidden',
        }),
      );
    });

    it('should handle NotFoundException with correct status and error shape', () => {
      const exception = new NotFoundException('Resource not found');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.NOT_FOUND,
          message: 'Resource not found',
          error: 'Not Found',
        }),
      );
    });

    it('should handle ConflictException with correct status and error shape', () => {
      const exception = new ConflictException('Resource already exists');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.CONFLICT);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.CONFLICT,
          message: 'Resource already exists',
          error: 'Conflict',
        }),
      );
    });

    it('should handle UnprocessableEntityException with correct status and error shape', () => {
      const exception = new UnprocessableEntityException('Validation failed');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
          message: 'Validation failed',
          error: 'Unprocessable Entity',
        }),
      );
    });

    it('should handle InternalServerErrorException with correct status and error shape', () => {
      const exception = new InternalServerErrorException('Server error');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Server error',
          error: 'Internal Server Error',
        }),
      );
    });

    it('should handle custom HttpException with unknown status code', () => {
      const customStatus = 418; // I'm a teapot
      const exception = new HttpException('Custom error', customStatus);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.status).toHaveBeenCalledWith(customStatus);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: customStatus,
          message: 'Custom error',
          error: 'Unknown Error',
        }),
      );
    });

    it('should handle exception with object response containing message', () => {
      const exceptionResponse = {
        message: 'Validation error',
        details: ['Field is required'],
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Validation error',
        }),
      );
    });

    it('should handle exception with object response without message', () => {
      const exceptionResponse = {
        error: 'Invalid data',
        details: ['Field is required'],
      };
      const exception = new HttpException(exceptionResponse, HttpStatus.BAD_REQUEST);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: exceptionResponse,
        }),
      );
    });

    it('should include correct timestamp format', () => {
      const exception = new BadRequestException('Test error');
      const host = createMockArgumentsHost();
      const before = new Date().getTime();

      filter.catch(exception, host);

      const callArgs = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      const timestamp = new Date(callArgs.timestamp).getTime();
      const after = new Date().getTime();

      expect(timestamp).toBeGreaterThanOrEqual(before);
      expect(timestamp).toBeLessThanOrEqual(after);
      expect(callArgs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should include correct request information', () => {
      mockRequest.url = '/api/users/123';
      mockRequest.method = 'POST';

      const exception = new NotFoundException('User not found');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          path: '/api/users/123',
          method: 'POST',
        }),
      );
    });

    it('should handle array of validation errors', () => {
      const validationErrors = [
        'email must be a valid email',
        'password must be at least 8 characters',
      ];
      const exception = new BadRequestException(validationErrors);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: validationErrors,
        }),
      );
    });

    it('should not include error field for 200-level status codes', () => {
      // Create a custom exception that somehow has a 2xx status code
      const exception = new HttpException('Success message', 201);
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      const callArgs = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      expect(callArgs.error).toBeUndefined();
    });

    it('should handle multiple request methods correctly', () => {
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      const exception = new BadRequestException('Test error');

      methods.forEach((method) => {
        mockRequest.method = method;
        const host = createMockArgumentsHost();

        filter.catch(exception, host);

        expect(mockResponse.json).toHaveBeenCalledWith(
          expect.objectContaining({
            method: method,
          }),
        );
      });
    });

    it('should maintain error response structure consistency', () => {
      const exception = new BadRequestException('Test error');
      const host = createMockArgumentsHost();

      filter.catch(exception, host);

      const callArgs = mockResponse.json.mock.calls[0][0] as ErrorResponse;
      
      // Verify all required fields are present
      expect(callArgs).toHaveProperty('statusCode');
      expect(callArgs).toHaveProperty('timestamp');
      expect(callArgs).toHaveProperty('path');
      expect(callArgs).toHaveProperty('method');
      expect(callArgs).toHaveProperty('message');
      expect(callArgs).toHaveProperty('error');

      // Verify types
      expect(typeof callArgs.statusCode).toBe('number');
      expect(typeof callArgs.timestamp).toBe('string');
      expect(typeof callArgs.path).toBe('string');
      expect(typeof callArgs.method).toBe('string');
      expect(typeof callArgs.error).toBe('string');
    });
  });
});