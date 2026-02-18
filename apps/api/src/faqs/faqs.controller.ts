// apps/api/src/faqs/faqs.controller.ts
// W2-005: FAQ CRUD コントローラー

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FaqsService } from './faqs.service';
import { CreateFaqDto } from './dto/create-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { SearchFaqDto } from './dto/search-faq.dto';
import { BulkImportFaqDto } from './dto/bulk-import.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { CurrentUser as ICurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('faqs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('faqs')
export class FaqsController {
  constructor(private readonly faqsService: FaqsService) {}

  @Post()
  @ApiOperation({ summary: 'FAQ 作成' })
  @ApiResponse({ status: 201, description: 'FAQ 作成成功' })
  create(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: CreateFaqDto,
  ) {
    const tenantId = user.tenantId!;
    return this.faqsService.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'FAQ 一覧取得' })
  @ApiResponse({ status: 200, description: 'FAQ 一覧' })
  findAll(
    @CurrentUser() user: ICurrentUser,
    @Query() query: SearchFaqDto,
  ) {
    return this.faqsService.findAll(user.tenantId!, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'FAQ 1件取得' })
  @ApiResponse({ status: 200, description: 'FAQ 詳細' })
  @ApiResponse({ status: 404, description: '見つかりません' })
  findOne(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ) {
    return this.faqsService.findOne(user.tenantId!, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'FAQ 更新' })
  @ApiResponse({ status: 200, description: 'FAQ 更新成功' })
  update(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
    @Body() dto: UpdateFaqDto,
  ) {
    return this.faqsService.update(user.tenantId!, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'FAQ 削除' })
  @ApiResponse({ status: 200, description: 'FAQ 削除成功' })
  remove(
    @CurrentUser() user: ICurrentUser,
    @Param('id') id: string,
  ) {
    return this.faqsService.remove(user.tenantId!, id);
  }

  @Post('bulk-import')
  @ApiOperation({ summary: 'FAQ 一括インポート (CSV パース済みデータ)' })
  @ApiResponse({ status: 201, description: '一括インポート結果' })
  bulkImport(
    @CurrentUser() user: ICurrentUser,
    @Body() dto: BulkImportFaqDto,
  ) {
    return this.faqsService.bulkImport(user.tenantId!, dto);
  }

  @Get('search/vector')
  @ApiOperation({ summary: 'FAQ ベクトル類似度検索' })
  @ApiResponse({ status: 200, description: '検索結果' })
  vectorSearch(
    @CurrentUser() user: ICurrentUser,
    @Query('q') query: string,
    @Query('limit') limit?: number,
  ) {
    return this.faqsService.vectorSearch(user.tenantId!, query, limit);
  }
}
