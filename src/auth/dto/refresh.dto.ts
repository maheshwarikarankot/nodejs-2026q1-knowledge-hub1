import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class RefreshDto {

    @ApiProperty({ example: 'refreshToken123' })
    @IsString()
    @IsOptional()
    refreshToken?: string;
}