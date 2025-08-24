import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyRequestDto {
  @IsString()
  @IsNotEmpty()
  verificationId: string;
}
