import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRolDto } from './dto/create-rol.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('roles')
export class RolesController {

    constructor(private rolesService: RolesService) { }
    @UseGuards(AccessTokenGuard)
    @Post()
    create(@Body() rol: CreateRolDto) {
        return this.rolesService.create(rol);
    }

    @UseGuards(AccessTokenGuard)
    @Get('getAllRoles')
    getAllRoles() {
        return this.rolesService.getAllRoles()
    }

    @UseGuards(AccessTokenGuard)
    @Get("getRolesExecutive")
    getRolesExecutive() {
        return this.rolesService.getRolesExecutive()
    }

}
