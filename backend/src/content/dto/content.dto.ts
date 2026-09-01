import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateResourceDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title: string;

  @IsString()
  @MaxLength(220)
  subtitle: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  pages?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pdfUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateResourceDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  pages?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  pdfUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateArticleDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title: string;

  @IsString()
  @MaxLength(220)
  subtitle: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  readTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  body?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateArticleDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  readTime?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  body?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class CreateVideoDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug: string;

  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title: string;

  @IsString()
  @MaxLength(220)
  subtitle: string;

  @IsString()
  @MinLength(5)
  description: string;

  @IsString()
  @MaxLength(80)
  category: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  videoUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}

export class UpdateVideoDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(180)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(220)
  subtitle?: string;

  @IsOptional()
  @IsString()
  @MinLength(5)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  category?: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  duration?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  coverUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  videoUrl?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsBoolean()
  published?: boolean;
}
