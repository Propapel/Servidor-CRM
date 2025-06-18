import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('purchase')
export class PurchaseController {
    constructor(
        private purchaseService: PurchaseService
    ){

    }

      @UseGuards(AccessTokenGuard)
    @Post('create')
    createPurchase(@Body() purchaseDto: CreatePurchaseDto){
        return this.purchaseService.createPurchase(purchaseDto)
    }
}
