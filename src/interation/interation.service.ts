import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Interaction } from './entity/interation.entity';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { CreateOnlyInteractionDto } from './dto/create_only_interaction.dto';
import { Purchase } from '../purchase/entity/purchase.entity';

@Injectable()
export class InterationService {
  constructor(
    @InjectRepository(Interaction)
    private interactionRepository: Repository<Interaction>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
  ) {}

  async createInteraction(interaction: CreateOnlyInteractionDto) {
    const customerFound = await this.customersRepository.findOne({
      where: { customer_id: interaction.customerId },
    });

    const interactions = this.interactionRepository.create({
      interaction_type: interaction.interaction_type,
      interaction_date: interaction.interaction_date,
      notes: interaction.notes,
      customer: customerFound,
    });

    if (interaction.purchases) {
      const purchaseEntities = interaction.purchases.map((purchaseDto) => {
        return this.purchaseRepository.create({
          ...purchaseDto,
          customer: customerFound,
        });
      });
      await this.purchaseRepository.save(purchaseEntities);
    }

    const response = await this.interactionRepository.save(interactions);
    const data = {
      interaction_id: response.interaction_id,
      interaction_type: response.interaction_type,
      interaction_date: response.interaction_date,
      notes: response.notes,
    };
    return data;
  }
}
