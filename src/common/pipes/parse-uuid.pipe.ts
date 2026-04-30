import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

@Injectable()
export class ParseUuidPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    if (typeof value !== 'string') {
      throw new BadRequestException('ID must be a string');
    }

    if (!this.isValidUuid(value)) {
      throw new BadRequestException('Invalid UUID format');
    }

    return value;
  }

  private isValidUuid(uuid: string): boolean {
    return uuidValidate(uuid) && uuidVersion(uuid) === 4;
  }
}