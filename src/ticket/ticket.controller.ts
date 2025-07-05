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
} from '@nestjs/common';
import { TicketService } from './ticket.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';
import { AsignTechnicalDto } from './dto/asign-technical.dto';
import { CloseTicketDto } from './dto/close_ticket.dto';
import { Response } from 'express';
import { RateTicketDto } from './dto/rating_ticket_resolved.dto';

@Controller('ticket')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get('technical/assigments/:id')
  findMyTicketAssignment(
    @Param('id', ParseIntPipe) id: number,
  ){
      return this.ticketService.findTicketAssigments(id)
  }

  @UseGuards(AccessTokenGuard)
  @Post()
  create(@Body() createTicketDto: CreateTicketDto) {
    return this.ticketService.create(createTicketDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get()
  findAll() {
    return this.ticketService.findAll();
  }

  @Get('qualifyTicket')
  async qualifyTicket(@Query('token') token: string, @Res() res: Response) {
    const html = await this.ticketService.qualifyServiceByToken(token);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  }

  @Post('rate/:id')
  async rateTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RateTicketDto,
  ) {
    return this.ticketService.rateTicket(id, dto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('asignTechnical/:id')
  asignTechnical(
    @Param('id', ParseIntPipe) id: number,
    @Body() asignTechnicalDto: AsignTechnicalDto,
  ) {
    return this.ticketService.asigngTicketToTechnical(+id, asignTechnicalDto);
  }

  @UseGuards(AccessTokenGuard)
  @Post('close/:id')
  closeTicket(
    @Param('id', ParseIntPipe) id: number,
    @Body() closeTicketDto: CloseTicketDto,
  ) {
    return this.ticketService.closeTicket(+id, closeTicketDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('byBranch/:id')
  findByBranch(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findAllByBranch(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
    return this.ticketService.update(+id, updateTicketDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ticketService.remove(+id);
  }
}
