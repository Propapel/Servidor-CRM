import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageController } from './message.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Conversation } from '../conversation/entities/conversation.entity';
import { ConversationService } from '../conversation/conversation.service';
import { User } from '../users/user.entity';
import { Message } from './entities/message.entity';

@Module({
   imports: [
        TypeOrmModule.forFeature([
           Conversation,
           User,
           Message
        ]),
        ConfigModule, // Importa ConfigModule aquí
      ],
  controllers: [MessageController],
  providers: [MessageService],
})
export class MessageModule {}
