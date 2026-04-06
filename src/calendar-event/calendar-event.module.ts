import { Module } from '@nestjs/common';
import { CalendarEventService } from './calendar-event.service';
import { CalendarEventController } from './calendar-event.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { User } from '../users/user.entity';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
        TypeOrmModule.forFeature([
           User,
           CalendarEvent
        ]),
        ConfigModule, // Importa ConfigModule aquí
      ],
  controllers: [CalendarEventController],
  providers: [CalendarEventService],
})
export class CalendarEventModule {}
