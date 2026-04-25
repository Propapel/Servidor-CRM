import { TicketStatus } from '../enum/ticiket_report_status';
import { TypeOfReport } from '../enum/kind_report';

export class CreatePublicTicketDto {
  nameCommercial?: string;
  nameReported?: string;
  apartamentReport?: string;
  phoneReport?: string;
  emailReport?: string;
  reasonReport?: string;
  location?: string;
  files?: string[];
  status?: TicketStatus; // Can be optional and set default by service
  typeOfReport?: TypeOfReport;
  sucursalId: number; // For public tickets, we require the sucursal
  typeOfReportId?: number;
}
