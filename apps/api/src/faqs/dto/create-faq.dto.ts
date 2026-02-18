// apps/api/src/faqs/dto/create-faq.dto.ts

import { IsString, MinLength, MaxLength, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateFaqDto {
  @ApiProperty({ example: '営業時間はいつですか？' })
  @IsString()
  @MinLength(1)
  @MaxLength(500)
  question!: string;

  @ApiProperty({ example: '当店の営業時間は月〜金 10:00〜19:00です。' })
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  answer!: string;

  @ApiPropertyOptional({ example: ['営業時間', 'アクセス'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  category?: string;
}
