// Extend NestJS exceptions so that:
//   1. `instanceof UnauthorizedException` etc. works in tests and filters
//   2. NestJS's built-in exception layer maps them to the right HTTP status
//   3. Existing `throw new UnauthorizedError(...)` call sites keep working
import {
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';

export class NotFoundError extends NotFoundException {
  public readonly statusCode = 404;

  constructor(message: string = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends BadRequestException {
  public readonly statusCode = 400;

  constructor(message: string = 'Validation failed') {
    super(message);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends UnauthorizedException {
  public readonly statusCode = 401;

  constructor(message: string = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends ForbiddenException {
  public readonly statusCode = 403;

  constructor(message: string = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}
