import { Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from 'src/users/user.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { TicketAction } from 'src/ticket-updated/enum/ticket_action_enum';
import { AsignTechnicalDto } from './dto/asign-technical.dto';
import { TicketStatus } from './enum/ticiket_report_status';
import { Client } from 'src/clients/entities/client.entity';
import { Itequipment } from 'src/itequipments/entities/itequipment.entity';

@Injectable()
export class TicketService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketRepository: Repository<Ticket>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(TicketUpdate)
    private readonly ticketUpdateRepository: Repository<TicketUpdate>,
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(Itequipment)
    private readonly itequipRepository: Repository<Itequipment>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    // 1. Buscar usuario
    const user = await this.userRepository.findOneBy({
      id: createTicketDto.userCreated,
    });
    if (!user) throw new Error('User not found');

    // 2. Buscar cliente
    const client = await this.clientRepository.findOneBy({
      id: createTicketDto.clientId,
    });
    if (!client) throw new Error('Client not found');

    // 3. Buscar equipo
    const equipo = await this.itequipRepository.findOneBy({
      id: createTicketDto.itequipId,
    });
    if (!equipo) throw new Error('Equipo not found');

    // 4. Crear ticket
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
      cliente: client,
      equipo: equipo,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 5. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      timestamp: new Date(),
      ticket: savedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);

    // 6. Retornar ticket con relaciones
    return this.ticketRepository.findOne({
      where: { id: savedTicket.id },
      relations: ['updates', 'createdBy', 'cliente', 'equipo'],
    });
  }
  findAll() {
    return `This action returns all ticket`;
  }

  findAllByBranch(branchId: number) {
    const tickets = this.ticketRepository.find({
      where: {
        createdBy: {
          sucursales: {
            id: branchId,
          },
        },
      },
      relations: ['createdBy', 'assigmentsTechnical', 'updates', 'comments'],
    });

    return tickets;
  }

  findOne(id: number) {
    const ticket = this.ticketRepository.findOne({
      where: { id },
      relations: ['createdBy', 'assigmentsTechnical', 'updates', 'comments'],
    });
    return ticket;
  }

  async asigngTicketToTechnical(
    ticketId: number,
    assigmentsTechnical: AsignTechnicalDto,
  ) {
    const ticket = await this.ticketRepository.findOneBy({ id: ticketId });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    const technicians = await this.userRepository.find({
      where: { id: In(assigmentsTechnical.assigmentsTechnical) },
    });

    if (technicians.length === 0) {
      throw new Error('No technicians found for the provided IDs');
    }

    ticket.assigmentsTechnical = technicians;
    ticket.status = TicketStatus.ASIGNADO;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.ASSIGNED,
      timestamp: new Date(),
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);
  }

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}
