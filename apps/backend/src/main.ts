import 'reflect-metadata';
import { loadRootEnv } from './load-env';
import {ConfigService} from "@nestjs/config";
import cookieParser = require("cookie-parser");
import {ValidationPipe} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";

async function bootstrap(): Promise<void> {


  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  })


  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

void bootstrap();
