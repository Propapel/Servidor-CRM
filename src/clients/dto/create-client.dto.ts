import {
  ArrayMaxSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateClientDto {
  @IsString()
  @IsNotEmpty({ message: 'La clave del cliente es obligatoria' })
  @MaxLength(50)
  numberOfClient: string;

  @IsString()
  @IsNotEmpty({ message: 'La razón social es obligatoria' })
  @MaxLength(255)
  razonSocial: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  sucursalId?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsEmail({}, { each: true, message: 'Hay un correo electrónico inválido' })
  correoElectronicos?: string[];

  @IsOptional()
  @IsInt()
  userId?: number; // Opcional, si se quiere asociar a un usuario al crear el cliente
}
