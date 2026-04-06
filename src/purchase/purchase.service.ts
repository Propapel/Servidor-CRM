import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Purchase } from './entity/purchase.entity';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Injectable()
export class PurchaseService {

    constructor(
        @InjectRepository(Purchase) private purchaseRepository: Repository<Purchase>,
        @InjectRepository(Customer) private customerRepository: Repository<Customer>
    ){

    }

    async createPurchase(purchase: CreatePurchaseDto){
        const searchCustomer = await this.customerRepository.findOne(
            {
                where: {
                    customer_id: purchase.customerId
                }
            }
        )

        console.log(purchase.amount)
        const purchaseCreate = this.purchaseRepository.create({
            product_service_name: purchase.product_service_name,
            purchase_date: purchase.purchase_date,
            customer: searchCustomer,
            amount: purchase.amount 
        })

        
        const response = await this.purchaseRepository.save(purchaseCreate)


        const data = {
            product_service_name : response.product_service_name,
            purchase_date: response.purchase_date,
            amount: response.amount,
            purchase_id: response.purchase_id,
            isIntoProduct: response.isIntoProduct
        }

        return data
    
    }
}
