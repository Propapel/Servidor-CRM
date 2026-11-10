import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min,
} from 'class-validator';
import { NOTIFICATION_EVENTS, NotificationEvent } from '../notification-events';

export class UpsertSmtpConfigDto {
  @IsOptional() @IsBoolean() enabled?: boolean;

  @IsString() @IsNotEmpty({ message: 'El servidor SMTP es obligatorio' }) @MaxLength(255)
  host: string;

  @Type(() => Number) @IsInt() @Min(1) @Max(65535)
  port: number;

  @IsBoolean() secure: boolean;

  @IsString() @IsNotEmpty({ message: 'El usuario SMTP es obligatorio' }) @MaxLength(255)
  username: string;

  /** Vacío o ausente = conservar la contraseña guardada. */
  @IsOptional() @IsString() @MaxLength(500)
  password?: string;

  @IsEmail({}, { message: 'El correo remitente no es válido' })
  fromEmail: string;

  @IsOptional() @IsString() @MaxLength(120) fromName?: string;

  @IsOptional() @IsEmail({}, { message: 'El correo de respuesta no es válido' }) replyTo?: string | null;

  @IsOptional() @IsBoolean() notifyReporter?: boolean;

  @IsOptional() @IsBoolean() notifyAssignedTechnician?: boolean;
}

export class TestSmtpDto {
  @IsEmail({}, { message: 'Escribe un correo válido para la prueba' })
  to: string;
}

export class CreateRecipientDto {
  @IsIn(NOTIFICATION_EVENTS) event: NotificationEvent;

  @IsEmail({}, { message: 'El correo no es válido' }) email: string;

  @IsOptional() @IsString() @MaxLength(120) name?: string;
}

export class UpdateRecipientDto {
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsString() @MaxLength(120) name?: string;
}

export class CopyConfigDto {
  @IsArray() @ArrayMaxSize(100) @IsInt({ each: true }) @Type(() => Number)
  targetBranchIds: number[];

  @IsBoolean() includeSmtp: boolean;

  @IsBoolean() includeRecipients: boolean;
}
