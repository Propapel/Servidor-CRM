import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
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
import storage = require('../utils/cloud_storage.js');
import { MailService } from 'src/auth/service/MailService';
import { CloseTicketDto } from './dto/close_ticket.dto';
import { RateTicketDto } from './dto/rating_ticket_resolved.dto';
import { v4 as uuidv4 } from 'uuid';
import { AddCommentTicketDto } from './dto/add_comment_ticket.dto';
import { TicketComment } from 'src/ticket-comment/entities/ticket-comment.entity';
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
    const user = await this.userRepository.findOneBy({
      id: createTicketDto.userCreated,
    });
    if (!user)
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);

    // 2. Buscar cliente
    const client = await this.clientRepository.findOneBy({
      id: createTicketDto.clientId,
    });
    if (!client)
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);

    // 3. Buscar equipo
    // 3. Buscar equipo (si existe)
    let equipo: Itequipment | null = null;
    if (createTicketDto.itequipId) {
      equipo = await this.itequipRepository.findOneBy({
        id: createTicketDto.itequipId,
      });
    }

    const newListFiles = [];

    //Upload files
    if (createTicketDto.files && createTicketDto.files.length > 0) {
      for (let i = 0; i < createTicketDto.files.length; i++) {
        const attachment = createTicketDto.files[i];
        const buffer = Buffer.from(attachment, 'base64');
        const pathFile = `fileActivity${createTicketDto.clientId}_${Date.now()}`;
        const fileUrl = await storage(buffer, pathFile, 'image/png');
        if (fileUrl) {
          newListFiles.push(fileUrl);
        }
      }
    }

    // 4. Crear ticket
    const ticket = this.ticketRepository.create({
      createdBy: user,
      nameReported: createTicketDto.nameReported,
      apartamentReport: createTicketDto.apartamentReport,
      reasonReport: createTicketDto.reasonReport,
      location: createTicketDto.location,
      files: newListFiles,
      phoneReport: createTicketDto.phoneReport,
      emailReport: createTicketDto.emailReport,
      status: createTicketDto.status,
      typeOfReport: createTicketDto.typeOfReport,
      cliente: client,
      equipo: equipo ?? null,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // 5. Crear registro en historial
    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.CREATED,
      ticket: savedTicket,
    });

    await this.ticketUpdateRepository.save(updateReport);

    await this.mailService.sendEmailCreatedReport(
      user.name,
      savedTicket.id,
      user.email,
      savedTicket.createdAt.toLocaleDateString(),
      savedTicket.location,
      savedTicket.reasonReport,
    );

    if (savedTicket.nameReported.trim() !== '') {
      await this.mailService.sendEmailCreatedReport(
        savedTicket.nameReported,
        savedTicket.id,
        savedTicket.emailReport,
        savedTicket.createdAt.toLocaleDateString(),
        savedTicket.location,
        savedTicket.reasonReport,
      );
    }

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

    await this.mailService.sendEmailOnProgressTicket(
      ticket.createdBy.name,
      ticket.id,
      ticket.createdBy.email,
      ticket.createdAt.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      ticket.assigmentsTechnical.map((tech) => tech.name).join(', '),
    );

    await this.ticketUpdateRepository.save(updateReport);
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

    ticket.assigmentsTechnical = technicians;
    ticket.attentionType = assigmentsTechnical.ticketAttentionType;
    ticket.status = TicketStatus.ASIGNADO;
    const updatedTicket = await this.ticketRepository.save(ticket);

    const updateReport = this.ticketUpdateRepository.create({
      action: TicketAction.ASSIGNED,
      ticket: updatedTicket,
    });

    await this.mailService.sendEmailTechnicalAssignReport(
      ticket.createdBy.name,
      ticket.id,
      ticket.createdBy.email,
      ticket.createdAt.toLocaleDateString(),
      ticket.location,
      ticket.reasonReport,
      technicians.map((tech) => tech.name).join(', '),
    );

    await this.ticketUpdateRepository.save(updateReport);
  }

  async closeTicket(ticketId: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
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

    // Calcular días de resolución
    // Calcular días de resolución
    const fechaSolicitud = new Date(ticket.createdAt);
    const fechaResolucion = new Date(ticket.resolvedAt);
    const dias = Math.ceil(
      (fechaResolucion.getTime() - fechaSolicitud.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // Enviar correo
    await this.mailService.closeTicketEmail(
      ticket.createdBy.name,
      ticket.id,
      ticket.createdBy.email,
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
      return '<h2 style="text-align:center;color:red;margin-top:3rem;">Token inválido o calificación no disponible.</h2>';
    }

    if (ticket.serviceRating != null) {
      return '<h2 style="text-align:center;color:orange;margin-top:3rem;">Este ticket ya ha sido calificado.</h2>';
    }

    const id = ticket.id; // para insertar en el JavaScript
    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>Califica el Servicio - Propapel</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
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
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
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
  </style>
</head>
<body>
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
      <input type="hidden" name="rating" id="ratingValue" value="0"/>
      <button type="submit">Enviar calificación</button>
    </form>

    <div id="confirmationMessage" class="confirmation" style="display: none;">
      ¡Gracias! Tu calificación ha sido registrada. Puedes cerrar esta pestaña.
    </div>
  </div>

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

    form.addEventListener('submit', function (e) {
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

    ticketFound.nameReported = updateTicketDto.nameReported;
    ticketFound.apartamentReport = updateTicketDto.apartamentReport;
    ticketFound.phoneReport = updateTicketDto.phoneReport;
    ticketFound.emailReport = updateTicketDto.emailReport;
    ticketFound.reasonReport = updateTicketDto.reasonReport;
    ticketFound.location = updateTicketDto.location;

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

  remove(id: number) {
    return `This action removes a #${id} ticket`;
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
  async checkStatusTicket(id: number) {
    const ticket = await this.ticketRepository.findOne({
      where: { id },
      relations: ['cliente'],
    });

    if (!ticket) {
      throw new HttpException('Ticket no encontrado', HttpStatus.NOT_FOUND);
    }

    const steps = this.getProgressSteps(ticket.status);

    const resolvedMessage =
      ticket.status === TicketStatus.RESUELTO
        ? `<div style="text-align: center; margin-top: 30px; padding: 15px; background: #E8F5E9; border-radius: 8px; color: #2E7D32; font-weight: bold;">
          ✅ ¡Tu ticket ha sido resuelto!
        </div>`
        : '';

    const resolveDate =
      ticket.status === TicketStatus.RESUELTO && ticket.resolvedAt
        ? `<p><strong>Fecha de resolución:</strong> ${ticket.resolvedAt.toLocaleDateString()}</p>`
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
  <html lang="es">
  <head>
    <meta charset="UTF-8" />
    <title>Seguimiento de Ticket</title>
        <!--====== Favicon Icon ======-->
    <link rel="shortcut icon" href="https://1.bp.blogspot.com/-rK4-Xp5tY_U/X_4ZjWc4cqI/AAAAAAAABbQ/HYMo-KaYvOwAUV0ZD0ORfD6NOrF-KRr0wCLcBGAsYHQ/s1431/Propapel-logo.png" type="image/png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
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
  box-shadow: 0 0 15px rgba(0,0,0,0.08);
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
  box-shadow: 0 4px 10px rgba(0,0,0,0.2);
  z-index: 999;
  transition: background 0.3s;
}

.whatsapp-button:hover {
  background-color: #1ebd5a;
}

    </style>
  </head>
  <body>
    <div class="container">

      <h2>Seguimiento de tu Ticket</h2>

      <p><strong>Número de Ticket:</strong> #${ticket.id}</p>
      <p><strong>Cliente:</strong> ${ticket.cliente?.razonSocial || '---'}</p>
      <p><strong>Fecha de Creación:</strong> ${ticket.createdAt.toLocaleDateString()}</p>
      ${resolveDate}
      ${timeResolution}

      <div class="progress-container">
        <div class="step ${steps.creado}">
          <div class="circle">1</div><p>Creado</p>
        </div>
        <div class="step ${steps.asignado}">
          <div class="circle">2</div><p>Asignado</p>
        </div>
        <div class="step ${steps.enProceso}">
          <div class="circle">3</div><p>En Proceso</p>
        </div>
        <div class="step ${steps.resuelto}">
          <div class="circle">4</div><p>Resuelto</p>
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
