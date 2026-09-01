import 'reflect-metadata';
import { loadRootEnv } from './load-env';
import {ConfigService} from "@nestjs/config";
import {ValidationPipe} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";

async function bootstrap(): Promise<void> {

  loadRootEnv();

  const app = await NestFactory.create(AppModule);

    const swaggerConfig = new DocumentBuilder()
        .setTitle('BuildVerdict API')
        .setDescription('API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api', app, document);

  const config = app.get(ConfigService);

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
  })

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

void bootstrap();
