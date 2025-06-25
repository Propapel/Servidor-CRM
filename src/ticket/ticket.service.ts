import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { TicketAction } from 'src/ticket-updated/enum/ticket_action_enum';

@Injectable()
export class TicketService {

    constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TicketUpdate)
    private readonly ticketUpdateRepository: Repository<TicketUpdate>,
  ) {}

 async create(createTicketDto: CreateTicketDto) {
  // 1. Buscar usuario
  const user = await this.userRepository.findOneBy({ id: createTicketDto.userCreated });
  if (!user) {
    throw new Error('User not found');
  }

  // 2. Crear ticket sin updates
  const ticket = this.ticketRepository.create({
    createdBy: user,
    nameReported: createTicketDto.nameReported,
    apartamentReport: createTicketDto.apartamentReport,
    reasonReport: createTicketDto.reasonReport,
    location: createTicketDto.location,
    files: createTicketDto.files,
    phoneReport: createTicketDto.phoneReport,
    emailReport: createTicketDto.emailReport,
    status: createTicketDto.status,
    typeOfReport: createTicketDto.typeOfReport,
  });

  const savedTicket = await this.ticketRepository.save(ticket);

  // 3. Crear update con ticket asignado
  const updateReport = this.ticketUpdateRepository.create({
    action: TicketAction.CREATED,
    timestamp: new Date(),
    ticket: savedTicket,
  });

  await this.ticketUpdateRepository.save(updateReport);

  // 4. (Opcional) Retornar el ticket con relaciones
  return this.ticketRepository.findOne({
    where: { id: savedTicket.id },
    relations: ['updates', 'createdBy'],
  });
}


  findAll() {
    return `This action returns all ticket`;
  }

  findAllByBranch(branchId: number) {
    const tickets = this.ticketRepository.find(
      {
        where: {
           createdBy: {
             sucursales: {
               id: branchId,
             }
           }
        },
        relations: ['createdBy', 'assigmentsTechnical', 'updates', 'comments'],
      }
    )

    return tickets;
  }

  findOne(id: number) {
    const ticket = this.ticketRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assigmentsTechnical', 'updates', 'comments'],
    });
    return ticket;
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}
