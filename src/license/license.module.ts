import { Module } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../product/entities/product.entity';
import { License } from './entities/license.entity';
import { Client } from '../clients/entities/client.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, License, Client])],
  controllers: [LicenseController],
  providers: [LicenseService],
})
export class LicenseModule {}
