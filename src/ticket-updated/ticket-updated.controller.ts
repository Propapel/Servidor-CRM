import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketUpdatedService } from './ticket-updated.service';
import { CreateTicketUpdatedDto } from './dto/create-ticket-updated.dto';
import { UpdateTicketUpdatedDto } from './dto/update-ticket-updated.dto';

@Controller('ticket-updated')
export class TicketUpdatedController {
  constructor(private readonly ticketUpdatedService: TicketUpdatedService) {}

  @Post()
  create(@Body() createTicketUpdatedDto: CreateTicketUpdatedDto) {
    return this.ticketUpdatedService.create(createTicketUpdatedDto);
  }

  @Get()
  findAll() {
    return this.ticketUpdatedService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketUpdatedService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketUpdatedDto: UpdateTicketUpdatedDto) {
    return this.ticketUpdatedService.update(+id, updateTicketUpdatedDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketUpdatedService.remove(+id);
  }
}
