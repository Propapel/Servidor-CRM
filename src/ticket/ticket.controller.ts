import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Res,
  Query,
  Put,
  Sse,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';
import { AsignTechnicalDto } from './dto/asign-technical.dto';
import { CloseTicketDto } from './dto/close_ticket.dto';
import { Response } from 'express';
import { RateTicketDto } from './dto/rating_ticket_resolved.dto';
import { User } from 'src/users/user.entity';
import { AddCommentTicketDto } from './dto/add_comment_ticket.dto';
import { TicketStatus } from './enum/ticiket_report_status';
import { map, Observable, retry } from 'rxjs';
import { Ticket } from './entities/ticket.entity';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Post('closeTicketWithPdf/:id')
  @UseInterceptors(FileInterceptor('file'))
  async closeTicketPDF(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    console.log('Archivo recibido:', file.originalname, file.size);

    return this.ticketService.closeTicketWithFile(file, id);
  }


  /*
  @Sse('stream/:branchId')
  streamTickets(@Param('branchId', ParseIntPipe) branchId: number): Observable<MessageEvent> {
    return this.ticketService.getTicketStream(branchId).pipe(
      map((tickets: Ticket[]) => ({ data: tickets } as MessageEvent)),
    );
  }

   */
  @UseGuards(AccessTokenGuard)
  @Post('markAsForeign/:id')
  checkUser(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.markAsForeign(id);
  }

  @UseGuards(AccessTokenGuard)
  @Post('unmarkAsForeign/:id')
  uncheckUser(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.unmarkAsForeign(id);
  }

  @Get('checkStatus/:id')
  checkStatusTicket(@Param('id') id: string) {
    return this.ticketService.checkStatusTicket(id);
  }

  @Post('pausedTicket/:id')
  pausedTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { reasonPause: string },
  ) {
    return this.ticketService.onPauseTicket(id, body.reasonPause);
  }

  @UseGuards(AccessTokenGuard)
  @Post('sendPageService/:id')
  sendPageService(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.sendPageService(id);
  }

  /**
   * Function to find all tickets assigned to a specific technical
   *
   * @param id The ID of the ticket to retrieve assignments for
   * @returns A list of ticcket assignments for the specified technical.
   */
  @UseGuards(AccessTokenGuard)
  @Get('technical/assigments/:id')
  findMyTicketAssignment(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findTicketAssigments(id);
  }

  /**
   * Function to mark a ticket as in progress for the technical
   *
   * @param id The ID of the ticket to mark as in progress for the technical
   * @returns A confirmation message indicating the ticket has been marked as in progress for the technical
   */
  @UseGuards(AccessTokenGuard)
  @Post('technical/onProgressTicket/:id')
  markWithOnProgressTicket(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.inProgressReport(id);
  }

  /**
   * Function to add a comment to a ticket
   * @param addCommentTicketDto The DTO containing the comment information
   *
   */
  @UseGuards(AccessTokenGuard)
  @Post('addComment')
  addComment(@Body() addCommentTicketDto: AddCommentTicketDto) {
    return this.ticketService.addComment(addCommentTicketDto);
  }

  /**
   * Function to find tickets created by a specific user
   *
   * @param id The ID of the user whose tickets are to be retrieved
   * @returns A list of tickets created by the user
   */
  @UseGuards(AccessTokenGuard)
  @Get('findMyTicketsCreated/:id')
  findMyTicketsCreated(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findMyTicketsCreated(id);
  }

  /**
   * Fuction to create a new ticket
   *
   * @param createTicketDto The DTO containing the ticket creation data
   * @returns The created ticket
   */
  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  /**
   * The function to upload an image service for a ticket
   *
   * @param id The ID of the ticket
   * @param body The body containing the image data
   * @returns The result of the upload operation
   */
  @UseGuards(AccessTokenGuard)
  @Post('uploadImageService/:id')
  uploadImageService(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { image: string },
  ) {
    return this.ticketService.uploadImageService(id, body.image);
  }

  /**
   * Function to upload a PDF service page for a ticket
   *
   * @param id The ID of the ticket
   * @param body The body containing the PDF data
   * @returns The result of the upload operation
   */
  @UseGuards(AccessTokenGuard)
  @Post('uploadPdfService/:id')
  uploadPdfService(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { pdf: string },
  ) {
    return this.ticketService.uploadPdfService(id, body.pdf);
  }

  /**
   * Function to retrieve all tickets
   *
   * @returns A list of all tickets
   */
  @UseGuards(AccessTokenGuard)
  @Get()
  findAll() {
    return this.ticketService.findAll();
  }

  /**
   * Function to qualify a ticket by token
   *
   * @param token The token used to qualify the ticket
   * @param res The response object to send the HTML content
   */
  @Get('qualifyTicket')
  async qualifyTicket(@Query('token') token: string, @Res() res: Response) {
    const html = await this.ticketService.qualifyServiceByToken(token);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  /**
   * Function to rate a ticket
   *
   * @param id The ID of the ticket to be rated
   * @param dto The DTO containing the rating data
   * @returns A confirmation message indicating the ticket has been rated
   */
  @Post('rate/:id')
  async rateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateTicketDto,
  ) {
    return this.ticketService.rateTicket(id, dto);
  }

  /**
   * Function to assign a technical to a ticket
   *
   * @param id The ID of the ticket to be assigned
   * @param asignTechnicalDto The DTO containing the assignment data
   * @returns A confirmation message indicating the ticket has been assigned to the technical
   */
  @UseGuards(AccessTokenGuard)
  @Post('asignTechnical/:id')
  asignTechnical(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignTechnicalDto: AsignTechnicalDto,
  ) {
    return this.ticketService.asigngTicketToTechnical(+id, asignTechnicalDto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('updateAssignTechnical/:id')
  updateAssignTechnical(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignTechnicalDto: AsignTechnicalDto,
  ) {
    return this.ticketService.updateAssignTechnical(+id, asignTechnicalDto);
  }

  /**
   * Function to close a ticket
   *
   * @param id The ID of the ticket to be closed
   * @param closeTicketDto The DTO containing the close ticket data
   * @returns A confirmation message indicating the ticket has been closed
   */
  @UseGuards(AccessTokenGuard)
  @Post('close/:id')
  closeTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeTicketDto: CloseTicketDto,
  ) {
    return this.ticketService.closeTicket(+id, closeTicketDto);
  }

  @Put('updateStatus/:id')
  updateStatusTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { status: TicketStatus },
  ) {
    return this.ticketService.updateStatus(id, body.status);
  }

  //@UseGuards(AccessTokenGuard)
  @Get('allTickets')
  findAllTickets() {
    return this.ticketService.findAllTicketBranches();
  }

  /**
   * Function to retrieve all tickets by branch ID
   *
   * @param id The ID of the branch to retrieve tickets for
   * @returns A list of tickets associated with the specified branch
   */
  //@UseGuards(AccessTokenGuard)
  @Get('byBranch/:id')
  findByBranch(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findAllByBranch(+id);
  }

  /**
   * Function to retrieve a ticket by ID
   *
   * @param id The ID of the ticket to be retrieved
   * @returns The ticket with the specified ID
   */
  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOne(+id);
  }

  /**
   * Function to update a ticket by its ID
   *
   * @param id The ID of the ticket to be updated
   * @param updateTicketDto The DTO containing the updated ticket data
   * @returns The updated ticket
   */
  @UseGuards(AccessTokenGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(+id, updateTicketDto);
  }

  /**
   * Function to remove a ticket by its ID
   *
   * @param id The ID of the ticket to be removed
   * @returns A confirmation message indicating the ticket has been removed
   */
  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketService.deleteTicket(+id);
  }
}
