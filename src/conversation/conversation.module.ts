import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ConversationController } from './conversation.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from '../message/entities/message.entity';
import { ConfigModule } from '@nestjs/config';
import { User } from '../users/user.entity';
import { Customer } from '../customers/entity/customer.entity';
import { Conversation } from './entities/conversation.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';

@Module({
   imports: [
      TypeOrmModule.forFeature([
         Message,
         User,
         Conversation,
         Customer,
         CalendarEvent
      ]),
      ConfigModule, // Importa ConfigModule aquí
    ],
  controllers: [ConversationController],
  providers: [ConversationService],
})
export class ConversationModule {

}
