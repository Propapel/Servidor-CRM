import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateRoleDto {
  @IsString() @IsNotEmpty({ message: 'El nombre del rol es obligatorio' }) @MaxLength(80)
  name: string;

  @IsOptional() @IsString() @MaxLength(120) route?: string;

  @IsOptional() @IsString() @MaxLength(500) image?: string;

  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsInt({ each: true }) @Type(() => Number)
  permissionIds?: number[];
}

export class UpdateRoleDto {
  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(120) route?: string;
  @IsOptional() @IsString() @MaxLength(500) image?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(200) @IsInt({ each: true }) @Type(() => Number)
  permissionIds?: number[];
}

/** Nombre técnico: minúsculas, números, guion y guion bajo (así lo usa la app). */
const PERMISSION_NAME = /^[a-z0-9][a-z0-9_-]{1,79}$/;

export class CreatePermissionDto {
  @IsString() @Matches(PERMISSION_NAME, { message: 'Usa minúsculas, números, - o _ (ej. reportes-ventas)' })
  name: string;

  @IsString() @IsNotEmpty({ message: 'Describe qué permite este permiso' }) @MaxLength(255)
  description: string;
}

export class UpdatePermissionDto {
  @IsOptional() @IsString() @Matches(PERMISSION_NAME, { message: 'Usa minúsculas, números, - o _ (ej. reportes-ventas)' })
  name?: string;

  @IsOptional() @IsString() @IsNotEmpty() @MaxLength(255)
  description?: string;
}

export class UpsertBranchDto {
  @IsString() @IsNotEmpty({ message: 'El nombre de la sucursal es obligatorio' }) @MaxLength(120)
  nombre: string;

  @IsOptional() @IsString() @MaxLength(10) abbreviation?: string;

  @IsString() @IsNotEmpty({ message: 'La dirección es obligatoria' }) @MaxLength(255)
  direccion: string;

  @IsOptional() @IsString() @MaxLength(30) numberContact?: string;

  @IsOptional() @IsString() @MaxLength(500) image?: string;
}
