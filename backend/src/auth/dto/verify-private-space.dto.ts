import { IsString, MinLength } from 'class-validator';

export class VerifyPrivateSpaceDto {
  @IsString()
  @MinLength(1)
  password: string;
}
