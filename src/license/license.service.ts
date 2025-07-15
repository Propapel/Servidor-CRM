import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLicenseDto } from './dto/create-license.dto';
import { UpdateLicenseDto } from './dto/update-license.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/entities/product.entity';
import { Repository } from 'typeorm';
import { License } from './entities/license.entity';

@Injectable()
export class LicenseService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(License)
    private readonly licenseRepository: Repository<License>,
  ) {}


  async create(createLicenseDto: CreateLicenseDto) {
    const productFound = await this.productRepository.findOne({
      where: { id: createLicenseDto.productId },
    })

    if (!productFound) {
      throw new HttpException('License no encontrado', HttpStatus.NOT_FOUND);
    }

    const lincenseFound = await this.licenseRepository.save({
      key: createLicenseDto.key,
      expirationDate: createLicenseDto.expirationDate,
      available: createLicenseDto.available,
    });


    return 'This action adds a new license';
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
