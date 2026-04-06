import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { MessageService } from '../message/message.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Message } from '../message/entities/message.entity';
import { Conversation } from '../conversation/entities/conversation.entity';
import { User } from '../users/user.entity';

@Module({
   imports: [
        TypeOrmModule.forFeature([
          User,
           Message,
           Conversation
        ]),
        ConfigModule, // Importa ConfigModule aquí
      ],
  providers: [SocketGateway, MessageService],
})
export class SocketModule {}
