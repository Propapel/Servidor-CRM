import { Injectable } from '@nestjs/common';
import { CreateRentaDto } from './dto/create-renta.dto';
import { UpdateRentaDto } from './dto/update-renta.dto';

@Injectable()
export class RentaService {
  create(createRentaDto: CreateRentaDto) {
    return 'This action adds a new renta';
  }

  findAll() {
    return `This action returns all renta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} renta`;
  }

  update(id: number, updateRentaDto: UpdateRentaDto) {
    return `This action updates a #${id} renta`;
  }

  remove(id: number) {
    return `This action removes a #${id} renta`;
  }
}
