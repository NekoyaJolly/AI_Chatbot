// apps/api/src/chat/dto/start-chat.dto.ts
import { IsString, IsOptional, IsIn, MinLength, MaxLength } from 'class-validator';

export class StartChatDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  tenantId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  customerId?: string;

  @IsOptional()
  @IsIn(['web', 'line', 'widget'])
  channel?: 'web' | 'line' | 'widget';
}
