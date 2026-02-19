// apps/api/src/ai/ai.module.ts

import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { FaqsModule } from '../faqs/faqs.module';

@Module({
  imports: [FaqsModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
