process.env.TZ = 'UTC';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bodyParser from 'body-parser'; 
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(new ValidationPipe({ forbidUnknownValues: false }));
  // Aumentar el límite de tamaño del cuerpo de la solicitud
  app.use(bodyParser.json({ limit: '100mb' })); // Cambia '10mb' según sea necesario
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));
  // Use environment variable for the host, defaulting to 'localhost'
  const host = process.env.HOST || 'localhost';
  const port = process.env.PORT || 3002;

  await app.listen(port, host);
}
bootstrap();
