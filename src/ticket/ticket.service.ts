import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { User } from 'src/users/user.entity';
import { In, Like, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketUpdate } from 'src/ticket-updated/entities/ticket-updated.entity';
import { TicketAction } from 'src/ticket-updated/enum/ticket_action_enum';
import { AsignTechnicalDto } from './dto/asign-technical.dto';
import { TicketStatus } from './enum/ticiket_report_status';
import { Client } from 'src/clients/entities/client.entity';
import { Itequipment } from 'src/itequipments/entities/itequipment.entity';
import storage = require('../utils/cloud_storage.js');
import { MailService } from 'src/auth/service/MailService';
import { CloseTicketDto } from './dto/close_ticket.dto';
import { RateTicketDto } from './dto/rating_ticket_resolved.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentTicketDto } from './dto/add_comment_ticket.dto';
import { TicketComment } from 'src/ticket-comment/entities/ticket-comment.entity';
import ERROR_FOUND_TICKET from './web/error_found_ticket';
import ERROR_TICKET_QUALIFIED from './web/error_ticket_qualified';
import { TicketAttentionType } from './enum/ticket_attention_type';
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
    private mailService: MailService,
    @InjectRepository(TicketComment)
    private readonly ticketCommentRepository: Repository<TicketComment>,
  ) {}

  async create(createTicketDto: CreateTicketDto) {
    // 1. Buscar usuario
    const user = await this.userRepository.findOne({
      where: { id: createTicketDto.userCreated,},
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
    let lastTicket = await this.ticketRepository.findOne({
      where: { sucursal: { id: user.sucursales[0].id } },
      order: { id: 'DESC' },
    });

    let ticketId: number;
    if (!lastTicket) {
      // Primera vez para esta sucursal
      ticketId = 1;
    } else {
      ticketId = lastTicket.id + 1;
    }

    // 5. Procesar archivos
    const newListFiles: string[] = [];
    if (createTicketDto.files && createTicketDto.files.length > 0) {
      for (let i = 0; i < createTicketDto.files.length; i++) {
        const attachment = createTicketDto.files[i];
        const buffer = Buffer.from(attachment, 'base64');
        const pathFile = `fileActivity${createTicketDto.clientId}_${Date.now()}`;
        const fileUrl = await storage(buffer, pathFile, 'image/png');
        if (fileUrl) newListFiles.push(fileUrl);
      }
    }



    // 6. Crear ticket con ID manual
    const ticket = this.ticketRepository.create({
      ticketNumber: `${user.sucursales[0].abbreviation}-${ticketId}`,
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

    // 8. Enviar correos (opcional)
    await this.mailService.sendEmailCreatedReport(
      user.name,
      savedTicket.id,
      user.email,
      savedTicket.createdAt.toLocaleDateString(),
      savedTicket.location,
      savedTicket.reasonReport,
    );
    if (savedTicket.nameReported.trim() && savedTicket.emailReport.trim()) {
      await this.mailService.sendEmailToClientStatusTicket(
        savedTicket.nameReported,
        savedTicket.emailReport,
        savedTicket.id,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.statusToken,
      );
    }

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
    const tickets = await this.ticketRepository.find({
      where: { isDelete: false },
      relations: [
        'createdBy',
        'sucursal',
        'createdBy.sucursales',
        'assigmentsTechnical',
        'updates',
        'comments',
        'comments.author',
        'cliente',
        'equipo',
      ],
      order: { createdAt: 'DESC' },
    });

    return tickets
  }

  findAllByBranch(branchId: number) {
    const tickets = this.ticketRepository.find({
      where: {
        sucursal: {
          id: branchId,
        },
        isDelete: false,
      },
      relations: [
        'createdBy',
        'assigmentsTechnical',
        'updates',
        'comments',
        'sucursal',
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

  async findOne(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: [
        'createdBy',
        'assigmentsTechnical',
        'updates',
        'comments',
        'comments.author',
        'cliente',
        'equipo',
      ],
    });
    return ticket;
  }

  async findMyTicketsCreated(id: number) {
    const tickets = await this.ticketRepository.find({
      where: {
        createdBy: {
          id: id,
        },
        isDelete: false,
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
    switch (ticket.status) {
      case TicketStatus.ON_SITE:
        ticket.attentionType = TicketAttentionType.EN_SITIO;
        break;
      case TicketStatus.IN_REMOTE:
        ticket.attentionType = TicketAttentionType.REMOTA;
        break;
      default:
        break;
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

    switch (ticket.status) {
      case TicketStatus.ON_SITE:
        ticket.attentionType = TicketAttentionType.EN_SITIO;
        break;
      case TicketStatus.IN_REMOTE:
        ticket.attentionType = TicketAttentionType.REMOTA;
        break;
      default:
        break;
    }

    ticket.assigmentsTechnical = technicians;
    ticket.status = assigmentsTechnical.statusTicket;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.ASSIGNED,
      ticket: updatedTicket,
    });
    /*

    await this.mailService.sendEmailTechnicalAssignReport(
      ticket.createdBy.name,
      ticket.id,
      ticket.createdBy.email,
      ticket.createdAt.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      technicians.map((tech) => tech.name).join(', '),
    );
*/
    await this.ticketUpdateRepository.save(updateReport);
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
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
    }

    ticket.status = statusTicket;

    await this.ticketRepository.save(ticket);
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
      const imageResult = await storage(buffer, pathPdf, 'image/png');

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
      const pdfUrl = await storage(buffer, pathPdf, 'application/pdf');

      if (pdfUrl) {
        ticket.pdfPageService = pdfUrl; // Guarda la URL de la imagen
      }
    }

    ticket.ratingToken = uuidv4();
    ticket.resolved = true;
    ticket.resolvedAt = new Date().toISOString() as unknown as Date;

    ticket.status = TicketStatus.RESUELTO;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CLOSED,
      ticket: updatedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);

    // Calcular tiempo total de resolución (días, horas, minutos, segundos)
    const fechaSolicitud = new Date(ticket.createdAt);
    const fechaResolucion = new Date(ticket.resolvedAt);
    const dias = Math.ceil(
      (fechaResolucion.getTime() - fechaSolicitud.getTime()) /
        (1000 * 60 * 60 * 24),
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
      dias.toString(),
      ticket.ratingToken,
    );
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
      const pdfUrl = await storage(buffer, pathPdf, 'application/pdf');

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
      const imageResult = await storage(buffer, pathPdf, 'image/png');

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
    const ticketFound = await this.ticketRepository.findOne({
      where: {
        id: addCommentTicketDto.ticketId,
      },
    });

    if (!ticketFound) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    const user = await this.userRepository.findOne({
      where: { id: addCommentTicketDto.userId },
    });

    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    let imageUrl = '';
    if (
      addCommentTicketDto.imageUrl &&
      addCommentTicketDto.imageUrl.trim() !== ''
    ) {
      const buffer = Buffer.from(addCommentTicketDto.imageUrl, 'base64');
      const pathPdf = `image_comment_${addCommentTicketDto.userId}_Ticket${addCommentTicketDto.ticketId}_${Date.now()}`;
      const imageResult = await storage(buffer, pathPdf, 'image/png');

      if (imageResult) {
        imageUrl = imageResult; // Guarda la URL de la imagen
      }
    }

    const comment = this.ticketCommentRepository.create({
      ticket: ticketFound,
      author: user,
      content: addCommentTicketDto.comment,
      imageUrl: imageUrl,
    });

    await this.ticketCommentRepository.save(comment);
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
      ],
    });

    if (!ticket) {
      return ERROR_FOUND_TICKET;
    }

    const steps = this.getProgressSteps(ticket.status);

    const resolvedMessage =
      ticket.status === TicketStatus.RESUELTO
        ? `<div style="text-align: center; margin-top: 30px; padding: 15px; background: #E8F5E9; border-radius: 8px; color: #2E7D32; font-weight: bold;">
        ✅ ¡El ticket ha sido resuelto exitosamente!
      </div>`
        : '';

    const resolveDate =
      ticket.status === TicketStatus.RESUELTO && ticket.resolvedAt
        ? `<p><strong>Fecha de resolución:</strong> ${ticket.resolvedAt.toLocaleDateString()}</p>`
        : '';

    const technicalAssignment =
      ticket.status === TicketStatus.ASIGNADO ||
      ticket.status === TicketStatus.EN_PROCESO || ticket.status === TicketStatus.EN_ESPERA || ticket.status == TicketStatus.ON_SITE || ticket.status == TicketStatus.IN_REMOTE
        ? `<p><strong>Técnico(s) asignado(s):</strong> ${ticket.assigmentsTechnical.map((tech) => tech.name + ' ' + tech.lastname).join(', ')}</p>`
        : '';

    const reportAttentInPlace =
      ticket.status === TicketStatus.EN_PROCESO &&
      ticket.attentionType == TicketAttentionType.EN_SITIO || ticket.status == TicketStatus.ON_SITE
        ? `<p>El técnico se encuentra en camino para atender el reporte en sitio.</p>`
        : '';

    const reportAttentRemote =
      ticket.status == TicketStatus.ON_SITE || ticket.status == TicketStatus.IN_REMOTE
        ? `<p>El técnico está atendiendo su reporte de manera remota.</p>`
        : '';

    const reportOnPause =
      ticket.status === TicketStatus.EN_ESPERA
        ? `<p>El ticket se encuentra actualmente en espera.</p>`
        : '';

    const fechaSolicitud = new Date(ticket.createdAt);
    const fechaResolucion = ticket.resolvedAt
      ? new Date(ticket.resolvedAt)
      : null;
    const dias =
      ticket.status === TicketStatus.RESUELTO && fechaResolucion
        ? Math.ceil(
            (fechaResolucion.getTime() - fechaSolicitud.getTime()) /
              (1000 * 60 * 60 * 24),
          )
        : null;

    const timeResolution =
      dias !== null
        ? `<p><strong>Tiempo de resolución:</strong> ${dias} día${dias !== 1 ? 's' : ''}</p>`
        : '';

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
        * {
            box-sizing: border-box;
        }

        body {
            font-family: Arial, sans-serif;
            background-color: #3131f0ff;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .container {
            max-width: 700px;
            width: 100%;
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.08);
            text-align: center;
        }

        .header-image {
            margin-bottom: 20px;
            text-align: center;
        }

        .header-image img {
            max-width: 150px;
            margin: 0 auto;
        }

        h2 {
            color: #4B0082;
            margin-bottom: 20px;
        }

        p {
            font-size: 15px;
            margin: 6px 0;
        }

        .progress-container {
            display: flex;
            justify-content: space-between;
            position: relative;
            margin: 30px 0;
        }

        .progress-container::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            height: 4px;
            width: 100%;
            background: #ddd;
            z-index: 0;
            transform: translateY(-50%);
        }

        .step {
            position: relative;
            text-align: center;
            z-index: 1;
            flex: 1;
        }

        .circle {
            width: 30px;
            height: 30px;
            border-radius: 50%;
            background: #ddd;
            margin: 0 auto;
            line-height: 30px;
            color: #fff;
            font-weight: bold;
        }

        .step p {
            margin-top: 8px;
            font-size: 14px;
            color: #999;
            font-weight: normal;
        }

        .step.done .circle {
            background: #00C853;
        }

        .step.active .circle {
            background: #4B0082;
        }

        .step.done p,
        .step.active p {
            color: #4B0082;
            font-weight: bold;
        }

        .whatsapp-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            background-color: #25D366;
            color: white;
            padding: 12px 18px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: bold;
            font-size: 14px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
            z-index: 999;
            transition: background 0.3s;
        }

        .whatsapp-button:hover {
            background-color: #1ebd5a;
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
                                                    <div class="container">

                                                        <h2>Seguimiento de tu Ticket</h2>

                                                        <p><strong>Número de Ticket:</strong> #${ticket.id}</p>
                                                        <p><strong>Cliente:</strong> ${ticket.cliente?.razonSocial || '---'}</p>
                                                        <p><strong>Fecha de Creación:</strong> ${ticket.createdAt.toLocaleDateString()}</p>
                                                        ${technicalAssignment}
                                                        ${reportAttentInPlace}
                                                        ${reportAttentRemote}
                                                      
                                                        ${reportOnPause}
                                                        ${resolveDate}
                                                        ${timeResolution}

                                                        <div class="progress-container">
                                                            <div class="step ${steps.creado}">
                                                                <div class="circle">1</div>
                                                                <p>Creado</p>
                                                            </div>
                                                            <div class="step ${steps.asignado}">
                                                                <div class="circle">2</div>
                                                                <p>Asignado</p>
                                                            </div>
                                                            <div class="step ${steps.enProceso}">
                                                                <div class="circle">3</div>
                                                                <p>En Proceso</p>
                                                            </div>
                                                            <div class="step ${steps.resuelto}">
                                                                <div class="circle">4</div>
                                                                <p>Resuelto</p>
                                                            </div>
                                                        </div>
                                                        <div class="header-image">
                                                            <img src="https://bbecbbde2b.imgdist.com/pub/bfra/zigpwtii/zik/fdi/hdb/ChatGPT_Image_21_jul_2025__13_01_18-removebg-preview.png" alt="Soporte">
                                                        </div>
                                                        ${resolvedMessage}

                                                    </div>



                                                    <a href="https://wa.me/5219995769245?text=Hola,%20necesito%20ayuda%20con%20mi%20ticket%20%23${ticket.id}" target="_blank" class="whatsapp-button">
                                                        💬 Contactar por WhatsApp
                                                    </a>
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
                                                                    <div class style="font-size: 12px; font-family: Poppins, Arial, Helvetica, sans-serif; mso-line-height-alt: 18px; color: #ffffff; line-height: 1.5;">
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
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: Poppins, Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; Impresoras&nbsp;&nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
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
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: Poppins, Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 35px; padding-right: 35px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>&nbsp; &nbsp; Otros productos&nbsp; &nbsp;</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
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
<![endif]--><span class="button" style="background-color: #00388c; border-bottom: 2px solid #795E8B; border-left: 2px solid #795E8B; border-radius: 30px; border-right: 2px solid #795E8B; border-top: 2px solid #795E8B; color: #ffffff; display: inline-block; font-family: Poppins, Arial, Helvetica, sans-serif; font-size: 18px; font-weight: undefined; mso-border-alt: none; padding-bottom: 18px; padding-top: 18px; padding-left: 60px; padding-right: 60px; text-align: center; width: auto; word-break: keep-all; letter-spacing: normal;"><span style="word-break: break-word;"><span style="word-break: break-word; line-height: 21.599999999999998px;" data-mce-style>Cookie Policy</span></span></span><!--[if mso]></center></v:textbox></v:roundrect><![endif]--></a></div>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                    <table class="paragraph_block block-5" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;">
                                                        <tr>
                                                            <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:25px;padding-top:20px;">
                                                                <div style="color:#ffffff;font-family:Poppins, Arial, Helvetica, sans-serif;font-size:16px;line-height:1.5;text-align:center;mso-line-height-alt:24px;">
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
                                                                <div style="color:#b0a7b7;font-family:Poppins, Arial, Helvetica, sans-serif;font-size:12px;line-height:1.5;text-align:center;mso-line-height-alt:18px;">
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
</body>

</html>
  `;
  }

  getProgressSteps(status: TicketStatus) {
    switch (status) {
      case TicketStatus.SIN_ASIGNAR:
        return {
          creado: 'active',
          asignado: '',
          enProceso: '',
          resuelto: '',
        };

      case TicketStatus.ASIGNADO:
        return {
          creado: 'done',
          asignado: 'active',
          enProceso: '',
          resuelto: '',
        };

      case TicketStatus.EN_PROCESO:
        return {
          creado: 'done',
          asignado: 'done',
          enProceso: 'active',
          resuelto: '',
        };

      case TicketStatus.RESUELTO:
        return {
          creado: 'done',
          asignado: 'done',
          enProceso: 'done',
          resuelto: 'active',
        };

      default:
        return {
          creado: '',
          asignado: '',
          enProceso: '',
          resuelto: '',
        };
    }
  }
}
