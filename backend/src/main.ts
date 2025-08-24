import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser = require('cookie-parser');
import { join } from 'path';
import { existsSync } from 'fs';

async function bootstrap() {
  // Debug: check env file candidates
  const envCandidates = [join(__dirname, '..', '..', '.env'), join(__dirname, '..', '.env'), '.env'];
  console.log('[ENV DEBUG] __dirname =', __dirname);
  for (const p of envCandidates) {
    console.log('[ENV DEBUG] candidate', p, 'exists:', existsSync(p));
  }
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({
    origin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
