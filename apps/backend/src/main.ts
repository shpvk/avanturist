import 'reflect-metadata';
import { resolve } from 'node:path';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';

function loadRootEnv(): void {
  try {
    process.loadEnvFile(resolve(__dirname, '../../../.env'));
  } catch {
    // .env is optional: defaults below keep the app runnable.
  }
}

async function bootstrap(): Promise<void> {
  loadRootEnv();

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_ORIGIN ?? '*' });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  const port = Number(process.env.BACKEND_PORT ?? 3001);
  await app.listen(port);
  console.log(`BuildVerdict API: http://localhost:${port}/api`);
}

void bootstrap();
