// apps/api/src/chat/dto/send-message.dto.ts
import { IsString, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  sessionId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  tenantId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string;
}
