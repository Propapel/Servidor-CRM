import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketUpdatedDto } from './create-ticket-updated.dto';

export class UpdateTicketUpdatedDto extends PartialType(CreateTicketUpdatedDto) {}
