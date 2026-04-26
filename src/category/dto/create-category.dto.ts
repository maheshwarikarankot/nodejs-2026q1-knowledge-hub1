import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Programming' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'All about programming languages and frameworks' })
  @IsString()
  @IsNotEmpty()
  description?: string;
}
