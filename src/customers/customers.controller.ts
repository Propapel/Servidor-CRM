import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateStatusCustomerDto } from './dto/update_status_customer.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('customers')
export class CustomersController {
  constructor(private customerService: CustomersService) {}

  //@UseGuards(AccessTokenGuard)
  @Get('findAllCustomersByUserId/:id')
  findAllCustomerByUserId(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findAllCustomerByUserId(id);
  }

  //@UseGuards(AccessTokenGuard)
  @Get('findAllCustomerByType/:id')
  findAllCustomerByType(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findAllCustomersByTypes(id);
  }

  //@UseGuards(AccessTokenGuard)
  @Get('findById/:id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.findById(id);
  }

  //@UseGuards(AccessTokenGuard)
  @Post('createLead')
  createLead(@Body() customer: CreateCustomerDto) {
    this.customerService.createNewVersion(customer);
  }

  //@UseGuards(AccessTokenGuard)
  @Put('updateStatusManager')
  updateStatusManager(
    @Body() updateStatusCustomerDto: UpdateStatusCustomerDto,
  ) {
    return this.customerService.updateStatusLead(updateStatusCustomerDto);
  }

  ///ALL
  //@UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() customer: CreateCustomerDto) {
    this.customerService.create(customer);
  }

  //@UseGuards(AccessTokenGuard)
  @Get('getCustomerById/:customerId')
  getUserById(@Param('customerId') customerId: number) {
    return this.customerService.getCustomerById(customerId);
  }

  //This funtion remove dont work with new version
  //@UseGuards(AccessTokenGuard)
  @Get('myCustomers/:id')
  findMyCustomers(@Param('id', ParseIntPipe) id: number) {
    return this.customerService.getMyCustomer(id);
  }

  //@UseGuards(AccessTokenGuard)
  @Get('getCategorizedCustomers')
  getCategorizedCustomer() {
    return this.customerService.categorizeLeads();
  }

  //@UseGuards(AccessTokenGuard)
  @Get('getFunnerChartByBranch/:branch')
  findFunnerChartByBranch(@Param('branch') branch: string) {
    return this.customerService.getFunnerCharByBrach(branch);
  }

  //This function don´t work with the new version
  //@UseGuards(AccessTokenGuard)
  @Get('getAllCustomers')
  getAllCustomers() {
    return this.customerService.getAllCustomer();
  }

  @Post('updateCustomer/:customerId')
  updateCustomer(
    @Param('customerId') id: number,
    @Body() updateCustomer: UpdateCustomerDto,
  ) {
    this.customerService.updateCustomer(id, updateCustomer);
  }
}
