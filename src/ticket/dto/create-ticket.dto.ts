import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../enum/ticiket_report_status';
import { TicketPriority } from '../enum/ticket_priority';
import { TypeOfReport } from '../enum/kind_report';

export class CreateTicketDto {
  userCreated?: number;
  nameCommercial?: string;
  nameReported?: string;
  apartamentReport?: string;
  phoneReport?: string;
  emailReport?: string;
  reasonReport?: string;
  location?: string;
  files?: string[];
  status: TicketStatus;
  typeOfReport?: TypeOfReport;
  clientId: number;
  itequipId: number;
}
