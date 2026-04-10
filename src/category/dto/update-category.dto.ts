import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class UpdateCategoryDto {

    @ApiProperty({ example: 'Programming' })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ example: 'Updated description about programming languages and frameworks' })
    @IsString()
    @IsOptional()
    description?: string;
}