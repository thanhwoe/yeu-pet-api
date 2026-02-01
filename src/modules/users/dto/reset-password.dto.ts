import {
  IsNotEmpty,
  IsPhoneNumber,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';

export class RequestResetPasswordDto {
  @IsPhoneNumber('VN')
  @IsNotEmpty()
  phone: string;
}

export class ResetPasswordDto extends RequestResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}
