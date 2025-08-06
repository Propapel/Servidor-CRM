import { Type } from "class-transformer";
import { IsArray } from "class-validator";
import { TicketAttentionType } from "../enum/ticket_attention_type";
import { TicketStatus } from "../enum/ticiket_report_status";

export class AsignTechnicalDto {
    @IsArray()
    @Type(() => Number)
    assigmentsTechnical: number[];
    statusTicket: TicketStatus
}