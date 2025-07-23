import { Type } from "class-transformer";
import { IsArray } from "class-validator";
import { TicketAttentionType } from "../enum/ticket_attention_type";

export class AsignTechnicalDto {
    @IsArray()
    @Type(() => Number)
    assigmentsTechnical: number[];
    ticketAttentionType: TicketAttentionType
}