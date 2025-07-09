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
        'cliente',
        'equipo',
      ],
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
        'cliente',
        'equipo',
      ],
    });
    return ticket;
  }

  async findMyTicketsCreated(id: number){
    const tickets = await this.ticketRepository.find({
      where: {
         createdBy: {
           id: id
         }
      },
         relations: [
        'createdBy',
        'assigmentsTechnical',
        'updates',
        'comments',
        'cliente',
        'equipo',
      ],
    })

    
    if (!tickets) {
      throw new HttpException(
        'No hay tickets',
        HttpStatus.NOT_FOUND,
      );
    }

    return tickets
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
        'cliente',
        'equipo',
      ],
    });

    if (!tickets) {
      throw new HttpException(
        'No hay tickets',
        HttpStatus.NOT_FOUND,
      );
    }

    return tickets
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

  async closeTicket(ticketId: number, closeTicketDto: CloseTicketDto) {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['createdBy', 'assigmentsTechnical'],
    });
    if (!ticket) {
      throw new Error('Ticket not found');
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
    } else {
      throw new Error('PDF page service is required');
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

  update(id: number, updateTicketDto: UpdateTicketDto) {
    return `This action updates a #${id} ticket`;
  }

  remove(id: number) {
    return `This action removes a #${id} ticket`;
  }
}
