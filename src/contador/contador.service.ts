import { Injectable } from '@nestjs/common';
import { CreateContadorDto } from './dto/create-contador.dto';
import { UpdateContadorDto } from './dto/update-contador.dto';

@Injectable()
export class ContadorService {
  create(createContadorDto: CreateContadorDto) {
    return 'This action adds a new contador';
  }

  findAll() {
    return `This action returns all contador`;
  }

  findOne(id: number) {
    return `This action returns a #${id} contador`;
  }

  update(id: number, updateContadorDto: UpdateContadorDto) {
    return `This action updates a #${id} contador`;
  }

  remove(id: number) {
    return `This action removes a #${id} contador`;
  }
}
