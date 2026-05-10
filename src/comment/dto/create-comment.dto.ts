import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ example: 'Great article!' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ example: 'uuid of author' })
  @IsOptional()
  @IsUUID()
  authorId?: string;

  @ApiProperty({ example: 'uuid of article' })
  @IsUUID()
  articleId: string;
}
