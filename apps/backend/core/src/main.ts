import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global API prefix
  app.setGlobalPrefix('api/v1');

  // CORS configuration - allow credentials for cookies
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = isProduction ? [] : ['http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type,Authorization,X-Total-Count,Range,X-Service-Key',
    exposedHeaders: 'Content-Range,X-Total-Count',
  });
  const port = process.env.PORT || 3000;
  await app.listen(port);
}
void bootstrap();
