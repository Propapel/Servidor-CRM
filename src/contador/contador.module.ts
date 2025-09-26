import { Module } from '@nestjs/common';
import { ContadorService } from './contador.service';
import { ContadorController } from './contador.controller';

@Module({
  controllers: [ContadorController],
  providers: [ContadorService],
})
export class ContadorModule {}
