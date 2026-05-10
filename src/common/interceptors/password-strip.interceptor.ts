import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PasswordStripInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(map((data) => this.removePassword(data)));
  }

  private removePassword(data: any): any {
    if (!data) {
      return data;
    }

    // Handle arrays
    if (Array.isArray(data)) {
      return data.map((item) => this.removePassword(item));
    }

    // Handle objects
    if (typeof data === 'object') {
      const result = { ...data };

      // Remove password field if it exists
      if (result.hasOwnProperty('password')) {
        delete result.password;
      }

      // Recursively process nested objects
      for (const key in result) {
        if (result.hasOwnProperty(key)) {
          result[key] = this.removePassword(result[key]);
        }
      }

      return result;
    }

    // Return primitive values unchanged
    return data;
  }
}
