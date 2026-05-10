import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class ReindexDto {
  @ApiPropertyOptional({
    default: true,
    description: 'Index only published articles (default true)',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  onlyPublished?: boolean = true;

  @ApiPropertyOptional({
    type: [String],
    description:
      'Selective list of article UUIDs to reindex (omit to reindex all)',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  articleIds?: string[];
}
