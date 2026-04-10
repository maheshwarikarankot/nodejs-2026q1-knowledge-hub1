import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdatePasswordDto {
  
  @ApiProperty({ example: 'password123' })  
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({ example: 'secret123' })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}