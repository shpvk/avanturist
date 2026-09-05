import 'reflect-metadata';
import { loadRootEnv } from './load-env';
import {ConfigService} from "@nestjs/config";
import cookieParser = require("cookie-parser");
import {ValidationPipe} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import {AppModule} from "./app.module";

import IORedis from 'ioredis'
import session from "express-session";
import {ms, StringValue} from "./libs/common/utils/ms.util";
import {parseBoolean} from "./libs/common/utils/parse-boolean.utils";
import {RedisStore} from "connect-redis";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";



async function bootstrap(): Promise<void> {


  const app = await NestFactory.create(AppModule);

    // Every controller answers under /api; the docs move aside to keep that prefix free.
    app.setGlobalPrefix('api');

    const swaggerConfig = new DocumentBuilder()
        .setTitle('BuildVerdict API')
        .setDescription('API documentation')
        .setVersion('1.0')
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('docs', app, document);

  const config = app.get(ConfigService);
  const redis = new IORedis(config.getOrThrow<string>('REDIS_URI'));

  app.use(cookieParser(config.getOrThrow<string>('COOKIES_SECRET')));

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
  }));

  app.use(
      session({
        secret: config.getOrThrow<string>('SESSION_SECRET'),
        name: config.getOrThrow<string>('SESSION_NAME'),
        resave: true,
        saveUninitialized: false,
        cookie: {
          domain: config.getOrThrow<string>('SESSION_DOMAIN'),
          maxAge: ms(config.getOrThrow<StringValue>('SESSION_MAX_AGE')),
          httpOnly: parseBoolean(
              config.getOrThrow<string>('SESSION_HTTP_ONLY')
          ),
          secure: parseBoolean(
              config.getOrThrow<string>('SESSION_SECURE')
          ),
          sameSite: 'lax'
        },
          store: new RedisStore({
              client: redis,
              prefix: config.getOrThrow('SESSION_FOLDER')
          }),
      })
  )

  app.enableCors({
    // ALLOWED_ORIGIN takes a comma-separated list: the dev server does not always land
    // on the same port as the one the deployment uses.
    origin: config
        .getOrThrow<string>('ALLOWED_ORIGIN')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    credentials: true,
    exposedHeaders: ['set-cookie'],
  })


  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

void bootstrap();
