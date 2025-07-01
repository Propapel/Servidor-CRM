import { IsNotEmpty } from "class-validator";

export class CreateClientDto {
     @IsNotEmpty()
  numberOfClient: string;

  @IsNotEmpty()
  razonSocial: string;

  userId?: number; // Opcional, si se quiere asociar a un usuario al crear el cliente
}
