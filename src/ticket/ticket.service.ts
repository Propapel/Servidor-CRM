import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from 'src/users/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TicketService {

    constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    // Buscar el usuario que crea el ticket
    const user = await this.userRepository.findOneBy({ id: createTicketDto.userCreated });
    if (!user) {
      throw new Error('User not found');
    }

    // Crear la instancia del ticket
    const ticket = this.ticketRepository.create({
      createdBy: user,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: createTicketDto.files, // arreglo de strings (rutas o urls)
      status: createTicketDto.status,  // debe ser un valor válido de TicketStatus
      priority: createTicketDto.priority, // debe ser un valor válido de TicketPriority
      typeOfReport: createTicketDto.typeOfReport, // debe ser un valor válido de TypeOfReport
    });


    // Guardar en base de datos
    return this.ticketRepository.save(ticket);
  }

  findAll() {
    return `This action returns all ticket`;
  }

  findOne(id: number) {
    return `This action returns a #${id} ticket`;
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}
