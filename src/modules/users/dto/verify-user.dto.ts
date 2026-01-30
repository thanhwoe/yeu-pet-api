import { IsString, Length, Matches } from 'class-validator';

export class VerifyUserDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/, { message: 'Code must be 6 digits' })
  code: string;
}
