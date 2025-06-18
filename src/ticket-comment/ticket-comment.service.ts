import { Injectable } from '@nestjs/common';
import { CreateTicketCommentDto } from './dto/create-ticket-comment.dto';
import { UpdateTicketCommentDto } from './dto/update-ticket-comment.dto';

@Injectable()
export class TicketCommentService {
  create(createTicketCommentDto: CreateTicketCommentDto) {
    return 'This action adds a new ticketComment';
  }

  findAll() {
    return `This action returns all ticketComment`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketComment`;
  }

  update(id: number, updateTicketCommentDto: UpdateTicketCommentDto) {
    return `This action updates a #${id} ticketComment`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketComment`;
  }
}
