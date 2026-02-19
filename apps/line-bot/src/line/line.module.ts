// apps/line-bot/src/line/line.module.ts
// LINE Bot モジュール

import { Module } from '@nestjs/common';
import { LineController } from './line.controller';
import { LineService } from './line.service';
import { RichMenuService } from './rich-menu.service';

@Module({
  controllers: [LineController],
  providers: [LineService, RichMenuService],
  exports: [LineService, RichMenuService],
})
export class LineModule {}
