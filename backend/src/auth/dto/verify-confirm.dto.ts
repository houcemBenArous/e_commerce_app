import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyConfirmDto {
  @IsString()
  @IsNotEmpty()
  verificationId: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}
