import { ApiProperty } from '@nestjs/swagger';

export class GenerateResponseDto {
  @ApiProperty()
  result: string;
}
