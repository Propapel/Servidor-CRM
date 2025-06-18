import { Controller, Get, Post, Body, Patch, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { CalendarEventService } from './calendar-event.service';
import { CreateCalendarEventDto } from './dto/create-calendar-event.dto';
import { UpdateCalendarEventDto } from './dto/update-calendar-event.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('calendar-event')
export class CalendarEventController {
  constructor(private readonly calendarEventService: CalendarEventService) { }

  @UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() createCalendarEventDto: CreateCalendarEventDto) {
    return this.calendarEventService.create(createCalendarEventDto);
  }
  @UseGuards(AccessTokenGuard)
  @Get('findAll')
  findAll() {
    return this.calendarEventService.findAll();
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.calendarEventService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Put('update/:id')
  update(@Param('id') id: number, @Body() updateCalendarEventDto: UpdateCalendarEventDto) {
    return this.calendarEventService.update(+id, updateCalendarEventDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete/:id')
  remove(@Param('id') id: number) {
    return this.calendarEventService.remove(+id);
  }
}
