process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as bodyParser from 'body-parser';
import { INestApplication } from '@nestjs/common';
import { Request, Response } from 'express';

let cachedApp: INestApplication;

async function createApp(): Promise<INestApplication> {
  if (cachedApp) return cachedApp;

  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: [
      'https://www.mesadeayudasaimid.org',
      'https://mesadeayudasaimid.org',
      'https://propapel.vercel.app',
      'http://localhost:5173',
      'http://localhost:3002',
      'http://[IP_ADDRESS]',
    ],
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
  });

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.init();
  cachedApp = app;
  return app;
}

// Vercel serverless handler (default export required)
export default async (req: Request, res: Response) => {
  const app = await createApp();
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance()(req, res);
};

// Local development
if (process.env.NODE_ENV !== 'production') {
  (async () => {
    const app = await createApp();
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || 3002;
    await app.listen(port, host);
    console.log(`Application running on http://${host}:${port}`);
  })();
}