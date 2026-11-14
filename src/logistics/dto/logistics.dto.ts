import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { PRINTER_STATUSES, PrinterStatus } from '../entities/logistics-printer.entity';
import { SHIPMENT_STATUSES, SHIPMENT_TYPES, ShipmentStatus, ShipmentType } from '../entities/logistics-shipment.entity';

export class CreatePrinterDto {
  @IsInt() @Min(1) branchId: number;
  @IsString() @IsNotEmpty() @MaxLength(80) brand: string;
  @IsString() @IsNotEmpty() @MaxLength(120) model: string;
  @IsString() @IsNotEmpty() @MaxLength(80) serialNumber: string;
  @IsOptional() @IsString() @MaxLength(60) type?: string;
  /** Al dar de alta no se puede crear ya en BAJA: la baja pasa por autorización. */
  @IsOptional() @IsIn(['DISPONIBLE', 'ASIGNADA', 'EN_REPARACION']) status?: PrinterStatus;
  @IsOptional() @IsInt() @Min(0) @Max(2_000_000_000) counter?: number;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(200) clientName?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class UpdatePrinterDto {
  @IsOptional() @IsInt() @Min(1) branchId?: number;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) brand?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(120) model?: string;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) serialNumber?: string;
  @IsOptional() @IsString() @MaxLength(60) type?: string;
  @IsOptional() @IsIn(['DISPONIBLE', 'ASIGNADA', 'EN_REPARACION']) status?: PrinterStatus;
  @IsOptional() @IsInt() @Min(0) @Max(2_000_000_000) counter?: number;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(200) clientName?: string;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class CreateShipmentDto {
  @IsInt() @Min(1) branchId: number;
  @IsIn(SHIPMENT_TYPES as unknown as string[]) type: ShipmentType;
  @IsString() @IsNotEmpty() @MaxLength(300) description: string;
  @IsOptional() @IsInt() @Min(1) @Max(100000) quantity?: number;
  @IsOptional() @IsIn(SHIPMENT_STATUSES as unknown as string[]) status?: ShipmentStatus;
  @IsOptional() @IsString() @MaxLength(80) carrier?: string;
  @IsOptional() @IsString() @MaxLength(80) trackingNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) recipientName?: string;
  @IsOptional() @IsString() @MaxLength(40) recipientPhone?: string;
  @IsOptional() @IsString() @MaxLength(400) destination?: string;
  @IsOptional() @IsString() @MaxLength(200) clientName?: string;
  @IsOptional() @IsInt() @Min(1) ticketId?: number;
  @IsOptional() @IsInt() @Min(1) printerId?: number;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

export class UpdateShipmentDto {
  @IsOptional() @IsIn(SHIPMENT_TYPES as unknown as string[]) type?: ShipmentType;
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(300) description?: string;
  @IsOptional() @IsInt() @Min(1) @Max(100000) quantity?: number;
  @IsOptional() @IsIn(SHIPMENT_STATUSES as unknown as string[]) status?: ShipmentStatus;
  @IsOptional() @IsString() @MaxLength(80) carrier?: string;
  @IsOptional() @IsString() @MaxLength(80) trackingNumber?: string;
  @IsOptional() @IsString() @MaxLength(200) recipientName?: string;
  @IsOptional() @IsString() @MaxLength(40) recipientPhone?: string;
  @IsOptional() @IsString() @MaxLength(400) destination?: string;
  @IsOptional() @IsString() @MaxLength(200) clientName?: string;
  @IsOptional() @IsInt() @Min(1) ticketId?: number;
  @IsOptional() @IsInt() @Min(1) printerId?: number;
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

/** Solicitud de baja: desde un ticket (ticketId) o desde el inventario (printerId). */
export class CreateDecommissionDto {
  @IsInt() @Min(1) branchId: number;
  @IsOptional() @IsInt() @Min(1) printerId?: number;
  @IsOptional() @IsInt() @Min(1) ticketId?: number;
  @IsOptional() @IsString() @MaxLength(40) ticketNumber?: string;
  @IsString() @IsNotEmpty() @MaxLength(80) brand: string;
  @IsString() @IsNotEmpty() @MaxLength(120) model: string;
  @IsString() @IsNotEmpty() @MaxLength(80) serialNumber: string;
  @IsOptional() @IsInt() @Min(0) @Max(2_000_000_000) counter?: number;
  @IsOptional() @IsString() @MaxLength(200) clientName?: string;
  @IsString() @IsNotEmpty() @MaxLength(1000) reason: string;
}

export class ReviewDecommissionDto {
  @IsOptional() @IsString() @MaxLength(500) notes?: string;
}

/** Archivo en base64 (sin prefijo data:): guía de envío o responsiva firmada. PDF, PNG o JPG de hasta 8 MB. */
export class UploadFileDto {
  @IsString() @IsNotEmpty() fileBase64: string;
  @IsString() @IsNotEmpty() @MaxLength(200) fileName: string;
}

export { PRINTER_STATUSES };
