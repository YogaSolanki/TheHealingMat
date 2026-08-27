import { IsUUID } from 'class-validator';

export class RegisterTrialDto {
  @IsUUID()
  orientationSlotId: string;
}
