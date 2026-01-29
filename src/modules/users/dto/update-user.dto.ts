import { subscription_tier, user_role } from '@app/generated/prisma/client';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class UpdateUserDto {
  @IsUUID()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsOptional()
  avatar_url: string;

  @IsEmail()
  @IsOptional()
  email: string;

  @IsString()
  @IsOptional()
  first_name: string;

  @IsString()
  @IsOptional()
  last_name: string;

  @IsBoolean()
  @IsOptional()
  is_active: boolean;

  @IsDate()
  @IsOptional()
  last_sign_in_at: Date;

  @IsBoolean()
  @IsOptional()
  onboarding_completed: boolean;

  @IsIn(['user', 'admin'])
  @IsOptional()
  role: user_role;

  @IsIn(['free', 'premium'])
  @IsOptional()
  subscription: subscription_tier;

  @IsDate()
  @IsOptional()
  subscription_expires_at: Date;

  @IsDate()
  updated_at: Date;
}
