import { Injectable } from '@nestjs/common';
import { CreateTicketUpdatedDto } from './dto/create-ticket-updated.dto';
import { UpdateTicketUpdatedDto } from './dto/update-ticket-updated.dto';

@Injectable()
export class TicketUpdatedService {
  create(createTicketUpdatedDto: CreateTicketUpdatedDto) {
    return 'This action adds a new ticketUpdated';
  }

  findAll() {
    return `This action returns all ticketUpdated`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticketUpdated`;
  }

  update(id: number, updateTicketUpdatedDto: UpdateTicketUpdatedDto) {
    return `This action updates a #${id} ticketUpdated`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticketUpdated`;
  }
}
