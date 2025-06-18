import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TicketCommentService } from './ticket-comment.service';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';

@Controller('ticket-comment')
export class TicketCommentController {
  constructor(private readonly ticketCommentService: TicketCommentService) {}

  @Post()
  create(@Body() createTicketCommentDto: CreateTicketCommentDto) {
    return this.ticketCommentService.create(createTicketCommentDto);
  }

  @Get()
  findAll() {
    return this.ticketCommentService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ticketCommentService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketCommentDto: UpdateTicketCommentDto) {
    return this.ticketCommentService.update(+id, updateTicketCommentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketCommentService.remove(+id);
  }
}
