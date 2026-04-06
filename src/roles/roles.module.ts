import { Module } from '@nestjs/common';
import { RolesService } from './roles.service';
import { RolesController } from './roles.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Rol } from './rol.entity';
import { User } from '../users/user.entity';


@Module({
  imports: [ TypeOrmModule.forFeature([ Rol, User]) ],
  providers: [RolesService],
  controllers: [RolesController],
  exports: [TypeOrmModule, RolesService], // Exportamos todo lo necesario
})
export class RolesModule {}
