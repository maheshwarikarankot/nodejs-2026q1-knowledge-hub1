import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../common/enums';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'password123' })
  @IsString()
  @IsOptional()
  oldPassword?: string;

  @ApiPropertyOptional({ example: 'newStrongPassword123' })
  @IsString()
  @IsOptional()
  newPassword?: string;

  @ApiPropertyOptional({ enum: UserRole, example: UserRole.EDITOR })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
