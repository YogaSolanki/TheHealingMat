import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

function parseOrigins(...values: Array<string | undefined>) {
  const origins = new Set<string>();
  for (const value of values) {
    if (!value) continue;
    for (const part of value.split(',')) {
      const origin = part.trim().replace(/\/$/, '');
      if (origin) origins.add(origin);
    }
  }
  return [...origins];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: parseOrigins(
      config.get<string>('FRONTEND_URL', 'http://localhost:3000'),
      config.get<string>('ADMIN_URL', 'http://localhost:3001'),
    ),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(config.get('PORT', 4000));
  await app.listen(port);
}

void bootstrap();
