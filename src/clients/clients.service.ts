import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { Client } from './entities/client.entity';
import * as XLSX from 'xlsx';
import { User } from '../users/user.entity';

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>, // Assuming you need userRepository for some reason
  ) {}

  async create(createClientDto: CreateClientDto) {
    createClientDto.numberOfClient = createClientDto.numberOfClient.trim();
    createClientDto.razonSocial = createClientDto.razonSocial.trim();
    const user = await this.findUserOrNull(createClientDto.userId);
    const sucursalId = createClientDto.sucursalId ?? 1;

    await this.ensureUniqueNumber(createClientDto.numberOfClient, sucursalId);

    const newClient = this.clientRepository.create({
      numberOfClient: createClientDto.numberOfClient,
      codeClient: createClientDto.numberOfClient,
      razonSocial: createClientDto.razonSocial,
      sucursalId,
      correoElectronicos: this.normalizeEmails(createClientDto.correoElectronicos),
      isDelete: false,
      user, // Puede ser null
    });

    return this.clientRepository.save(newClient);
  }

  /** Lista vacía en lugar de 404: la app muestra el estado "sin clientes". */
  findAll() {
    return this.clientRepository.find({
      where: { isDelete: false },
      order: { razonSocial: 'ASC' },
    });
  }

  findBySucursal(sucursalId: number) {
    return this.clientRepository.find({
      where: { sucursalId, isDelete: false },
      order: { razonSocial: 'ASC' },
    });
  }

  async findOne(id: number) {
    const client = await this.clientRepository.findOne({
      where: { id, isDelete: false },
      relations: ['departamentos', 'tickets'],
    });

    if (!client) {
      throw new HttpException('No se encontró el cliente', HttpStatus.NOT_FOUND);
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepository.findOneBy({ id, isDelete: false });

    if (!client) {
      throw new HttpException(
        'No se encontró el cliente para actualizar',
        HttpStatus.NOT_FOUND,
      );
    }

    const { userId, correoElectronicos, ...fields } = updateClientDto;
    if (fields.numberOfClient !== undefined) fields.numberOfClient = fields.numberOfClient.trim();
    if (fields.razonSocial !== undefined) fields.razonSocial = fields.razonSocial.trim();
    const numberOfClient = fields.numberOfClient ?? client.numberOfClient;
    const sucursalId = fields.sucursalId ?? client.sucursalId;
    if (numberOfClient !== client.numberOfClient || sucursalId !== client.sucursalId) {
      await this.ensureUniqueNumber(numberOfClient, sucursalId, id);
    }

    Object.assign(client, fields);
    if (fields.numberOfClient) client.codeClient = fields.numberOfClient;
    if (correoElectronicos !== undefined) {
      client.correoElectronicos = this.normalizeEmails(correoElectronicos);
    }
    if (userId !== undefined) client.user = await this.findUserOrNull(userId);

    return this.clientRepository.save(client);
  }

  /** Borrado lógico: marca isDelete y conserva el registro (tickets, equipos e historial siguen ligados). */
  async remove(id: number) {
    const client = await this.clientRepository.findOneBy({ id, isDelete: false });

    if (!client) {
      throw new HttpException(
        'No se encontró el cliente para eliminar',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.clientRepository.update(id, { isDelete: true });
    return { id, deleted: true };
  }

  private async findUserOrNull(userId?: number | null): Promise<User | null> {
    if (!userId) return null;
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }
    return user;
  }

  private async ensureUniqueNumber(numberOfClient: string, sucursalId: number, excludeId?: number) {
    const existing = await this.clientRepository.findOneBy({
      numberOfClient,
      sucursalId,
      isDelete: false,
    });
    if (existing && existing.id !== excludeId) {
      throw new HttpException(
        `Ya existe un cliente con la clave ${numberOfClient} en esta sucursal`,
        HttpStatus.CONFLICT,
      );
    }
  }

  private normalizeEmails(emails?: string[] | null): string[] {
    if (!emails) return [];
    return [...new Set(emails.map((e) => e.trim().toLowerCase()).filter(Boolean))];
  }

  async findByNombreOrRazonSocial(
    numberOfClient: string,
    razonSocial: string,
  ): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: [
        { numberOfClient, isDelete: false },
        { razonSocial, isDelete: false },
      ],
    });
  }

 async uploadClientsExcel(file: Express.Multer.File) {
  if (!file) {
    throw new HttpException('No se recibió archivo', HttpStatus.BAD_REQUEST);
  }

  const workbook = XLSX.read(file.buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rows: any[] = XLSX.utils.sheet_to_json(sheet);
  const results = [];
  const sinUsuario = [];

  for (const row of rows) {
    const razonSocialRaw = row['Razon social']?.toString().trim();
    const carteraRaw = row['Cartera']?.toString().trim();
    const sucursalRaw = row['Sucursal']?.toString().trim();

    if (razonSocialRaw) {
      const parts = razonSocialRaw.split(/\s+/);
      const numberOfClient = parts[0];
      const razonSocial = parts.slice(1).join(' ');

      let user: User | null = null;

      if (carteraRaw) {
        const wallet = carteraRaw.split(' ')[0];
        user = await this.userRepository.findOneBy({ wallet });
      }

      const sucursalId = parseInt(sucursalRaw ?? '1'); // default a 1 si viene vacío

      if (numberOfClient && razonSocial) {
        const exists = await this.findByNombreOrRazonSocial(
          numberOfClient,
          razonSocial,
        );

        if (!exists) {
          const created = this.clientRepository.create({
            numberOfClient,
            codeClient: numberOfClient,
            razonSocial,
            sucursalId,
            user,
          });

          const saved = await this.clientRepository.save(created);
          results.push(saved);

          if (!user) {
            sinUsuario.push({ numberOfClient, razonSocial });
          }
        }
      }
    }
  }

  return {
    message: 'Clientes cargados correctamente',
    totalAgregados: results.length,
    sinUsuario: sinUsuario.length,
    detallesSinUsuario: sinUsuario,
  };
}

}
