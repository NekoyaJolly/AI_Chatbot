// apps/api/src/auth/dto/register.dto.ts

import { IsEmail, IsString, MinLength, MaxLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: '田中 太郎' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name!: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;

  @ApiPropertyOptional({ example: 'My Pet Shop' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  tenantName?: string;

  @ApiPropertyOptional({ example: 'pet_shop' })
  @IsOptional()
  @IsString()
  industry?: string;
}
