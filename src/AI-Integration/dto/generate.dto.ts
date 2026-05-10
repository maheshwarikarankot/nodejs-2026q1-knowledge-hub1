import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class GenerateDto {
  @ApiProperty({
    description: 'Free-form prompt for content generation',
    example: 'Write a short description of the latest features in Node.js 20.',
    maxLength: 1000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  prompt: string;
}
