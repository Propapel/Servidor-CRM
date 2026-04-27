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
  
  // Configuración de CORS mejorada para incluir tu nueva URL de Railway
  app.enableCors({
    origin: [
      'https://www.mesadeayudasaimid.org',
      'https://mesadeayudasaimid.org',
      'https://propapel.vercel.app',
      'https://servidor-crm-production.up.railway.app', // Agregamos la URL de Railway
      'http://localhost:5173',
      'http://localhost:3002',
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

/**
 * Lógica para Servidores Tradicionales / Containers (Railway)
 */
async function startServer() {
  const app = await createApp();
  
  // Railway inyecta dinámicamente la variable PORT
  const port = process.env.PORT || 3002;
  
  // IMPORTANTE: '0.0.0.0' permite conexiones externas en Railway
  const host = '0.0.0.0'; 

  await app.listen(port, host);
  console.log(`🚀 Servidor CRM ejecutándose en: http://${host}:${port}`);
}

// Arrancamos el servidor directamente
startServer();

/**
 * Handler para Vercel Serverless (Opcional, se mantiene por compatibilidad)
 */
export default async (req: Request, res: Response) => {
  const app = await createApp();
  const httpAdapter = app.getHttpAdapter();
  httpAdapter.getInstance()(req, res);
};