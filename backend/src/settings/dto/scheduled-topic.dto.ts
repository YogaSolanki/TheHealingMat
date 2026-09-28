import { IsDateString, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class UpsertScheduledTopicDto {
  @IsDateString({}, { message: 'topicDate must be YYYY-MM-DD.' })
  topicDate: string;

  @IsString()
  @MinLength(1, { message: 'Topic cannot be empty.' })
  @MaxLength(200)
  topic: string;
}

export class UpdateScheduledTopicDto {
  @IsOptional()
  @IsDateString({}, { message: 'topicDate must be YYYY-MM-DD.' })
  topicDate?: string;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'Topic cannot be empty.' })
  @MaxLength(200)
  topic?: string;
}
