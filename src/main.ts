import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { WsAdapter } from '@nestjs/platform-ws';
import * as bodyParser from 'body-parser';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';

// Crear una instancia de express fuera para exportarla
const server = express();

async function bootstrap() {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(server), // Usamos el adaptador de express
  );

  app.enableCors({
    origin: [
      'https://www.mesadeayudasaimid.org',
      'https://mesadeayudasaimid.org',
      'https://propapel.vercel.app'
    ],
    methods: 'GET,POST,PUT,DELETE,PATCH,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization, x-api-key',
  });

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  app.useWebSocketAdapter(new WsAdapter(app));

  // Solo hacemos listen si NO estamos en Vercel
  if (process.env.NODE_ENV !== 'production') {
    const port = process.env.PORT || 3002;
    await app.listen(port);
  }
  
  await app.init();
}

bootstrap();

// ESTA ES LA CLAVE PARA VERCEL:
export default server;