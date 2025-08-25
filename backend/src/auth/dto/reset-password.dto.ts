import { IsMongoId, IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsMongoId()
  @IsNotEmpty()
  resetId!: string;

  @IsNotEmpty()
  token!: string;

  @IsNotEmpty()
  @MinLength(8)
  password!: string;
}
