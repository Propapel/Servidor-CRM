import { Module } from '@nestjs/common';
import { LicenseService } from './license.service';
import { LicenseController } from './license.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { License } from './entities/license.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, License])],
  controllers: [LicenseController],
  providers: [LicenseService],
})
export class LicenseModule {}
