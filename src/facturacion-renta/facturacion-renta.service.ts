import { Injectable } from '@nestjs/common';
import { CreateFacturacionRentaDto } from './dto/create-facturacion-renta.dto';
import { UpdateFacturacionRentaDto } from './dto/update-facturacion-renta.dto';

@Injectable()
export class FacturacionRentaService {
  create(createFacturacionRentaDto: CreateFacturacionRentaDto) {
    return 'This action adds a new facturacionRenta';
  }

  findAll() {
    return `This action returns all facturacionRenta`;
  }

  findOne(id: number) {
    return `This action returns a #${id} facturacionRenta`;
  }

  update(id: number, updateFacturacionRentaDto: UpdateFacturacionRentaDto) {
    return `This action updates a #${id} facturacionRenta`;
  }

  remove(id: number) {
    return `This action removes a #${id} facturacionRenta`;
  }
}
