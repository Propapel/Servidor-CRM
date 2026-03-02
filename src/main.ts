process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*',
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
  });

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useWebSocketAdapter(new WsAdapter(app));

  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || 3002;

  await app.listen(port, host);
}
bootstrap();