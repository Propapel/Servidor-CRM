import {
  ArrayMaxSize, IsArray, IsBoolean, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf,
  registerDecorator, ValidationOptions,
} from 'class-validator';

/** ~400 KB decodificado = 546,134 caracteres de base64. */
export const MAX_LOGO_BYTES = 400 * 1024;

/** PNG o JPG en base64 sin prefijo data:, de hasta 400 KB. */
function IsLogoBase64(options?: ValidationOptions) {
  return (object: object, propertyName: string) =>
    registerDecorator({
      name: 'isLogoBase64',
      target: object.constructor,
      propertyName,
      options: { message: 'logoBase64 debe ser un PNG o JPG en base64 (sin "data:") de máximo 400 KB', ...options },
      validator: {
        validate(value: unknown) {
          if (value === null || value === undefined) return true;
          if (typeof value !== 'string' || value.startsWith('data:')) return false;
          const clean = value.replace(/\s/g, '');
          if (!/^[A-Za-z0-9+/]+={0,2}$/.test(clean)) return false;
          const bytes = Buffer.from(clean, 'base64');
          if (bytes.length === 0 || bytes.length > MAX_LOGO_BYTES) return false;
          const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
          const isJpg = bytes[0] === 0xff && bytes[1] === 0xd8;
          return isPng || isJpg;
        },
      },
    });
}

/** Todos los campos son opcionales: lo que falte toma el valor predeterminado. */
export class UpsertServiceSheetDto {
  @IsOptional() @IsString() @MaxLength(60)
  title?: string;

  @IsOptional() @ValidateIf((_, v) => v !== null) @IsLogoBase64()
  logoBase64?: string | null;

  @IsOptional() @IsArray() @ArrayMaxSize(6) @IsString({ each: true }) @MaxLength(200, { each: true })
  footerLines?: string[];

  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) @MaxLength(80, { each: true })
  serviceTypes?: string[];

  @IsOptional() @IsBoolean()
  showEquipmentTable?: boolean;

  @IsOptional() @IsInt() @Min(1) @Max(8)
  equipmentRows?: number;

  @IsOptional() @IsInt() @Min(1) @Max(8)
  activityLines?: number;

  @IsOptional() @IsInt() @Min(0) @Max(8)
  commentLines?: number;

  @IsOptional() @IsString() @MaxLength(80)
  clientSignatureLabel?: string;

  @IsOptional() @IsString() @MaxLength(80)
  technicianSignatureLabel?: string;

  @IsOptional() @IsBoolean()
  showTechnicianName?: boolean;
}

export interface ServiceSheetConfig {
  title: string;
  logoBase64: string | null;
  footerLines: string[];
  serviceTypes: string[];
  showEquipmentTable: boolean;
  equipmentRows: number;
  activityLines: number;
  commentLines: number;
  clientSignatureLabel: string;
  technicianSignatureLabel: string;
  showTechnicianName: boolean;
}

/** Formato predeterminado (el mismo que usa la app cuando la sucursal no tiene uno). */
export const DEFAULT_SERVICE_SHEET: ServiceSheetConfig = {
  title: 'SERVICIO TÉCNICO',
  logoBase64: null,
  footerLines: [],
  serviceTypes: [
    'Instalación de equipo nuevo', 'Recolección', 'Asistencia técnica', 'Mantenimiento',
    'Cambio de equipo', 'Entrega', 'Diagnóstico y reparación',
  ],
  showEquipmentTable: true,
  equipmentRows: 4,
  activityLines: 4,
  commentLines: 4,
  clientSignatureLabel: 'Nombre y Firma del cliente',
  technicianSignatureLabel: 'Nombre y firma técnico',
  showTechnicianName: true,
};
