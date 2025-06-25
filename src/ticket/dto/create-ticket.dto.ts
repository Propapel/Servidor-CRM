import { IsString, IsNotEmpty, IsOptional, IsArray, IsEnum, IsDateString, IsBoolean, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { TicketStatus } from '../enum/ticiket_report_status';
import { TicketPriority } from '../enum/ticket_priority';
import { TypeOfReport } from '../enum/kind_report';

export class CreateTicketDto {


    userCreated: number;

    @IsString()
    phoneReport: string;
    
    @IsString()
    emailReport: string;
    
    @IsNotEmpty()
    @IsString()
    nameReported: string;

    @IsNotEmpty()
    @IsString()
    apartamentReport: string;

    @IsNotEmpty()
    @IsString()
    reasonReport: string;

    @IsOptional()
    @IsString()
    location?: string;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    files?: string[];

    @IsOptional()
    @IsString()
    pdfPageService?: string;

    @IsOptional()
    @IsNumber()
    serviceRating?: number;

    @IsOptional()
    @IsDateString()
    dateAssigment?: string;

    @IsOptional()
    @IsBoolean()
    resolved?: boolean;

    @IsOptional()
    @IsDateString()
    resolvedAt?: string;

    @IsOptional()
    @IsArray()
    @Type(() => Number)
    assigmentsTechnical?: number[];

    @IsEnum(TicketStatus)
    status: TicketStatus;

    @IsEnum(TicketPriority)
    priority: TicketPriority;

    @IsEnum(TypeOfReport)
    typeOfReport: TypeOfReport;
}
