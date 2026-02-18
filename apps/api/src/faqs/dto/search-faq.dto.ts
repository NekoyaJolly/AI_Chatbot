// apps/api/src/faqs/dto/search-faq.dto.ts

import { IsOptional, IsString, IsInt, Min, Max, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';

export class SearchFaqDto {
  @ApiPropertyOptional({ example: '営業時間' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Transform(({ value }: { value: string }) => value === 'true')
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
