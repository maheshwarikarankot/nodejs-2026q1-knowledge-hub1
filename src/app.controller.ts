import { Controller, Get, BadRequestException } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import {
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
} from './common/errors/custom-errors';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  // Test endpoints for error handling
  @Public()
  @Get('test/unhandled-error')
  testUnhandledError(): void {
    throw new Error('This is an unhandled error for testing');
  }

  @Public()
  @Get('test/custom-not-found')
  testCustomNotFound(): void {
    throw new NotFoundError('Resource not found for testing');
  }

  @Public()
  @Get('test/custom-validation')
  testCustomValidation(): void {
    throw new ValidationError('Invalid input data for testing');
  }

  @Public()
  @Get('test/custom-unauthorized')
  testCustomUnauthorized(): void {
    throw new UnauthorizedError('Access denied for testing');
  }

  @Public()
  @Get('test/custom-forbidden')
  testCustomForbidden(): void {
    throw new ForbiddenError('Forbidden access for testing');
  }

  @Public()
  @Get('test/nest-exception')
  testNestException(): void {
    throw new BadRequestException('This is a NestJS BadRequestException');
  }

  // Test endpoints for process error handling
  @Public()
  @Get('test/uncaught-exception')
  testUncaughtException(): void {
    // Simulate an uncaught exception by calling a non-existent method
    setTimeout(() => {
      (undefined as any).nonExistentMethod();
    }, 100);
  }

  @Public()
  @Get('test/unhandled-rejection')
  testUnhandledRejection(): void {
    // Simulate an unhandled promise rejection
    setTimeout(() => {
      Promise.reject(
        new Error('This is an unhandled promise rejection for testing'),
      );
    }, 100);
  }
}
