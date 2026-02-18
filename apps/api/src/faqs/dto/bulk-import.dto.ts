// apps/api/src/faqs/dto/bulk-import.dto.ts
// W2-009: CSV 一括インポート用 DTO

import { IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateFaqDto } from './create-faq.dto';

export class BulkImportFaqDto {
  @ApiProperty({ type: [CreateFaqDto], description: 'FAQの配列 (最大500件)' })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => CreateFaqDto)
  faqs!: CreateFaqDto[];
}

export interface BulkImportResult {
  imported: number;
  failed: number;
  errors: Array<{ index: number; message: string }>;
}
