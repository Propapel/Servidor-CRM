import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';
import { Client } from 'src/clients/entities/client.entity';
import { AssignLicenceClientDto } from './dto/asign_licence_to_client.dto';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
    @InjectRepository(Client)
    private readonly clienteRepository: Repository<Client>,
  ) {}

  async create(createLicenseDto: CreateLicenseDto) {
    const productFound = await this.productRepository.findOne({
      where: { id: createLicenseDto.productId },
    });

    if (!productFound) {
      throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
    }

    const licenseCreated = await this.licenseRepository.save({
      key: createLicenseDto.key,
      expirationDate: createLicenseDto.expirationDate,
      available: createLicenseDto.available,
      product: productFound, // Asociamos el producto a la licencia
    });

    return licenseCreated;
  }

  async assignLicenceClient(asignLicenceClient: AssignLicenceClientDto ) {
    const licenseFound = await this.licenseRepository.findOne({
      where: { id: asignLicenceClient.licenceId },
      relations: ['client'], // opcional si necesitas la relación actual
    });

    if (!licenseFound) {
      throw new HttpException('Licencia no encontrada', HttpStatus.NOT_FOUND);
    }

    licenseFound.dateAssigment = new Date().toISOString() as unknown as Date;
    licenseFound.available = false;
    licenseFound.email = asignLicenceClient.email;
    licenseFound.password = asignLicenceClient.password;
    licenseFound.departamentAssign = asignLicenceClient.departamentAssign;

    const clientFound = await this.clienteRepository.findOne({
      where: { id: asignLicenceClient.clientId },
    });

    if (!clientFound) {
      throw new HttpException('Cliente no encontrado', HttpStatus.NOT_FOUND);
    }
 
    // Asignamos el cliente a la licencia
    (licenseFound as any).client = clientFound;

    // Guardamos la licencia actualizada
    await this.licenseRepository.save(licenseFound);

    return {
      message: 'Licencia asignada correctamente al cliente',
      licenseId: licenseFound.id,
      clientId: clientFound.id,
    };
  }

  findAll() {
    return `This action returns all license`;
  }

  findOne(id: number) {
    return `This action returns a #${id} license`;
  }

  update(id: number, updateLicenseDto: UpdateLicenseDto) {
    return `This action updates a #${id} license`;
  }

  remove(id: number) {
    return `This action removes a #${id} license`;
  }
}
