import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { CreatePublicTicketDto } from './dto/create-public-ticket.dto';

import { PublicTicketCommentDto } from '../ticket-comment/dto/public-ticket-comment.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from '../users/user.entity';
import { Brackets, In, Like, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketUpdate } from '../ticket-updated/entities/ticket-updated.entity';
import { TicketAction } from '../ticket-updated/enum/ticket_action_enum';
import { AsignTechnicalDto } from './dto/asign-technical.dto';
import { TicketStatus } from './enum/ticiket_report_status';
import { Client } from '../clients/entities/client.entity';
import { Itequipment } from '../itequipments/entities/itequipment.entity';
import storage = require('../utils/cloud_storage.js');
import { MailService } from '../auth/service/MailService';
import { CloseTicketDto } from './dto/close_ticket.dto';
import { RateTicketDto } from './dto/rating_ticket_resolved.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentTicketDto } from './dto/add_comment_ticket.dto';
import { TicketComment } from '../ticket-comment/entities/ticket-comment.entity';
import ERROR_FOUND_TICKET from './web/error_found_ticket';
import ERROR_TICKET_QUALIFIED from './web/error_ticket_qualified';
import { TicketAttentionType } from './enum/ticket_attention_type';
import { Observable, Subject } from 'rxjs';
import { CreateTicketPlazaDto } from './dto/create-ticket-playa.dto';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { TypeOfReportEntity } from '../type-of-report/entities/type-of-report.entity';
import { RateDifficultyTicketDto } from './dto/rating_difficuty_ticket.dto';
import { PagedResponse } from './dto/paged-response.interface';
import { Request } from 'express';
import { PaginationDto } from './dto/pagination.dto';
import { SocketGateway } from '../socket/socket.gateway';
import { FirebaseService } from '../firebase/firebase.service';
import { when } from 'joi';

@Injectable()
export class TicketService {
  async addPublicComment(publicTicketCommentDto: PublicTicketCommentDto, file?: Express.Multer.File) {
    const { statusToken, content, imageUrl, publicName } = publicTicketCommentDto;

    const ticket = await this.ticketRepository.findOne({
      where: { statusToken: statusToken },
    });

    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    let finalImageUrl = '';

    if (file) {
      try {
        const pathFile = `comment_img_${ticket.id}_${Date.now()}`;
        const imageResult = await storage.uploadFromFile(
          file,
          pathFile,
          file.mimetype,
        );
        if (imageResult) {
          finalImageUrl = imageResult;
        }
      } catch (error) {
        console.error('Error al subir imagen de comentario por archivo:', error);
      }
    } else if (imageUrl && imageUrl.trim() !== '') {
      try {
        const buffer = Buffer.from(imageUrl, 'base64');
        const fileName = `comment_img_${ticket.id}_${Date.now()}.png`;

        // Asumiendo que storage es tu utilidad de Firebase/S3
        const imageResult = await storage.uploadFromBuffer(
          buffer,
          fileName,
          'image/png',
        );

        if (imageResult) {
          finalImageUrl = imageResult;
        }
      } catch (error) {
        console.error('Error al subir imagen de comentario en base64:', error);
        // Opcional: lanzar error o continuar sin imagen
      }
    }

    const comment = this.ticketCommentRepository.create({
      ticket: ticket,
      content: content,
      imageUrl: finalImageUrl || '',
      isInternal: false,
      isPublic: true,
      publicName: publicName || 'Usuario Web',
    });

    await this.ticketCommentRepository.save(comment);

    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id: ticket.id })
      .getOne();

    this.socketGateway.emitTicketUpdated(fullTicket);

    return { message: 'Comentario agregado con exito', ticket: fullTicket };
  }

  async getPublicTicketByToken(token: string) {
    const ticket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.statusToken = :token', { token })
      .getOne();

    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    return ticket;
  }

  async createPublicTicketWithFiles(
    files: Express.Multer.File[],
    createTicketDto: CreatePublicTicketDto,
  ) {
    const sucursal = await this.sucursalRepository.findOne({
      where: { id: createTicketDto.sucursalId },
    });
    if (!sucursal) {
      throw new HttpException('Sucursal no encontrada', HttpStatus.NOT_FOUND);
    }

    const createBy = await this.userRepository.findOne({
      where: { id: 34 },
    });

    if (!createBy) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    const sucursalToUser: Record<number, number> = {
      2: 330,
      3: 331,
      4: 332,
    };

    const idUser = sucursalToUser[sucursal.id];

    const cliente = await this.clientRepository.findOne({
      where: {
        id: idUser,
      },
    });

    if (!cliente) {
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
    }

    let typeOfReportEntity: TypeOfReportEntity | null = null;
    if (createTicketDto.typeOfReportId) {
      typeOfReportEntity = await this.typeOfReportRepository.findOne({
        where: { id: createTicketDto.typeOfReportId },
      });
    }

    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketConsecutive)', 'max')
      .where('ticket.sucursalId = :sucursalId', {
        sucursalId: sucursal.id,
      })
      .getRawOne<{ max: number }>();

    const ticketConsecutive = lastTicket?.max ? lastTicket.max + 1 : 1;

    const newListFiles: string[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const attachment = files[i];
        const pathFile = `file_report_public_${Date.now()}`;
        const fileUrl = await storage.uploadFromFile(
          attachment,
          pathFile,
          attachment.mimetype,
        );
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }

    const ticket = this.ticketRepository.create({
      ticketNumber: `${sucursal.abbreviation}-${ticketConsecutive}`,
      ticketConsecutive,
      statusToken: uuidv4(),
      nameCommercial: createTicketDto.nameCommercial,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: newListFiles,
      typeOfReportEntity: typeOfReportEntity ?? null,
      sucursal: sucursal,
      phoneReport: createTicketDto.phoneReport,
      emailReport: createTicketDto.emailReport,
      status: createTicketDto.status || TicketStatus.SIN_ASIGNAR,
      typeOfReport: createTicketDto.typeOfReport,
      isPublic: true,
      createdBy: createBy,
      cliente: cliente,
      equipo: null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });
    await this.ticketUpdateRepository.save(updateReport);

    if (savedTicket.emailReport && savedTicket.emailReport.trim().length > 0) {
      this.mailService.sendEmailToClientStatusTicket(
        savedTicket.nameReported || 'Usuario',
        savedTicket.emailReport,
        savedTicket.ticketNumber,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.statusToken,
      ).catch(() => console.log('Aviso: Ignorando error de correo a cliente'));
    }

    await this.notifyTechnicians(sucursal.id, savedTicket);

    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id: savedTicket.id })
      .getOne();

    this.socketGateway.emitNewTicket(fullTicket);

    return fullTicket;
  }

  constructor(
    @InjectRepository(Sucursales)
    private sucursalRepository: Repository<Sucursales>,
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
    private mailService: MailService,
    @InjectRepository(TicketComment)
    private readonly ticketCommentRepository: Repository<TicketComment>,
    @InjectRepository(TypeOfReportEntity)
    private readonly typeOfReportRepository: Repository<TypeOfReportEntity>,
    private readonly socketGateway: SocketGateway,
    private readonly firebaseService: FirebaseService,
  ) { }

  async findTicketsForStats(branchId: number) {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .select([
        'ticket.id',        // Identificador
        'ticket.status',    // Para count { it.status == ... }
        'ticket.resolved',  // Para count { it.resolved }
        'ticket.createdAt'  // Para toWeeklyTrend
      ])
      .innerJoin('ticket.sucursal', 'sucursal')
      .where('sucursal.id = :branchId', { branchId })
      .andWhere('ticket.isDelete = :isDelete', { isDelete: false })
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();
  }

  async searchByText(branchId: number, term: string) {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere(
        new Brackets((qb) => {
          qb.where('ticket.reasonReport LIKE :term', { term: `%${term}%` })
            .orWhere('ticket.nameCommercial LIKE :term', { term: `%${term}%` })
            .orWhere('ticket.ticketNumber LIKE :term', { term: `%${term}%` })
            .orWhere('ticket.nameReported LIKE :term', { term: `%${term}%` })

            // CORRECCIÓN: Usar los alias definidos en los Joins
            .orWhere('comments.content LIKE :term', { term: `%${term}%` })
            .orWhere('commentAuthor.name LIKE :term', { term: `%${term}%` })
            .orWhere('cliente.razonSocial LIKE :term', { term: `%${term}%` });
        }),
      )
      .andWhere('sucursal.id = :branchId', { branchId })
      .orderBy('ticket.createdAt', 'DESC')
      .take(20)
      .getMany();
  }

  async findTicketCreatedPagging(
    userId: number,
    paginationDto: PaginationDto,
    request: Request,
  ) {
    const { limit = 10, page = 1 } = paginationDto;
    const skip = (page - 1) * limit;

    const queryBuilder = this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere('ticket.createdBy.id = :userId', { userId });

    // 1. Creamos una columna oculta para el ordenamiento
    queryBuilder.addSelect(
      `(CASE 
        WHEN ticket.status = '${TicketStatus.SIN_ASIGNAR}' THEN 1 
        WHEN ticket.status = '${TicketStatus.RESUELTO}' THEN 3 
        ELSE 2 
      END)`,
      'status_priority', // Este es el alias de la columna virtual
    );

    // 2. Ordenamos usando el alias que definimos arriba
    // Nota: Usamos 'ASC' para que el 1 (SIN_ASIGNAR) sea el primero
    queryBuilder.orderBy('status_priority', 'ASC');

    // 3. Orden secundario por fecha (opcional pero recomendado)
    queryBuilder.addOrderBy('ticket.createdAt', 'DESC');

    const [tickets, total] = await queryBuilder
      .take(limit)
      .skip(skip)
      .getManyAndCount();

    return this.createPagedResponse(tickets, total, +page, +limit, request);
  }

  async findAllByBranchPagging(
  branchId: number,
  paginationDto: PaginationDto,
  request: Request,
) {
  const { limit = 10, page = 1 } = paginationDto;
  const skip = (page - 1) * limit;

  const baseQuery = () =>
    this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere('sucursal.id = :branchId', { branchId });

  const total = await baseQuery().getCount();

  const tickets = await baseQuery()
    .leftJoinAndSelect('ticket.createdBy', 'createdBy')
    .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
    .leftJoinAndSelect('ticket.updates', 'updates')
    .leftJoinAndSelect('ticket.comments', 'comments')
    .leftJoinAndSelect('comments.author', 'commentAuthor')
    .leftJoinAndSelect('ticket.cliente', 'cliente')
    .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
    .leftJoinAndSelect('ticket.equipo', 'equipo')
    .addSelect(
      `(CASE 
        WHEN ticket.status = '${TicketStatus.SIN_ASIGNAR}' THEN 1 
        WHEN ticket.status = '${TicketStatus.RESUELTO}' THEN 3 
        ELSE 2 
      END)`,
      'status_priority',
    )
    .orderBy('status_priority', 'ASC')
    .addOrderBy('ticket.createdAt', 'DESC')
    .take(limit)
    .skip(skip)
    .getMany();

  return this.createPagedResponse(tickets, total, +page, +limit, request);
}

  private createPagedResponse<T>(
    data: T[],
    totalItems: number,
    page: number,
    limit: number,
    request: Request, // Necesitamos el request para saber la URL actual
  ): PagedResponse<T> {
    const totalPages = Math.ceil(totalItems / limit);

    // Construir URL base (ej: http://localhost:3000/ticket/allTickets)
    const protocol = request.protocol;
    const host = request.get('host');
    const baseUrl = `${protocol}://${host}${request.path}`;

    // Lógica para next/prev
    const next =
      page < totalPages ? `${baseUrl}?page=${page + 1}&limit=${limit}` : null;

    const prev = page > 1 ? `${baseUrl}?page=${page - 1}&limit=${limit}` : null;

    return {
      info: {
        count: totalItems,
        pages: totalPages,
        next: next,
        prev: prev,
      },
      results: data,
    };
  }

  async qualifyTicket(
    ticketId: number,
    rateDifficultyTicketDto: RateDifficultyTicketDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });
    if (!ticket) {
      throw new HttpException(ERROR_FOUND_TICKET, HttpStatus.NOT_FOUND);
    }
    if (ticket.isQualifiedTheDifficulty) {
      throw new HttpException(ERROR_TICKET_QUALIFIED, HttpStatus.BAD_REQUEST);
    }
    ticket.difficultyRating = rateDifficultyTicketDto.difficultyRating;
    ticket.isQualifiedTheDifficulty = true;
    return this.ticketRepository.save(ticket);
  }

  async createTicketNewWithFiles(
    files: Express.Multer.File[],
    createTicketDto: CreateTicketDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: createTicketDto.userCreated },
      relations: ['sucursales'],
    });
    if (!user)
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    // 2. Buscar cliente
    const client = await this.clientRepository.findOne({
      where: { id: createTicketDto.clientId },
      relations: ['user'],
    });
    if (!client)
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);

    // 3. Buscar equipo (si existe)
    let equipo: Itequipment | null = null;
    if (createTicketDto.itequipId) {
      equipo = await this.itequipRepository.findOneBy({
        id: createTicketDto.itequipId,
      });
    }
    let typeOfReportEntity: TypeOfReportEntity | null = null;

    if (createTicketDto.typeOfReportId) {
      typeOfReportEntity = await this.typeOfReportRepository.findOne({
        where: { id: createTicketDto.typeOfReportId },
      });
    }

    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketConsecutive)', 'max')
      .where('ticket.sucursalId = :sucursalId', {
        sucursalId: user.sucursales[0].id,
      })
      .getRawOne<{ max: number }>();

    const ticketConsecutive = lastTicket?.max ? lastTicket.max + 1 : 1;

    // 5. Procesar archivos
    const newListFiles: string[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const attachment = files[i];
        const pathFile = `file_report_ticket${createTicketDto.clientId}_${Date.now()}`;
        const fileUrl = await storage.uploadFromFile(
          attachment,
          pathFile,
          attachment.mimetype,
        );
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }

    // 6. Crear ticket con ID manual
    const ticket = this.ticketRepository.create({
      ticketNumber: `${user.sucursales[0].abbreviation}-${ticketConsecutive}`,
      ticketConsecutive,
      createdBy: user,
      statusToken: uuidv4(),
      nameCommercial: createTicketDto.nameCommercial,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: newListFiles,
      typeOfReportEntity: typeOfReportEntity ?? null,
      sucursal: user.sucursales[0], // Asignar sucursal del usuario
      phoneReport: createTicketDto.phoneReport,
      emailReport: createTicketDto.emailReport,
      status: createTicketDto.status,
      typeOfReport: createTicketDto.typeOfReport,
      cliente: client,
      equipo: equipo ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 7. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });
    await this.ticketUpdateRepository.save(updateReport);
    // 8. Enviar correos en segundo plano (sin await) para que no tarde la respuesta
    if (user && user.email && user.email.trim().length > 0) {
      this.mailService.sendEmailCreatedReport(
        user.name,
        savedTicket.ticketNumber,
        user.email,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.location,
        savedTicket.reasonReport,
      ).catch(() => console.log('Aviso: Ignorando error de correo interno'));
    }
    if (savedTicket.emailReport && savedTicket.emailReport.trim().length > 0) {
      this.mailService.sendEmailToClientStatusTicket(
        savedTicket.nameReported || 'Usuario',
        savedTicket.emailReport,
        savedTicket.ticketNumber,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.statusToken,
      ).catch(() => console.log('Aviso: Ignorando error de correo a cliente'));
    }

    // await this.emitTickets(user.sucursales[0].id);
    await this.notifyTechnicians(user.sucursales[0].id, savedTicket);

    // 9. Retornar ticket con relaciones
    return this.ticketRepository.findOne({
      where: { id: savedTicket.id },
      relations: ['updates', 'createdBy', 'cliente', 'equipo'],
    });
  }

  async createTicketPlaza(
    files: Express.Multer.File[],
    createTicketDtoPlaza: CreateTicketPlazaDto,
  ) {
    console.log(
      'Datos recibidos en createTicketPlaza: %o',
      createTicketDtoPlaza,
    );
    const sucursal = await this.sucursalRepository.findOne({
      where: {
        id: createTicketDtoPlaza.plazaId,
      },
    });
    console.log('Sucursal encontrada: %o', sucursal);

    const user = await this.userRepository.findOne({
      where: { id: createTicketDtoPlaza.userCreated },
      relations: ['sucursales'],
    });
    if (!user)
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    let typeOfReportEntity: TypeOfReportEntity | null = null;

    if (createTicketDtoPlaza.typeOfReportId) {
      typeOfReportEntity = await this.typeOfReportRepository.findOne({
        where: { id: createTicketDtoPlaza.typeOfReportId },
      });
    }

    // 2. Buscar cliente
    const client = await this.clientRepository.findOne({
      where: { id: createTicketDtoPlaza.clientId },
      relations: ['user'],
    });
    if (!client)
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);

    // 3. Buscar equipo (si existe)
    let equipo: Itequipment | null = null;
    if (createTicketDtoPlaza.itequipId) {
      equipo = await this.itequipRepository.findOneBy({
        id: createTicketDtoPlaza.itequipId,
      });
    }

    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketConsecutive)', 'max')
      .where('ticket.sucursalId = :sucursalId', {
        sucursalId: createTicketDtoPlaza.plazaId,
      })
      .getRawOne<{ max: number }>();

    const ticketConsecutive = lastTicket?.max ? lastTicket.max + 1 : 1;

    // 5. Procesar archivos
    const newListFiles: string[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const attachment = files[i];
        const pathFile = `file_report_ticket${createTicketDtoPlaza.clientId}_${Date.now()}`;
        const fileUrl = await storage.uploadFromFile(
          attachment,
          pathFile,
          attachment.mimetype,
        );
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }

    // 6. Crear ticket con ID manual
    const ticket = this.ticketRepository.create({
      ticketNumber: `${sucursal.abbreviation}-${ticketConsecutive}`,
      ticketConsecutive,
      createdBy: user,
      statusToken: uuidv4(),
      nameCommercial: createTicketDtoPlaza.nameCommercial,
      nameReported: createTicketDtoPlaza.nameReported,
      apartamentReport: createTicketDtoPlaza.apartamentReport,
      reasonReport: createTicketDtoPlaza.reasonReport,
      location: createTicketDtoPlaza.location,
      files: newListFiles,
      typeOfReportEntity: typeOfReportEntity ?? null,
      sucursal: sucursal, // Asignar sucursal del usuario
      phoneReport: createTicketDtoPlaza.phoneReport,
      emailReport: createTicketDtoPlaza.emailReport,
      status: createTicketDtoPlaza.status,
      typeOfReport: createTicketDtoPlaza.typeOfReport,
      cliente: client,
      equipo: equipo ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 7. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });
    await this.ticketUpdateRepository.save(updateReport);

    // await this.emitTickets(user.sucursales[0].id);
    await this.notifyTechnicians(sucursal.id, savedTicket);

    // 9. Retornar ticket con relaciones
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id: savedTicket.id })
      .getOne();
  }

  async createTicketWithFiles(
    files: Express.Multer.File[],
    createTicketDto: CreateTicketDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: createTicketDto.userCreated },
      relations: ['sucursales'],
    });
    if (!user)
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    // 2. Buscar cliente
    const client = await this.clientRepository.findOne({
      where: { id: createTicketDto.clientId },
      relations: ['user'],
    });
    if (!client)
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);

    // 3. Buscar equipo (si existe)
    let equipo: Itequipment | null = null;
    if (createTicketDto.itequipId) {
      equipo = await this.itequipRepository.findOneBy({
        id: createTicketDto.itequipId,
      });
    }

    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketConsecutive)', 'max')
      .where('ticket.sucursalId = :sucursalId', {
        sucursalId: user.sucursales[0].id,
      })
      .getRawOne<{ max: number }>();

    const ticketConsecutive = lastTicket?.max ? lastTicket.max + 1 : 1;

    // 5. Procesar archivos
    const newListFiles: string[] = [];
    if (files && files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        const attachment = files[i];
        const pathFile = `file_report_ticket${createTicketDto.clientId}_${Date.now()}`;
        const fileUrl = await storage.uploadFromFile(
          attachment,
          pathFile,
          attachment.mimetype,
        );
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }

    // 6. Crear ticket con ID manual
    const ticket = this.ticketRepository.create({
      ticketNumber: `${user.sucursales[0].abbreviation}-${ticketConsecutive}`,
      ticketConsecutive,
      createdBy: user,
      statusToken: uuidv4(),
      nameCommercial: createTicketDto.nameCommercial,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: newListFiles,
      sucursal: user.sucursales[0], // Asignar sucursal del usuario
      phoneReport: createTicketDto.phoneReport,
      emailReport: createTicketDto.emailReport,
      status: createTicketDto.status,
      typeOfReport: createTicketDto.typeOfReport,
      cliente: client,
      equipo: equipo ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 7. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });
    await this.ticketUpdateRepository.save(updateReport);

    // 8. Enviar correos en segundo plano (sin await) para que no tarde la respuesta
    if (user && user.email && user.email.trim().length > 0) {
      this.mailService.sendEmailCreatedReport(
        user.name,
        savedTicket.ticketNumber,
        user.email,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.location,
        savedTicket.reasonReport,
      ).catch(() => console.log('Aviso: Ignorando error de correo interno'));
    }
    if (savedTicket.emailReport && savedTicket.emailReport.trim().length > 0) {
      this.mailService.sendEmailToClientStatusTicket(
        savedTicket.nameReported || 'Usuario',
        savedTicket.emailReport,
        savedTicket.ticketNumber,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.statusToken,
      ).catch(() => console.log('Aviso: Ignorando error de correo a cliente'));
    }

    // await this.emitTickets(user.sucursales[0].id);
    await this.notifyTechnicians(user.sucursales[0].id, savedTicket);

    // 9. Retornar ticket con relaciones

    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id: savedTicket.id })
      .getOne();

    this.socketGateway.emitNewTicket(fullTicket);

    return fullTicket;

  }

  async create(createTicketDto: CreateTicketDto) {
    // 1. Buscar usuario
    const user = await this.userRepository.findOne({
      where: { id: createTicketDto.userCreated },
      relations: ['sucursales'],
    });
    if (!user)
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    // 2. Buscar cliente
    const client = await this.clientRepository.findOne({
      where: { id: createTicketDto.clientId },
      relations: ['user'],
    });
    if (!client)
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);

    // 3. Buscar equipo (si existe)
    let equipo: Itequipment | null = null;
    if (createTicketDto.itequipId) {
      equipo = await this.itequipRepository.findOneBy({
        id: createTicketDto.itequipId,
      });
    }

    // 4. Manejar ID por sucursal
    // Obtener último ticket de esa sucursal
    // 4. Obtener el último consecutivo de esa sucursal
    const lastTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .select('MAX(ticket.ticketConsecutive)', 'max')
      .where('ticket.sucursalId = :sucursalId', {
        sucursalId: user.sucursales[0].id,
      })
      .getRawOne<{ max: number }>();

    const ticketConsecutive = lastTicket?.max ? lastTicket.max + 1 : 1;

    // 5. Procesar archivos
    const newListFiles: string[] = [];
    if (createTicketDto.files && createTicketDto.files.length > 0) {
      for (let i = 0; i < createTicketDto.files.length; i++) {
        const attachment = createTicketDto.files[i];
        const buffer = Buffer.from(attachment, 'base64');
        const pathFile = `fileActivity${createTicketDto.clientId}_${Date.now()}`;
        const fileUrl = await storage.uploadFromBuffer(
          buffer,
          pathFile,
          'image/png',
        );
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }

    // 6. Crear ticket con ID manual
    const ticket = this.ticketRepository.create({
      ticketNumber: `${user.sucursales[0].abbreviation}-${ticketConsecutive}`,
      ticketConsecutive,
      createdBy: user,
      statusToken: uuidv4(),
      nameCommercial: createTicketDto.nameCommercial,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: newListFiles,
      sucursal: user.sucursales[0], // Asignar sucursal del usuario
      phoneReport: createTicketDto.phoneReport,
      emailReport: createTicketDto.emailReport,
      status: createTicketDto.status,
      typeOfReport: createTicketDto.typeOfReport,
      cliente: client,
      equipo: equipo ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 7. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });
    await this.ticketUpdateRepository.save(updateReport);

    // 8. Enviar correos en segundo plano (sin await) para que no tarde la respuesta
    if (user && user.email && user.email.trim().length > 0) {
      this.mailService.sendEmailCreatedReport(
        user.name,
        savedTicket.ticketNumber,
        user.email,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.location,
        savedTicket.reasonReport,
      ).catch(() => console.log('Aviso: Ignorando error de correo interno'));
    }
    if (savedTicket.emailReport && savedTicket.emailReport.trim().length > 0) {
      this.mailService.sendEmailToClientStatusTicket(
        savedTicket.nameReported || 'Usuario',
        savedTicket.emailReport,
        savedTicket.ticketNumber,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.statusToken,
      ).catch(() => console.log('Aviso: Ignorando error de correo a cliente'));
    }

    // await this.emitTickets(user.sucursales[0].id);
    await this.notifyTechnicians(user.sucursales[0].id, savedTicket);

    // 9. Retornar ticket con relaciones
    return this.ticketRepository.findOne({
      where: { id: savedTicket.id },
      relations: ['updates', 'createdBy', 'cliente', 'equipo'],
    });
  }

  findAll() {
    return `This action returns all ticket`;
  }

  async findAllTicketBranches() {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('createdBy.sucursales', 'createdBySucursales')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();
  }

  async findAllByBranch(branchId: number) {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere('sucursal.id = :branchId', { branchId })
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();
  }

  async findOne(id: number) {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id })
      .getOne();
  }

  async findMyTicketsCreated(userId: number) {
    return await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere('createdBy.id = :userId', { userId })
      .orderBy('ticket.createdAt', 'DESC')
      .getMany();
  }

  async findTicketAssigments(id: number) {
    const tickets = await this.ticketRepository.find({
      where: {
        assigmentsTechnical: {
          id: id,
        },
        isDelete: false,
        status: Not(TicketStatus.RESUELTO),
      },
      relations: [
        'createdBy',
        'assigmentsTechnical',
        'updates',
        'comments',
        'comments.author',
        'cliente',
        'equipo',
      ],
      order: {
        createdAt: 'DESC', // Aquí ordenas por fecha de creación descendente
      },
    });

    return tickets;
  }

  /**
   * Function to mark a ticket as in progress
   *
   *
   * @param ticketId  The ID of the ticket to mark as in progress
   * @return {Promise<void>} A promise that resolves when the ticket is marked as in progress
   * @throws {Error} If the ticket is not found
   */
  async inProgressReport(ticketId: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['assigmentsTechnical', 'createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = TicketStatus.EN_PROCESO;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.ONPROGRESS,
      ticket: updatedTicket,
    });

    /*
    await this.mailService.sendEmailOnProgressTicket(
      ticket.createdBy.name,
      ticket.id,
      ticket.createdBy.email,
      ticket.createdAt.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      ticket.assigmentsTechnical.map((tech) => tech.name).join(', '),
    );*/

    await this.ticketUpdateRepository.save(updateReport);
  }

  async updateAssignTechnical(
    ticketId: number,
    assigmentsTechnical: AsignTechnicalDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['assigmentsTechnical', 'createdBy'],
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    const technicians = await this.userRepository.find({
      where: { id: In(assigmentsTechnical.assigmentsTechnical) },
    });

    if (ticket.status === TicketStatus.ON_SITE) {
      ticket.attentionType = TicketAttentionType.EN_SITIO;
    } else if (ticket.status === TicketStatus.IN_REMOTE) {
      ticket.attentionType = TicketAttentionType.REMOTA;
    } else {
      ticket.attentionType = null;
    }

    ticket.assigmentsTechnical = technicians;
    ticket.status = assigmentsTechnical.statusTicket;
    await this.ticketRepository.save(ticket);
  }

  async asigngTicketToTechnical(
    ticketId: number,
    assigmentsTechnical: AsignTechnicalDto,
  ) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['assigmentsTechnical', 'createdBy'],
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    const technicians = await this.userRepository.find({
      where: { id: In(assigmentsTechnical.assigmentsTechnical) },
    });

    if (technicians.length === 0) {
      throw new HttpException('Tecnicos no encontrados', HttpStatus.NOT_FOUND);
    }

    if (ticket.status === TicketStatus.ON_SITE) {
      ticket.attentionType = TicketAttentionType.EN_SITIO;
    } else if (ticket.status === TicketStatus.IN_REMOTE) {
      ticket.attentionType = TicketAttentionType.REMOTA;
    } else {
      ticket.attentionType = null;
    }

    ticket.assigmentsTechnical = technicians;
    ticket.status = assigmentsTechnical.statusTicket;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.ASSIGNED,
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);
    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
    this.socketGateway.emitTicketUpdated(fullTicket);
    return fullTicket;
  }

  async onPauseTicket(ticketId: number, reasonPause: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
    }
    ticket.reasonPause = reasonPause;
    ticket.status = TicketStatus.EN_ESPERA;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.PAUSED,
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);
  }

  async updateStatus(ticketId: number, statusTicket: TicketStatus) {
    // Convertimos a número para asegurar que la búsqueda sea correcta
    const id = Number(ticketId);

    console.log(`Buscando ticket con ID: ${id}`); // Log de depuración

    const ticket = await this.ticketRepository.findOne({
      where: { id: id },
    });

    if (!ticket) {
      // Si el error persiste, el ID que ves en el console.log no existe en tu DB
      throw new Error(`Ticket con ID ${id} no encontrado en la base de datos`);
    }

    ticket.status = statusTicket;
    await this.ticketRepository.save(ticket);

    const updatedTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :id', { id })
      .getOne();
    this.socketGateway.emitTicketStatusChanged(updatedTicket); // ← agregar esto

    return updatedTicket

  }
  async closeTicketWithFile(file: Express.Multer.File, ticketId: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId }
    });

    if (!ticket) {
      throw new Error('Ticket not found');
    }

    // Subimos usando el mimetype que trae el archivo
    console.log('Tipo de archivo:', file.mimetype);
    const url = await storage.uploadFromFile(
      file,
      file.originalname,
      file.mimetype, // dinámico
    );

    ticket.ratingToken = uuidv4();
    ticket.resolved = true;
    ticket.resolvedAt = new Date();
    ticket.status = TicketStatus.RESUELTO;

    // Según el tipo de archivo guardamos en el campo correspondiente
    if (file.mimetype == 'image/png' || file.mimetype === 'image/jpeg') {
      ticket.imagePageService = url;
    } else if (file.mimetype === 'application/pdf') {
      ticket.pdfPageService = url;
    } else {
      throw new Error(`Tipo de archivo no soportado: ${file.mimetype}`);
    }
    /*
     else if (file.mimetype.startsWith('video/')) {
      ticket.videoPageService = url; // si quieres soportar videos
    } */

    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CLOSED,
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);

    /*
    // Calcular tiempo total de resolución (días, horas, minutos, segundos)
    const fechaSolicitud = ticket.createdAt;
    const fechaResolucion = ticket.resolvedAt;
    const tiempoLaboral = this.calcularTiempoLaboralRelativo(
      fechaSolicitud,
      fechaResolucion,
    );

    // Enviar correo
    await this.mailService.closeTicketEmail(
      ticket.nameReported,
      ticket.id,
      ticket.emailReport,
      fechaSolicitud.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      ticket.assigmentsTechnical.map((t) => t.name).join(', '),
      fechaResolucion.toLocaleDateString(),
      tiempoLaboral,
      ticket.ratingToken,
    );
*/
    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
    this.socketGateway.emitTicketUpdated(fullTicket);
    return fullTicket;
  }

  async closeTicket(ticketId: number, closeTicketDto: CloseTicketDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    if (
      closeTicketDto.imagePageService &&
      closeTicketDto.imagePageService.trim() !== ''
    ) {
      const buffer = Buffer.from(closeTicketDto.imagePageService, 'base64');
      const pathPdf = `image_service_Ticket${ticketId}_${Date.now()}`;
      const imageResult = await storage.uploadFromBuffer(
        buffer,
        pathPdf,
        'image/png',
      );

      if (imageResult) {
        ticket.imagePageService = imageResult; // Guarda la URL de la imagen
      }
    }
    if (
      closeTicketDto.pdfPageService &&
      closeTicketDto.pdfPageService.trim() !== ''
    ) {
      const buffer = Buffer.from(closeTicketDto.pdfPageService, 'base64');
      const pathPdf = `pdf_service_Ticket${ticketId}_${Date.now()}`;
      const pdfUrl = await storage.uploadFromBuffer(
        buffer,
        pathPdf,
        'application/pdf',
      );

      if (pdfUrl) {
        ticket.pdfPageService = pdfUrl; // Guarda la URL de la imagen
      }
    }

    ticket.ratingToken = uuidv4();
    ticket.resolved = true;
    ticket.resolvedAt = new Date();

    ticket.status = TicketStatus.RESUELTO;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CLOSED,
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);

    // Calcular tiempo total de resolución (días, horas, minutos, segundos)
    const fechaSolicitud = ticket.createdAt;
    const fechaResolucion = ticket.resolvedAt;
    const tiempoLaboral = this.calcularTiempoLaboralRelativo(
      fechaSolicitud,
      fechaResolucion,
    );

    // Enviar correo
    await this.mailService.closeTicketEmail(
      ticket.nameReported,
      ticket.id,
      ticket.emailReport,
      fechaSolicitud.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      ticket.assigmentsTechnical.map((t) => t.name).join(', '),
      fechaResolucion.toLocaleDateString(),
      tiempoLaboral,
      ticket.ratingToken,
    );
  }
  toGuatemala(date: Date): Date {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Guatemala',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? '0', 10);

    return new Date(
      get('year'),
      get('month') - 1,
      get('day'),
      get('hour'),
      get('minute'),
      get('second'),
    );
  }

  calcularTiempoLaboralRelativo(
    fechaSolicitud: Date,
    fechaResolucion: Date,
  ): string {
    fechaSolicitud = this.toGuatemala(fechaSolicitud);
    fechaResolucion = this.toGuatemala(fechaResolucion);

    if (fechaResolucion < fechaSolicitud) return '';

    let totalMinutos = 0;
    const current = new Date(fechaSolicitud);

    while (current < fechaResolucion) {
      const dia = current.getDay(); // 0 = domingo, 6 = sábado
      let inicioLab: Date;
      let finLab: Date;

      if (dia >= 1 && dia <= 5) {
        // Lunes a viernes: 9:00 - 18:00
        inicioLab = new Date(current);
        inicioLab.setHours(9, 0, 0, 0);
        finLab = new Date(current);
        finLab.setHours(18, 0, 0, 0);
      } else if (dia === 6) {
        // Sábado: 9:00 - 14:00
        inicioLab = new Date(current);
        inicioLab.setHours(9, 0, 0, 0);
        finLab = new Date(current);
        finLab.setHours(14, 0, 0, 0);
      } else {
        // Domingo: no se trabaja
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      // Ajustamos las fechas al rango laboral
      const inicio = current > inicioLab ? current : inicioLab;
      const fin = fechaResolucion < finLab ? fechaResolucion : finLab;

      if (inicio < fin) {
        totalMinutos += (fin.getTime() - inicio.getTime()) / (1000 * 60);
      }

      // Pasamos al siguiente día
      current.setDate(current.getDate() + 1);
      current.setHours(0, 0, 0, 0);
    }

    const dias = Math.floor(totalMinutos / (60 * 24));
    const horas = Math.floor((totalMinutos % (60 * 24)) / 60);
    const minutos = Math.floor(totalMinutos % 60);

    let resultado = '';
    if (dias > 0) resultado += `${dias} día${dias > 1 ? 's' : ''}, `;
    if (horas > 0) resultado += `${horas} hora${horas > 1 ? 's' : ''}, `;
    resultado += `${minutos} minuto${minutos !== 1 ? 's' : ''}`;

    return resultado;
  }

  async qualifyServiceByToken(token: string): Promise<string> {
    const ticket = await this.ticketRepository.findOne({
      where: { ratingToken: token },
    });

    if (!ticket) {
      return ERROR_FOUND_TICKET;
    }

    if (ticket.serviceRating != null) {
      return ERROR_TICKET_QUALIFIED;
    }

    const id = ticket.id; // para insertar en el JavaScript
    return `
<!DOCTYPE html>
<html xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" lang="en">

<head>
    <title></title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0"><!--[if mso]>
<xml><w:WordDocument xmlns:w="urn:schemas-microsoft-com:office:word"><w:DontUseAdvancedTypographyReadingMail/></w:WordDocument>
<o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch><o:AllowPNG/></o:OfficeDocumentSettings></xml>
<![endif]--><!--[if !mso]><!--><!--<![endif]-->
    <style>
        body {
            font-family: "Segoe UI", Tahoma, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }

        .container {
            max-width: 500px;
            margin: 40px auto;
            background-color: white;
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        h2 {
            color: #0d47a1;
            text-align: center;
        }

        .stars {
            display: flex;
            justify-content: center;
            gap: 10px;
            margin: 20px 0;
        }

        .star {
            font-size: 30px;
            cursor: pointer;
            color: #ccc;
        }

        .star.selected {
            color: #ffb400;
        }

        textarea {
            width: 100%;
            height: 100px;
            resize: none;
            padding: 10px;
            border: 1px solid #ccc;
            border-radius: 6px;
            font-family: inherit;
            margin-top: 15px;
        }

        button {
            display: block;
            width: 100%;
            padding: 12px;
            background-color: #0d47a1;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            margin-top: 20px;
            cursor: pointer;
        }

        button:hover {
            background-color: #1565c0;
        }

        .confirmation {
            text-align: center;
            font-size: 16px;
            color: green;
            margin-top: 20px;
        }

        .disabled {
            pointer-events: none;
            opacity: 0.5;
        }

        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 0;
        }

        a[x-apple-data-detectors] {
            color: inherit !important;
            text-decoration: inherit !important;
        }

        #MessageViewBody a {
            color: inherit;
            text-decoration: none;
        }

        p {
            line-height: inherit
        }

        .desktop_hide,
        .desktop_hide table {
            mso-hide: all;
            display: none;
            max-height: 0px;
            overflow: hidden;
        }

        .image_block img+div {
            display: none;
        }

        sup,
        sub {
            font-size: 75%;
            line-height: 0;
        }

        @media (max-width:670px) {
            .mobile_hide {
                display: none;
            }

            .row-content {
                width: 100% !important;
            }

            .stack .column {
                width: 100%;
                display: block;
            }

            .mobile_hide {
                min-height: 0;
                max-height: 0;
                max-width: 0;
                overflow: hidden;
                font-size: 0px;
            }

            .desktop_hide,
            .desktop_hide table {
                display: table !important;
                max-height: none !important;
            }
        }
    </style><!--[if mso ]><style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style> <![endif]-->
</head>

<body class="body" style="background-color: #3d1554; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
    <table class="nl-container" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #3d1554;">
        <tbody>
            <tr>
                <td>
                    <table class="row row-1" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
                                                    <div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-2" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="33.333333333333336%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
                                                    <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                                                <div class="alignment" align="center">
                                                                    <div style="max-width: 151.667px;"><a href="http://www.example.com/" target="_blank"><img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/i6a/nv1/gin/Propapel-logo%20%281%29.png" style="display: block; height: auto; border: 0; width: 100%;" width="151.667" alt="Logo" title="Logo" height="auto"></a></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td class="column column-2" width="66.66666666666667%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
                                                    <table class="empty_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-3" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top;">
                                                    <div class="spacer_block block-1" style="height:20px;line-height:20px;font-size:1px;">&#8202;</div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-4" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0017a0;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; border-left: 4px solid transparent; border-right: 4px solid transparent; padding-bottom: 60px; padding-top: 55px; vertical-align: top;">

                                                    <div class="container" id="formContainer">
                                                        <h2>Califica el servicio recibido</h2>

                                                        <form id="ratingForm">
                                                            <div class="stars" id="starContainer">
                                                                <span class="star" data-value="1">&#9733;</span>
                                                                <span class="star" data-value="2">&#9733;</span>
                                                                <span class="star" data-value="3">&#9733;</span>
                                                                <span class="star" data-value="4">&#9733;</span>
                                                                <span class="star" data-value="5">&#9733;</span>
                                                            </div>

                                                            <textarea placeholder="Escribe tus comentarios (opcional)..." name="comment" id="comment"></textarea>
                                                            <input type="hidden" name="rating" id="ratingValue" value="0" />
                                                            <button type="submit">Enviar calificación</button>
                                                        </form>

                                                        <div id="confirmationMessage" class="confirmation" style="display: none;">
                                                            ¡Gracias! Tu calificación ha sido registrada. Puedes cerrar esta pestaña.
                                                        </div>
                                                    </div>

                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-5" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #d38b00;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #57366e; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="58.333333333333336%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #d38b00; padding-bottom: 55px; padding-left: 30px; padding-right: 30px; padding-top: 55px; vertical-align: middle;">
                                                    <table class="text_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:20px;padding-left:25px;padding-right:25px;padding-top:10px;">
                                                                <div style="font-family: sans-serif">
                                                                    <div class style="font-size: 12px; font-family: 'Poppins', Arial, Helvetica, sans-serif; mso-line-height-alt: 18px; color: #ffffff; line-height: 1.5;">
                                                                        <p style="margin: 0; font-size: 14px; text-align: center; mso-line-height-alt: 21px;">¿Sabías que también vendemos impresoras, consumibles y productos de oficina?<br>👉 Descubre todo lo que tenemos para ti.</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="button_block block-2" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div class="alignment" align="center"><a href="https://www.propapel.mx/index.php?route=information/information&information_id=24" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.propapel.mx/index.php?route=information/information&information_id=24"  style="height:57px;width:230px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; Impresoras&nbsp;&nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="button_block block-3" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div class="alignment" align="center"><a href="https://www.propapel.mx/" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="https://www.propapel.mx/"  style="height:57px;width:233px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 35px; padding-right: 35px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; &nbsp; Otros productos&nbsp; &nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="button_block block-4" width="100%" border="0" cellpadding="10" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad">
                                                                <div class="alignment" align="center"><a href="http://www.example.com/" target="_blank" style="color:#ffffff;text-decoration:none;"><!--[if mso]>
<v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word"  href="http://www.example.com/"  style="height:57px;width:229px;v-text-anchor:middle;" arcsize="48%" fillcolor="#00388c">
<v:stroke dashstyle="Solid" weight="2px" color="#795E8B"/>
<w:anchorlock/>
<v:textbox inset="0px,0px,0px,0px">
<center dir="false" style="color:#ffffff;font-family:sans-serif;font-size:18px">
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: 'Poppins', Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>Cookie Policy</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="paragraph_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:25px;padding-top:20px;">
                                                                <div style="color:#ffffff;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;text-align:center;mso-line-height-alt:24px;">
                                                                    <p style="margin: 0; word-break: break-word;">Si tienes alguna duda, no dudes en <a href="mailto:ventassai@propapel.com.mx" target="_blank" title="ventassai@propapel.com.mx" style="text-decoration: underline; color: #ffffff;" rel="noopener">contactarnos</a>. Estamos para ayudarte.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                                <td class="column column-2" width="41.666666666666664%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; background-color: #d38b00; padding-bottom: 5px; padding-top: 5px; vertical-align: middle;">
                                                    <table class="image_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;">
                                                        <tr>
                                                            <td class="pad" style="width:100%;padding-right:0px;padding-left:0px;">
                                                                <div class="alignment" align="center">
                                                                    <div style="max-width: 270.833px;"><img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/zik/fdi/hdb/ChatGPT_Image_21_jul_2025__13_01_18-removebg-preview.png" style="display: block; height: auto; border: 0; width: 100%;" width="270.833" alt title height="auto"></div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                    <table class="row row-6" align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #0017a0;">
                        <tbody>
                            <tr>
                                <td>
                                    <table class="row-content stack" align="center" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; color: #000000; width: 650px; margin: 0 auto;" width="650">
                                        <tbody>
                                            <tr>
                                                <td class="column column-1" width="100%" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; vertical-align: top;">
                                                    <table class="paragraph_block block-1" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:20px;padding-left:10px;padding-right:10px;padding-top:15px;">
                                                                <div style="color:#b0a7b7;font-family:'Poppins', Arial, Helvetica, sans-serif;font-size:12px;line-height:1.5;text-align:center;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0;">ServiceDesk | Departamento de SAI | Área de Soporte Técnico. <br>© Propapel 2025. Todos los derechos reservados.</p>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </td>
            </tr>
        </tbody>
    </table><!-- End -->
    <script>
        const stars = document.querySelectorAll('.star');
        const ratingValue = document.getElementById('ratingValue');
        const form = document.getElementById('ratingForm');
        const confirmationMessage = document.getElementById('confirmationMessage');
        const commentInput = document.getElementById('comment');

        const ticketId = ${id}; // ← ID dinámico inyectado por TypeScript

        stars.forEach(star => {
            star.addEventListener('click', () => {
                const value = parseInt(star.getAttribute('data-value'));
                ratingValue.value = value;
                updateStars(value);
            });
        });

        function updateStars(value) {
            stars.forEach(star => {
                const starValue = parseInt(star.getAttribute('data-value'));
                star.classList.toggle('selected', starValue <= value);
            });
        }

        form.addEventListener('submit', function(e) {
                    e.preventDefault();

                    const rating = parseInt(ratingValue.value);
                    const comment = commentInput.value.trim();

                    if (rating === 0) {
                        alert('Por favor, selecciona una calificación antes de enviar.');
                        return;
                    }

                    fetch(\`/ticket/rate/\${ticketId}\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          serviceRating: rating,
          serviceComment: comment
        }),
      })
        .then(response => {
          if (!response.ok) {
            throw new Error('Error al enviar la calificación');
          }
          return response.json();
        })
        .then(() => {
          form.classList.add('disabled');
          stars.forEach(s => s.style.pointerEvents = "none");
          commentInput.disabled = true;
          confirmationMessage.style.display = "block";

          setTimeout(() => {
            if (window.opener || window.close) {
              window.close();
            }
          }, 3000);
        })
        .catch(err => alert(err.message));
    });
    </script>
</body>

</html>
`;
  }

  /**
   * Function to rate a ticket after it has been resolved
   *
   * @param id The ID of the ticket to rate
   * @param dto The DTO containing the rating information
   * @returns
   */
  async rateTicket(id: number, dto: RateTicketDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
    });

    if (!ticket) throw new Error('Ticket no encontrado');
    if (!ticket.resolved) throw new Error('El ticket aún no ha sido resuelto');
    if (ticket.serviceRating !== null && ticket.serviceRating !== undefined) {
      throw new Error('Este ticket ya fue calificado');
    }

    ticket.serviceRating = dto.serviceRating;
    ticket.serviceComment = dto.serviceComment || '';

    await this.ticketRepository.save(ticket);

    return {
      message: 'Calificación registrada correctamente',
    };
  }

  /**
   * Function to upload a pdf to a ticket
   *
   * @param id The ID of the ticket to upload the PDF
   * @param pdf The base64 encoded PDF string
   */
  async uploadPdfService(id: number, pdf: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: id },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    if (pdf && pdf.trim() !== '') {
      const buffer = Buffer.from(pdf, 'base64');
      const pathPdf = `pdf_service_Ticket${id}_${Date.now()}`;
      const pdfUrl = await storage.uploadFromBuffer(
        buffer,
        pathPdf,
        'application/pdf',
      );

      if (pdfUrl) {
        ticket.pdfPageService = pdfUrl; // Guarda la URL de la imagen
      }
    } else {
      throw new HttpException(
        'PDF page service is required',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.ticketRepository.save(ticket);
  }

  /**
   * Fuction to upload an image of service to a ticket
   *
   * @param id The ID of the ticket to upload the image
   * @param image The base64 encoded image string
   */
  async uploadImageService(id: number, image: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: id },
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    if (image && image.trim() !== '') {
      const buffer = Buffer.from(image, 'base64');
      const pathPdf = `image_service_Ticket${id}_${Date.now()}`;
      const imageResult = await storage.uploadFromBuffer(
        buffer,
        pathPdf,
        'image/png',
      );

      if (imageResult) {
        ticket.imagePageService = imageResult; // Guarda la URL de la imagen
      }
    } else {
      throw new Error('PDF page service is required');
    }
    await this.ticketRepository.save(ticket);
  }

  /**
   * Function to unmark a ticket as foreign
   *
   * @param id The ID of the ticket to unmark as foreign
   * @throws {HttpException} If the ticket is not found
   */
  async unmarkAsForeign(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: id },
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    ticket.isForeign = false;
    await this.ticketRepository.save(ticket);
  }

  /**
   * Function to mark a ticket as foreign
   *
   * @param id The ID of the ticket to mark as foreign
   * @throws {HttpException} If the ticket is not found
   */
  async markAsForeign(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: id },
    });
    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    ticket.isForeign = true;
    await this.ticketRepository.save(ticket);
  }

  /**
   * Fuction to update a ticket
   * @param id The ID of the ticket to update
   * @param updateTicketDto The DTO containing the updated ticket information
   * @return {Promise<void>} A promise that resolves when the ticket is updated
   * @throws {HttpException} If the ticket is not found
   */
  async update(id: number, updateTicketDto: UpdateTicketDto) {
    const ticketFound = await this.ticketRepository.findOne({
      where: {
        id: id,
      },
    });

    if (!ticketFound) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    ticketFound.nameCommercial = updateTicketDto.nameCommercial;
    ticketFound.nameReported = updateTicketDto.nameReported;
    ticketFound.apartamentReport = updateTicketDto.apartamentReport;
    ticketFound.phoneReport = updateTicketDto.phoneReport;
    ticketFound.emailReport = updateTicketDto.emailReport;
    ticketFound.reasonReport = updateTicketDto.reasonReport;
    ticketFound.location = updateTicketDto.location;

    return this.ticketRepository.save(ticketFound);
  }

  /**
   * Fuction to delete a ticket
   *
   * @param ticketId The ID to ticket delete
   */

  async deleteTicket(ticketId: number) {
    const ticketFound = await this.ticketRepository.findOne({
      where: {
        id: ticketId,
      },
    });

    if (!ticketFound) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
    ticketFound.isDelete = true;

    return this.ticketRepository.save(ticketFound);
  }
  /**
   * Function to add a comment to a ticket
   *
   * @param addCommentTicketDto The DTO containing the comment information
   * @throws {HttpException} If the ticket or user is not found
   * @throws {HttpException} If the user is not found
   * @returns
   */
  async addComment(addCommentTicketDto: AddCommentTicketDto) {
    console.log("ENTRE ")
    const { ticketId, userId, comment: content, imageUrl: base64Image, isInternal } = addCommentTicketDto;

    // 1. Validar existencia del Ticket
    const ticketFound = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticketFound) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    // 2. Validar existencia del Usuario
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    // 3. Procesar Imagen (si existe)
    let finalImageUrl = '';
    if (base64Image && base64Image.trim() !== '') {
      try {
        const buffer = Buffer.from(base64Image, 'base64');
        const fileName = `comment_img_${userId}_T${ticketId}_${Date.now()}.png`;

        // Asumiendo que storage es tu utilidad de Firebase/S3
        const imageResult = await storage.uploadFromBuffer(
          buffer,
          fileName,
          'image/png',
        );

        if (imageResult) {
          finalImageUrl = imageResult;
        }
      } catch (error) {
        console.error('Error al subir imagen de comentario:', error);
        // Opcional: lanzar error o continuar sin imagen
      }
    }

    // 4. Crear y guardar el Comentario
    const newComment = this.ticketCommentRepository.create({
      ticket: ticketFound,
      author: user,
      content: content,
      imageUrl: finalImageUrl,
      isInternal: isInternal
    });

    await this.ticketCommentRepository.save(newComment);

    const fullTicket = await this.ticketRepository
      .createQueryBuilder('ticket')
      .leftJoinAndSelect('ticket.createdBy', 'createdBy')
      .leftJoinAndSelect('ticket.assigmentsTechnical', 'assigmentsTechnical')
      .leftJoinAndSelect('ticket.updates', 'updates')
      .leftJoinAndSelect('ticket.comments', 'comments')
      .leftJoinAndSelect('ticket.sucursal', 'sucursal')
      .leftJoinAndSelect('comments.author', 'commentAuthor')
      .leftJoinAndSelect('ticket.cliente', 'cliente')
      .leftJoinAndSelect('ticket.typeOfReportEntity', 'typeOfReportEntity')
      .leftJoinAndSelect('ticket.equipo', 'equipo')
      .where('ticket.id = :ticketId', { ticketId })
      .getOne();
    this.socketGateway.emitTicketUpdated(fullTicket);
    return fullTicket;
  }
  async sendPageService(id: number) {
    const ticketFound = await this.ticketRepository.findOne({
      where: {
        id: id,
      },
    });
    if (!ticketFound) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }
  }
  async checkStatusTicket(id: string) {
    const ticket = await this.ticketRepository.findOne({
      where: { statusToken: id, isDelete: false },
      relations: [
        'createdBy',
        'assigmentsTechnical',
        'updates',
        'comments',
        'comments.author',
        'cliente',
        'equipo',
        'sucursal',
      ],
    });

    if (!ticket) {
      return ERROR_FOUND_TICKET;
    }

    const steps = this.getProgressSteps(ticket.status);
    const numberContact = ticket.sucursal.numberContact;

    const resolvedMessage = ticket.status === TicketStatus.RESUELTO
      ? `<div class="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 font-semibold flex items-center justify-center gap-3 shadow-sm">
           <i class="fa-solid fa-circle-check text-2xl"></i> ¡El ticket ha sido resuelto exitosamente!
         </div>`
      : '';

    const resolveDate = ticket.status === TicketStatus.RESUELTO && ticket.resolvedAt
      ? `<div class="flex flex-col"><span class="text-xs text-slate-500 uppercase tracking-wider font-bold">Fecha de resolución</span><span class="text-slate-800 font-medium">${ticket.resolvedAt.toLocaleDateString()}</span></div>`
      : '';

    const technicalAssignment = (ticket.status === TicketStatus.ASIGNADO || ticket.status === TicketStatus.EN_PROCESO || ticket.status === TicketStatus.EN_ESPERA || ticket.status == TicketStatus.ON_SITE || ticket.status == TicketStatus.IN_REMOTE)
      ? `<div class="flex flex-col"><span class="text-xs text-slate-500 uppercase tracking-wider font-bold">Técnico(s) asignado(s)</span><span class="text-slate-800 font-medium">${ticket.assigmentsTechnical.map((tech) => tech.name + ' ' + tech.lastname).join(', ')}</span></div>`
      : '';

    const reportAttentInPlace = ((ticket.status === TicketStatus.EN_PROCESO && ticket.attentionType == TicketAttentionType.EN_SITIO) || ticket.status == TicketStatus.ON_SITE)
      ? `<div class="mt-4 p-4 bg-blue-50 rounded-xl text-blue-800 text-sm border border-blue-100 flex items-center gap-4"><i class="fa-solid fa-truck-fast text-2xl text-blue-500"></i> El técnico se encuentra en camino para atender el reporte en sitio.</div>`
      : '';

    const reportAttentRemote = ticket.status == TicketStatus.IN_REMOTE
      ? `<div class="mt-4 p-4 bg-purple-50 rounded-xl text-purple-800 text-sm border border-purple-100 flex items-center gap-4"><i class="fa-solid fa-headset text-2xl text-purple-500"></i> El técnico está atendiendo su reporte de manera remota.</div>`
      : '';

    const reportOnPause = ticket.status === TicketStatus.EN_ESPERA
      ? `<div class="mt-4 p-4 bg-amber-50 rounded-xl text-amber-800 text-sm border border-amber-100 flex items-center gap-4"><i class="fa-solid fa-pause text-2xl text-amber-500"></i> El ticket se encuentra actualmente en espera.</div>`
      : '';

    const fechaSolicitud = ticket.createdAt;
    const fechaResolucion = ticket.resolvedAt;
    const tiempoLaboral = this.calcularTiempoLaboralRelativo(fechaSolicitud, fechaResolucion);

    const timeResolution = tiempoLaboral !== ''
      ? `<div class="flex flex-col"><span class="text-xs text-slate-500 uppercase tracking-wider font-bold">Tiempo de resolución</span><span class="text-slate-800 font-medium">${tiempoLaboral}</span></div>`
      : '';

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Seguimiento de Ticket ${ticket.ticketNumber}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="shortcut icon" href="https://1.bp.blogspot.com/-rK4-Xp5tY_U/X_4ZjWc4cqI/AAAAAAAABbQ/HYMo-KaYvOwAUV0ZD0ORfD6NOrF-KRr0wCLcBGAsYHQ/s1431/Propapel-logo.png" type="image/png" />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Outfit', sans-serif; }
    .glass-card {
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    }
    @keyframes blob {
      0% { transform: translate(0px, 0px) scale(1); }
      33% { transform: translate(30px, -50px) scale(1.1); }
      66% { transform: translate(-20px, 20px) scale(0.9); }
      100% { transform: translate(0px, 0px) scale(1); }
    }
    .animate-blob { animation: blob 7s infinite; }
    .animation-delay-2000 { animation-delay: 2s; }
    .animation-delay-4000 { animation-delay: 4s; }
    .step-active { animation: pulseBorder 2s infinite; }
    @keyframes pulseBorder {
      0% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0.4); }
      70% { box-shadow: 0 0 0 10px rgba(79, 70, 229, 0); }
      100% { box-shadow: 0 0 0 0 rgba(79, 70, 229, 0); }
    }
    .whatsapp-float {
        animation: float-btn 3s ease-in-out infinite;
    }
    @keyframes float-btn {
        0% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
        100% { transform: translateY(0); }
    }
  </style>
</head>
<body class="bg-slate-900 min-h-screen flex text-left p-4 sm:p-8 relative overflow-x-hidden">
  
  <div class="fixed top-0 left-0 w-[500px] h-[500px] bg-purple-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob"></div>
  <div class="fixed top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-2000"></div>
  <div class="fixed -bottom-20 left-20 w-[500px] h-[500px] bg-pink-600 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 animate-blob animation-delay-4000"></div>

  <div class="glass-card w-full max-w-3xl mx-auto rounded-[2rem] overflow-hidden relative z-10 border border-white/20 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/20 self-start">
    
    <div class="bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
      <div>
        <h1 class="text-3xl sm:text-4xl font-bold tracking-tight text-slate-800">
          Ticket <span class="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">#${ticket.ticketNumber}</span>
        </h1>
        <p class="text-slate-500 mt-2 flex items-center justify-center sm:justify-start gap-2 text-sm md:text-base">
          <i class="fa-solid fa-building"></i> ${ticket.cliente?.razonSocial || 'Cliente General'}
        </p>
      </div>
      <div class="shrink-0 bg-white p-3 rounded-2xl shadow-sm border border-slate-100 text-center">
         <img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/i6a/nv1/gin/Propapel-logo%20%281%29.png" alt="Propapel" class="h-10 sm:h-12 w-auto object-contain mx-auto">
      </div>
    </div>

    <div class="p-6 sm:p-8">
      
      <div class="grid grid-cols-2 md:grid-cols-4 gap-6 p-6 bg-slate-50/80 rounded-2xl border border-slate-100/80 backdrop-blur-sm text-left">
        <div class="flex flex-col">
          <span class="text-xs text-slate-500 uppercase tracking-wider font-bold">Fecha Solicitud</span>
          <span class="text-slate-800 font-medium">${ticket.createdAt.toLocaleDateString()}</span>
        </div>
        ${technicalAssignment}
        ${resolveDate}
        ${timeResolution}
      </div>

      <div class="my-6">
        ${reportAttentInPlace}
        ${reportAttentRemote}
        ${reportOnPause}
      </div>

      <div class="mt-12 mb-8 bg-white p-6 sm:p-8 rounded-3xl border border-slate-100 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)]">
        <h3 class="text-xs sm:text-sm font-bold text-slate-400 uppercase tracking-widest mb-10 text-center">Progreso del Servicio</h3>
        <div class="relative flex justify-between items-center w-full px-2 lg:px-6">
          
          <div class="absolute left-6 right-6 top-[28px] sm:top-[32px] h-1.5 bg-slate-100 rounded-full z-0 overflow-hidden hidden sm:block"></div>
          
          ${Object.values(steps).map((step: any) => `
            <div class="relative z-10 flex flex-col items-center group flex-1">
              <div class="w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-full text-2xl shadow-md transition-all duration-300 
                ${step.class === 'done' ? 'bg-gradient-to-br from-green-400 to-green-600 text-white shadow-green-500/40' :
        step.class === 'active' ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white step-active' :
          'bg-white text-slate-300 border-2 border-slate-200'}">
                ${step.icon}
              </div>
              <span class="mt-4 text-xs sm:text-sm text-center ${step.class === 'active' || step.class === 'done' ? 'font-bold text-slate-800' : 'font-medium text-slate-400'}">
                ${step.label}
              </span>
            </div>
          `).join('')}
        </div>
      </div>

      ${resolvedMessage}

    </div>

    <div class="bg-slate-900 border-t border-slate-800 p-8 text-center relative overflow-hidden">
      <div class="absolute inset-0 bg-gradient-to-r from-indigo-900/50 to-purple-900/50 mix-blend-overlay"></div>
      
      <div class="relative z-10">
        <h4 class="text-white text-lg font-medium mb-6">¿Necesitas suministros para tu oficina?</h4>
        <div class="flex flex-wrap justify-center gap-4">
          <a href="https://www.propapel.mx" target="_blank" class="px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 text-sm font-bold rounded-full transition-all shadow-lg hover:shadow-white/20 flex items-center gap-2 transform hover:-translate-y-0.5">
            <i class="fa-solid fa-print text-indigo-600"></i> Impresoras
          </a>
          <a href="https://www.propapel.mx" target="_blank" class="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 rounded-full transition-all flex items-center gap-2 transform hover:-translate-y-0.5">
            <i class="fa-solid fa-box-open"></i> Ver catálogo
          </a>
        </div>
        <p class="mt-8 text-slate-500 text-xs tracking-wide">ServiceDesk | SAI | Área de Soporte Técnico &copy; Propapel 2026</p>
      </div>
    </div>
  </div>

  <a href="https://wa.me/${numberContact}?text=Hola,%20necesito%20ayuda%20con%20mi%20ticket%20%23${ticket.ticketNumber}" target="_blank" 
     class="fixed bottom-6 right-6 w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center text-3xl shadow-[0_8px_30px_rgba(37,211,102,0.4)] hover:shadow-[0_15px_40px_rgba(37,211,102,0.6)] z-50 whatsapp-float transform transition-transform hover:scale-110">
    <i class="fa-brands fa-whatsapp"></i>
  </a>
</body>
</html>
  `;
  }




  getProgressSteps(status: TicketStatus) {
    const steps = {
      creado: { class: '', icon: '📝', label: 'Creado' },
      asignado: { class: '', icon: '👷‍♂️', label: 'Asignado' },
      enProceso: { class: '', icon: '⚙️', label: 'En Proceso' },
      resuelto: { class: '', icon: '✅', label: 'Resuelto' },
    };

    switch (status) {
      case TicketStatus.SIN_ASIGNAR:
        steps.creado.class = 'active';
        break;
      case TicketStatus.IN_REMOTE:
      case TicketStatus.ON_SITE:
        steps.creado.class = 'done';
        steps.asignado.class = 'done';
        steps.enProceso.class = 'active';
        break;
      case TicketStatus.RESUELTO:
        steps.creado.class = 'done';
        steps.asignado.class = 'done';
        steps.enProceso.class = 'done';
        steps.resuelto.class = 'active';
        break;
    }

    return steps;
  }

  private async notifyTechnicians(branchId: number, ticket: Ticket) {
    try {
      const technicians = await this.userRepository
        .createQueryBuilder('user')
        .innerJoin('user.sucursales', 'sucursal')
        .innerJoin('user.roles', 'rol')
        .where('sucursal.id = :branchId', { branchId })
        .andWhere('rol.id = :roleId', { roleId: 5 })
        .andWhere('user.id != :creatorId', { creatorId: ticket.createdBy?.id || 0 })
        .andWhere('user.fcmToken IS NOT NULL')
        .andWhere('user.isDelete = false')
        .getMany();

      const tokens = technicians.map((tech) => tech.fcmToken).filter(token => token !== '');

      if (tokens.length > 0) {
        await this.firebaseService.sendMulticastNotification(
          tokens,
          '¡Nuevo Ticket Creado!',
          `Se ha creado el ticket #${ticket.ticketNumber} en la sucursal de tu área.`,
          { ticketId: ticket.id.toString(), type: 'NEW_TICKET' }
        );
      }
    } catch (error) {
      console.error('Error al notificar a los técnicos:', error);
    }
  }

  /**
   * KPI de técnicos por sucursal.
   * Devuelve cuántos tickets ha atendido cada técnico en la sucursal,
   * filtrado por año y opcionalmente por mes o semana ISO.
   */
  async getTechnicianKpiByBranch(
    branchId: number,
    year: number,
    month?: number,
    week?: number,
  ) {
    const qb = this.ticketRepository
      .createQueryBuilder('ticket')
      .innerJoin('ticket.assigmentsTechnical', 'technician')
      .innerJoin('ticket.sucursal', 'sucursal')
      .select('technician.id', 'technicianId')
      .addSelect('technician.name', 'technicianName')
      .addSelect('COUNT(DISTINCT ticket.id)', 'totalTickets')
      .addSelect(
        `SUM(CASE WHEN ticket.status = 'RESUELTO' THEN 1 ELSE 0 END)`,
        'resolved',
      )
      .addSelect(
        `SUM(CASE WHEN ticket.status = 'EN_PROCESO' THEN 1 ELSE 0 END)`,
        'inProgress',
      )
      .addSelect(
        `SUM(CASE WHEN ticket.status = 'EN_ESPERA' THEN 1 ELSE 0 END)`,
        'onHold',
      )
      .addSelect(
        `SUM(CASE WHEN ticket.status = 'ASIGNADO' THEN 1 ELSE 0 END)`,
        'assigned',
      )
      .addSelect(
        `ROUND(AVG(CASE WHEN ticket.serviceRating IS NOT NULL THEN ticket.serviceRating END), 2)`,
        'avgRating',
      )
      .where('sucursal.id = :branchId', { branchId })
      .andWhere('ticket.isDelete = :isDelete', { isDelete: false })
      .andWhere('YEAR(ticket.createdAt) = :year', { year });

    if (month) {
      qb.andWhere('MONTH(ticket.createdAt) = :month', { month });
    }

    if (week) {
      // WEEK(date, 3) usa ISO 8601 (lunes como primer día de la semana)
      qb.andWhere('WEEK(ticket.createdAt, 3) = :week', { week });
    }

    qb.groupBy('technician.id')
      .addGroupBy('technician.name')
      .orderBy('totalTickets', 'DESC');

    const raw = await qb.getRawMany();

    return {
      branchId,
      year,
      ...(month ? { month } : {}),
      ...(week ? { week } : {}),
      technicians: raw.map((r) => ({
        id: Number(r.technicianId),
        name: r.technicianName,
        totalTickets: Number(r.totalTickets),
        resolved: Number(r.resolved),
        inProgress: Number(r.inProgress),
        onHold: Number(r.onHold),
        assigned: Number(r.assigned),
        avgRating: r.avgRating ? Number(r.avgRating) : null,
      })),
    };
  }
}
