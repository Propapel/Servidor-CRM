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
  
  // CORS: Permitimos todo en producción para evitar bloqueos de Sockets
  app.enableCors({
    origin: [
      'https://www.mesadeayudasaimid.org',
      'https://mesadeayudasaimid.org',
      'https://propapel.vercel.app',
      'https://servidor-crm-production.up.railway.app',
      'http://localhost:5173',
      'http://localhost:3002',
    ],
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  
  // IMPORTANTE: El adaptador de WebSocket debe estar aquí
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.init();
  cachedApp = app;
  return app;
}

/**
 * Lógica para Railway (Container Long-running)
 */
async function startServer() {
  const app = await createApp();
  const port = process.env.PORT || 3002;
  const host = '0.0.0.0'; 

  await app.listen(port, host);
  console.log(`🚀 Servidor CRM y WebSockets corriendo en puerto: ${port}`);
}

startServer();

/**
 * Handler para Vercel (Serverless)
 */
export default async (req: Request, res: Response) => {
  const app = await createApp();
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance()(req, res);
};