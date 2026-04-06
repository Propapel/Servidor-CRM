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
    let user: User | null = null;

    if (createClientDto.userId) {
      user = await this.userRepository.findOneBy({
        id: createClientDto.userId,
      });

      if (!user) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }
    }

    const newClient = this.clientRepository.create({
      numberOfClient: createClientDto.numberOfClient,
      razonSocial: createClientDto.razonSocial,
      user, // Puede ser null
    });

    return this.clientRepository.save(newClient);
  }

  async findAll() {
     const clients = await this.clientRepository.find();
    if (clients.length === 0) {
      throw new HttpException(
        'No se encontraron clientes para esta sucursal',
        HttpStatus.NOT_FOUND,
      );
    }
    return clients;
  }

  async findBySucursal(sucursalId: number) {
    const clients = await this.clientRepository.find({
      where: { sucursalId }
    });
    if (clients.length === 0) {
      throw new HttpException(
        'No se encontraron clientes para esta sucursal',
        HttpStatus.NOT_FOUND,
      );
    }
    return clients;
  }

  async findOne(id: number) {
    const client = await this.clientRepository.findOne({
      where: { id },
      relations: ['departamentos', 'tickets'],
    });

    if (!client) {
      throw new HttpException(
        'No se encontró el cliente',
        HttpStatus.NOT_FOUND,
      );
    }

    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto) {
    const client = await this.clientRepository.preload({
      id,
      ...updateClientDto,
    });

    if (!client) {
      throw new HttpException(
        'No se encontró el cliente para actualizar',
        HttpStatus.NOT_FOUND,
      );
    }

    return this.clientRepository.save(client);
  }

  async remove(id: number) {
    const client = await this.clientRepository.findOneBy({ id });

    if (!client) {
      throw new HttpException(
        'No se encontró el cliente para eliminar',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.clientRepository.remove(client);
  }

  async findByNombreOrRazonSocial(
    numberOfClient: string,
    razonSocial: string,
  ): Promise<Client | null> {
    return this.clientRepository.findOne({
      where: [
        { numberOfClient },
        { razonSocial },
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
