import { ApiProperty } from '@nestjs/swagger';

export class CategoryResponseDto {
  @ApiProperty({ example: '11111111-1111-1111-1111-111111111111' })
  id: string;

  @ApiProperty({ example: 'Programming' })
  name: string;

  @ApiProperty({ example: 'All about programming languages and frameworks' })
  description: string;
}
