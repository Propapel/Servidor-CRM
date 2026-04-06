import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { CalendarEvent } from './entities/calendar-event.entity';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import { ProspectingReason } from './enum/prospecting_reason';
import { CalendarEventStatus } from './enum/calendar_event_status';
import { number } from 'joi';

@Injectable()
export class CalendarEventService {
  constructor(
    @InjectRepository(CalendarEvent)
    private calendarEventRepository: Repository<CalendarEvent>,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  async create(createCalendarEventDto: CreateCalendarEventDto) {
    const userCreateEvent = await this.userRepository.findOne({
      where: { id: createCalendarEventDto.createByUser },
      relations: [
         'sucursales',
      ]
    });

    if (!userCreateEvent) {
      throw new Error('User who is creating the event not found');
    }

    const participants: User[] = [];

    if (
      createCalendarEventDto.participants &&
      createCalendarEventDto.participants.length > 0
    ) {
      for (const participantId of createCalendarEventDto.participants) {
        const user = await this.userRepository.findOne({
          where: { id: participantId },
        });
        if (user) {
          participants.push(user);
        }
      }
    }

    //createActivityDto.startDate ? new Date(createActivityDto.startDate) : null
    const newEvent = this.calendarEventRepository.create({
      title: createCalendarEventDto.title,
      description: createCalendarEventDto.description,
      status: createCalendarEventDto.status as CalendarEventStatus,
      prospectingReason:
        createCalendarEventDto.prospeccionReason as ProspectingReason,
      activityDate: createCalendarEventDto.activityDate
        ? new Date(createCalendarEventDto.activityDate)
        : null,
      startTime: createCalendarEventDto.startTime
        ? new Date(createCalendarEventDto.startTime)
        : null,
      endTime: createCalendarEventDto.endTime
        ? new Date(createCalendarEventDto.endTime)
        : null,
      location: createCalendarEventDto.location,
      notes: createCalendarEventDto.notes,
      createdBy: userCreateEvent, // este también estaba mal escrito antes como createByUser
      participants: participants,
      sucursal: userCreateEvent.sucursales[0]
    });

    return await this.calendarEventRepository.save(newEvent);
  }

  async findAll() {
    return await this.calendarEventRepository.find({
      where: {
         isDelete: false 
      },
      relations: ['createdBy', 'participants', 'reminders'],
      order: {
        activityDate: 'DESC',
        startTime: 'DESC',
      },
    });
  }

   async findByCreator(id:number) {
    return await this.calendarEventRepository.find({
      where: {
         isDelete: false ,
         createdBy: {
          id : id
         }
      },
      relations: ['createdBy', 'participants'],
      order: {
        activityDate: 'DESC',
        startTime: 'DESC',
      },
    });
  }

  async update(id: number, updateDto: UpdateCalendarEventDto) {
    const event = await this.calendarEventRepository.findOne({
      where: { id },
      relations: ['participants', 'createdBy'],
    });

    if (!event) {
      throw new Error(`CalendarEvent with id ${id} not found`);
    }

    // Actualizar campos directos si están presentes
    if (updateDto.title !== undefined) event.title = updateDto.title;
    if (updateDto.description !== undefined)
      event.description = updateDto.description;
    if (updateDto.status !== undefined)
      event.status = updateDto.status as CalendarEventStatus;
    if (updateDto.prospeccionReason !== undefined)
      event.prospectingReason =
        updateDto.prospeccionReason as ProspectingReason;
    if (updateDto.activityDate !== undefined)
      event.activityDate = new Date(updateDto.activityDate);
    if (updateDto.startTime !== undefined)
      event.startTime = new Date(updateDto.startTime);
    if (updateDto.endTime !== undefined)
      event.endTime = new Date(updateDto.endTime);
    if (updateDto.location !== undefined) event.location = updateDto.location;
    if (updateDto.notes !== undefined) event.notes = updateDto.notes;
    event.updatedAt = new Date();

    // Si se quieren actualizar los participantes
    if (updateDto.participants) {
      const newParticipants: User[] = [];

      for (const participantId of updateDto.participants) {
        const user = await this.userRepository.findOne({
          where: { id: participantId },
        });
        if (user) {
          newParticipants.push(user);
        }
      }

      event.participants = newParticipants;
    }

    return await this.calendarEventRepository.save(event);
  }

  findOne(id: number) {
    return `This action returns a #${id} calendarEvent`;
  }

  async remove(id: number): Promise<void> {
    const eventFound = await this.calendarEventRepository.findOne({
      where: { id },
    });

    if (!eventFound) {
      throw new HttpException(
        'Conversation with id ${id} not found',
        HttpStatus.NOT_FOUND,
      );
    }

    eventFound.isDelete = true;
    await this.calendarEventRepository.save(eventFound);
  }
}
