import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class SignUpDto {

    @ApiProperty({ example: 'john_doe' })
    @IsString()
    @IsNotEmpty()
    login: string;

    @ApiProperty({ example: 'strongPassword123' })
    @IsString()
    @IsNotEmpty()
    password: string;
}