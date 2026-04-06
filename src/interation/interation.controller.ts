import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { InterationService } from './interation.service';
import { CreateOnlyInteractionDto } from './dto/create_only_interaction.dto';
import { AccessTokenGuard } from '../auth/guards/jwt-auth.guard';

@Controller('interation')
export class InterationController {

    constructor(
        private interactionService: InterationService
    ) { }

    @UseGuards(AccessTokenGuard)
    @Post('create')
    createInteraction(@Body() interactionDto: CreateOnlyInteractionDto) {
        return this.interactionService.createInteraction(interactionDto)
    }
}
