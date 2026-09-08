import 'reflect-metadata';
import { assertRequiredEnv, loadRootEnv } from './load-env';
import {ConfigService} from "@nestjs/config";
import {ValidationPipe} from "@nestjs/common";
import {NestFactory} from "@nestjs/core";
import type {NextFunction, Request, Response} from "express";
import type {NestExpressApplication} from "@nestjs/platform-express";
import {AppModule} from "./app.module";
import {AvatarStorageService} from "./user/avatar-storage.service";
import {DocumentBuilder, SwaggerModule} from "@nestjs/swagger";
import {IS_DEV_ENV} from "./libs/common/utils/is-dev.utils";
import {parseBoolean} from "./libs/common/utils/parse-boolean.utils";

function trustProxyValue(raw: string): boolean | number | string {
  if (/^\d+$/.test(raw)) {
    return Number(raw);
  }

  if (raw === 'true' || raw === 'false') {
    return parseBoolean(raw);
  }

  return raw;
}

async function bootstrap(): Promise<void> {
  loadRootEnv();
  assertRequiredEnv();

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  const config = app.get(ConfigService);

  app.disable('x-powered-by');

  const trustProxy = config.get<string>('TRUST_PROXY')?.trim();

  if (trustProxy) {
    app.set('trust proxy', trustProxyValue(trustProxy));
  }

  const swaggerEnabled = parseBoolean(
      config.get<string>('SWAGGER_ENABLED') ?? String(IS_DEV_ENV),
  );

  app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader(
        'Cross-Origin-Resource-Policy',
        req.path.startsWith('/uploads/') ? 'cross-origin' : 'same-site',
    );

    if (!IS_DEV_ENV) {
      res.setHeader(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains',
      );
    }

    if (!swaggerEnabled || !req.path.startsWith('/api')) {
      res.setHeader(
          'Content-Security-Policy',
          "default-src 'none'; frame-ancestors 'none'",
      );
    }

    next();
  });

  if (swaggerEnabled) {
    const swaggerConfig = new DocumentBuilder()
        .setTitle('BuildVerdict API')
        .setDescription('API documentation')
        .setVersion('1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api', app, document);
  }

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  app.enableCors({
    origin: config.getOrThrow<string>('ALLOWED_ORIGIN'),
  })

  app.useStaticAssets(app.get(AvatarStorageService).root, {
    prefix: '/uploads/avatars',
    maxAge: '7d',
    index: false,
    dotfiles: 'deny',
  });

  await app.listen(config.getOrThrow<number>('APPLICATION_PORT'));
}

void bootstrap();
