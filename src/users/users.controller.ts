import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UsersService } from './users.service';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateInfoUserDto } from './dto/update-info-user';


@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('getUsersWithBranches')
  getUsersWithBranches() {
    return this.usersService.getUsersWithBranches();
  }

  /**
   *  Retrieves all users with rol technical.
   * This endpoint is protected by the AccessTokenGuard,
   * 
   * @param branchId The ID of the branch to filter users.
   * @returns Returns all users with rol technical.
   * 
   */
  @UseGuards(AccessTokenGuard)
  @Get('technical/branch/:branchId')
  findTechnicalByBranch(@Param('branchId', ParseIntPipe) branchId: number) {
    return this.usersService.findAllTechnicalByBranch(branchId);
  }

  /**
   * Retrieves all users with their branches and roles.
   * This endpoint is protected by the AccessTokenGuard,
   * ensuring that only authenticated users can access it.
   * 
   * @returns  Returns all users with their branches and roles.
   */
  @UseGuards(AccessTokenGuard)
  @Get('appointments')
  findAppointmentsByUsers() {
    return this.usersService.findInfoUserAppointments();
  }

  @Get('fetchAllUserAppointments')
  fetchAllUserAppointments() {
    return this.usersService.fetchAllUserAppointments();
  }


  /**
   * Retrieves appointments for users by branch ID.
   * This endpoint is protected by the AccessTokenGuard,
   * ensuring that only authenticated users can access it.
   * 
   * @param id  The ID of the branch to filter appointments.
   * @returns Returns appointments for users associated with the specified branch ID.
   */
  @UseGuards(AccessTokenGuard)
  @Get('appointments/branch/:id')
  findAppointmentsUsersByBranchId(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findInfoUserAppointmentsByBranch(id);
  }

  /**
   * Retrieves all users with their branches.
   * This endpoint is protected by the AccessTokenGuard,
   * ensuring that only authenticated users can access it.
   * 
   * @returns Returns all users with their branches.
   */
  @UseGuards(AccessTokenGuard)
  @Get('findAllUsersBranches')
  findAllUsersBranches() {
    return this.usersService.findAllUsersBranches();
  }

  @UseGuards(AccessTokenGuard)
  @Get('findUsersByBranch/:sucursalId')
  findUsersByBranch(@Param('sucursalId', ParseIntPipe) id: number) {
    return this.usersService.findAllUsesByBranch(id);
  }
  @UseGuards(AccessTokenGuard)
  @Get('findAllUserByBranch/:sucursalId')
  findAllUserBySucursal(@Param('sucursalId', ParseIntPipe) id: number) {
    return this.usersService.findAllUserByBranch(id);
  }
  @UseGuards(AccessTokenGuard)
  @Get('findAllManagerSaleAndRegionalManager/:sucursalId')
  findAllManagerSaleAndRegionalManager(
    @Param('sucursalId', ParseIntPipe) id: number,
  ) {
    return this.usersService.findAllManagerSaleAndRegionalManager(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get('tableDates')
  findAllDatesUsersByMouth() {
    return this.usersService.findAllDatesNowByAllUsers();
  }

  @Get('findAppointments')
  async getDatesForMouthAndYear(
    @Query('month') month?: string,
    @Query('year') year?: string,
  ): Promise<string> {
    const now = new Date();
    const selectedMonth = month ? parseInt(month) - 1 : now.getMonth();
    const selectedYear = year ? parseInt(year) : now.getFullYear();

    const data = await this.usersService.findAllDatesByMonthYear(
      selectedMonth + 1,
      selectedYear,
    );

    const rows = data
      .map(
        (item) =>
          `<tr><td>${item.clave}</td><td>${item.saleExecutive}</td><td>${item.totalDates}</td></tr>`,
      )
      .join('\n');

    const total = data.reduce((sum, item) => sum + item.totalDates, 0);

    const currentDate = new Date(selectedYear, selectedMonth);

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Participación en Citas</title>
      <style>
        body { font-family: Arial; padding: 20px; background-color: #f7f9fc; }
        header { background-color: #007BFF; color: white; padding: 20px; text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; background: white; }
        th, td { padding: 12px; border-bottom: 1px solid #ddd; }
        th { background: #0056b3; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .nav { text-align: center; margin: 20px 0; }
        .nav button { padding: 10px 20px; margin: 0 10px; background: #007BFF; color: white; border: none; cursor: pointer; }
      </style>
    </head>
    <body>
      <header>
        <h1>Participación en Citas</h1>
        <p>${currentDate.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>
      </header>

      <div class="nav">
        <form id="navForm" method="GET">
          <input type="hidden" name="month" id="month" value="${selectedMonth + 1}">
          <input type="hidden" name="year" id="year" value="${selectedYear}">
          <button type="button" onclick="changeMonth(-1)">← Anterior</button>
          <button type="button" onclick="resetMonth()">Mes actual</button>
          <button type="button" onclick="changeMonth(1)">Siguiente →</button>
        </form>
      </div>

      <table>
        <thead>
          <tr>
            <th>CLAVE</th>
            <th>VENDEDOR</th>
            <th>ASISTIDAS / MES</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total</td>
            <td>${total}</td>
          </tr>
        </tfoot>
      </table>

      <script>
        function changeMonth(delta) {
          const form = document.getElementById('navForm');
          let month = parseInt(document.getElementById('month').value);
          let year = parseInt(document.getElementById('year').value);

          month += delta;
          if (month < 1) {
            month = 12;
            year--;
          } else if (month > 12) {
            month = 1;
            year++;
          }

          document.getElementById('month').value = month;
          document.getElementById('year').value = year;
          form.submit();
        }

        function resetMonth() {
          const today = new Date();
          document.getElementById('month').value = today.getMonth() + 1;
          document.getElementById('year').value = today.getFullYear();
          document.getElementById('navForm').submit();
        }
      </script>
    </body>
    </html>
  `;
  }

  @Get('statusCitas')
  async getDates(): Promise<string> {
    const data = await this.usersService.findAllDatesNowByAllUsers();

    const rows = data
      .map(
        (item) =>
          `<tr><td>${item.clave}</td><td>${item.saleExecutive}</td><td>${item.totalDates}</td></tr>`,
      )
      .join('\n');

    const today = new Date();

    const total = data.reduce((sum, item) => sum + item.totalDates, 0);

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <link rel="icon" href="https://1.bp.blogspot.com/-rK4-Xp5tY_U/X_4ZjWc4cqI/AAAAAAAABbQ/HYMo-KaYvOwAUV0ZD0ORfD6NOrF-KRr0wCLcBGAsYHQ/s1431/Propapel-logo.png" sizes="any">
      <title>Participación en Citas</title>
      <style>
      header {
      background-color: #007BFF;
      color: white;
      padding: 20px;
      text-align: center;
    }
        body {
          font-family: Arial, sans-serif;
          background-color: #f7f9fc;
          padding: 20px;
        }
        h2 {
          background-color: #007BFF;
          color: white;
          padding: 15px;
          text-align: center;
          border-radius: 8px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          background-color: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          border-radius: 8px;
          overflow: hidden;
        }
        th, td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        th {
          background-color: #0056b3;
          color: white;
        }
        tr:nth-child(even) {
          background-color: #f2f2f2;
        }
        tfoot td {
          font-weight: bold;
          background-color: #e9ecef;
        }
      </style>
    </head>
    <body>
      
     <header>
    <h1>Participación en Citas</h1>
    <p>Clientes nuevos, en crecimiento o recuperados - ${today.toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}</p>

  </header>

      <table>
        <thead>
          <tr>
            <th>CLAVE</th>
            <th>VENDEDOR</th>
            <th>ASISTIDAS / MES ACTUAL</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2">Total</td>
            <td>${total}</td>
          </tr>
        </tfoot>
      </table>

    </body>
    </html>
  `;
  }

  @UseGuards(AccessTokenGuard)
  @Put('updateInfo')
  updateInfoUser(@Body() UpdateInfoUserDto: UpdateInfoUserDto) {
    return this.usersService.updateInfoUser(UpdateInfoUserDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findByAllUsers')
  findByAllUsers() {
    return this.usersService.findBYAllUsers();
  }


  @Get('getCustomerCountsBySucursalAndMonth')
  getCustomerCountsBySucursalAndMonth() {
    return this.usersService.getCustomerCountsBySucursalAndMonth();
  }

  @UseGuards(AccessTokenGuard)
  @Get('findByUserAllUsersBranches')
  findByAllUsersByBranch() {
    return this.usersService.findByAllUsersByBranches();
  }

  @UseGuards(AccessTokenGuard)
  @Get('getAllUsers')
  findAllUsers() {
    return this.usersService.findAllUsers();
  }

  @UseGuards(AccessTokenGuard)
  @Get('getUserAllSucursales')
  findUserByAllSucursales() {
    return this.usersService.findUserBySucursale();
  }

  @UseGuards(AccessTokenGuard)
  @Get('getUserBySucursal/:sucursalId')
  findUserBySucursal(@Param('sucursalId', ParseIntPipe) id: number) {
    return this.usersService.findAllUserBySucursale(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get('getUserById/:Id')
  getUserById(@Param('Id', ParseIntPipe) id: number) {
    return this.usersService.getUserById(id);
  }

  @UseGuards(AccessTokenGuard)
  @Post() // http://localhost/users -> POST
  create(@Body() user: CreateUserDto) {
    return this.usersService.create(user);
  }

  @UseGuards(AccessTokenGuard)
  @Put(':id') // http://192.168.1.15:3000/users/:id -> PUT
  update(@Param('id', ParseIntPipe) id: number, @Body() user: UpdateUserDto) {
    return this.usersService.update(id, user);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id/password')
  async updatePassword(
    @Param('id') id: number,
    @Body('password') newPassword: string,
  ) {
    return this.usersService.updatePassword(id, newPassword);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    console.log('ID recibido:', id);
    return this.usersService.deleteUser(id);
  }

  @UseGuards(AccessTokenGuard)
  @Put('active/:id')
  activeUser(@Param('id', ParseIntPipe) id: number) {
    console.log('ID recibido:', id);
    return this.usersService.activeUser(id);
  }

  @UseGuards(AccessTokenGuard)
  @Put('updateWithImage/:id')
  updateWithImage(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UpdateUserDto,
  ) {
    console.log('ID recibido:', id);
    console.log('Datos del usuario recibidos:', user);
    return this.usersService.updateWithImage(id, user);
  }
}
