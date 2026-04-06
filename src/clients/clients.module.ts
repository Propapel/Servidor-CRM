import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { Client } from './entities/client.entity';
import { User } from '../users/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
   imports : [
        TypeOrmModule.forFeature([User, Client]),
      ],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
