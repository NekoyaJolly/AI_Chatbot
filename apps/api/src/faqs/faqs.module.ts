// apps/api/src/faqs/faqs.module.ts

import { Module } from '@nestjs/common';
import { FaqsService } from './faqs.service';
import { FaqsController } from './faqs.controller';
import { EmbeddingsService } from './embeddings.service';

@Module({
  controllers: [FaqsController],
  providers: [FaqsService, EmbeddingsService],
  exports: [FaqsService, EmbeddingsService],
})
export class FaqsModule {}
