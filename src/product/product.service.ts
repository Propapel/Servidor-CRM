import { Injectable } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto) {
    const product = await this.productRepository.create(createProductDto);
    return await this.productRepository.save(product);
  }

  async findAllByBranch(id: number) {
    const productsFound = await this.productRepository.find({
      where: {
        branchId: id,
      },
      order: {
        createdAt: 'DESC', // Aquí ordenas por fecha de creación descendente
      },
      relations: ['licenses','licenses.client']
    });

    return productsFound;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
