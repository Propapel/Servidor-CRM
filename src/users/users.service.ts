import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Brackets, In, Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { compare } from 'bcrypt';
import storage = require('../utils/cloud_storage.js');
import { Not, Like } from 'typeorm';
import { hash } from 'bcrypt';
import { Sucursales } from '../sucursales/entities/sucursale.entity';
import { UpdateInfoUserDto } from './dto/update-info-user';
import { Rol } from '../roles/rol.entity';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Rol) private rolesRepository: Repository<Rol>,
    @InjectRepository(Sucursales)
    private sucusalesRepository: Repository<Sucursales>,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async getUsersWithBranches() {
  return await this.usersRepository
    .createQueryBuilder('user')
    .leftJoin('user.sucursales', 'sucursal')
    .select([
      'user.id AS id',
      "CONCAT(user.name, ' ', user.lastname) AS Ejecutivo",
      'user.email AS email',
      'user.isDelete AS isDelete',
      'user.puesto AS puesto',
      'user.phone AS phone',
      'user.image AS image',
      'user.wallet AS wallet',
      'user.created_at AS createdAt',
      'user.updated_at AS updatedAt',
      'sucursal.id AS branchId',
      'sucursal.nombre AS branchName'
    ])
    .where(
      `user.email LIKE '%@propapel.com.mx' OR user.email LIKE '%@optivosa.com'`
    )
    .getRawMany(); // 🔹 Raw para poder usar aliases y CONCAT
}


  async fetchAllUserAppointments() {
    return await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.customers', 'customer')
      .leftJoin('user.sucursales', 'sucursal')
      .leftJoin('customer.reminders', 'reminder')
      .select([
        'user.id AS id',
        "CONCAT(user.name, ' ', user.lastname) AS Ejecutivo",
        'sucursal.nombre AS Sucursal',
        'user.wallet AS Cartera',
        'customer.company_name AS RazonSocial',
        'reminder.typeAppointment AS TipoDeCita',
        'IF(reminder.is_completed, "Sí", "No") AS Cumplio',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%h:%i %p") AS Hora',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%d-%m-%Y") AS Fecha',
      ])
      .where('reminder.reminder_date IS NOT NULL')
      .andWhere(
        `user.email LIKE '%@propapel.com.mx' OR user.email LIKE '%@optivosa.com'`,
      )
      .andWhere('reminder.typeAppointment IS NOT NULL')
      .getRawMany();
  }

  async findInfoUserAppointments() {
    return await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.customers', 'customer')
      .leftJoin('user.sucursales', 'sucursal')
      .leftJoin('customer.reminders', 'reminder')
      .select([
        'user.id AS id',
        "CONCAT(user.name, ' ', user.lastname) AS saleExecutive",
        'sucursal.nombre AS branch',
        'user.wallet AS wallet',
        'customer.company_name AS companyName',
        'customer.progressLead AS progressLead',
        'reminder.typeAppointment AS typeDate',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%h:%i %p") AS hora',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%d-%m-%Y") AS dateAppointment',
        'FROM_UNIXTIME(reminder.reminder_date / 1000) AS localDateTime',
      ])
      .where('reminder.reminder_date IS NOT NULL')
      .andWhere(
        `user.email LIKE '%@propapel.com.mx' OR user.email LIKE '%@optivosa.com'`,
      )
      .andWhere('reminder.typeAppointment IS NOT NULL')
      .getRawMany();
  }

  async findInfoUserAppointmentsByBranch(id: number) {
    return await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.customers', 'customer')
      .leftJoin('user.sucursales', 'sucursal')
      .leftJoin('customer.reminders', 'reminder')
      .select([
        'user.id AS id',
        "CONCAT(user.name, ' ', user.lastname) AS saleExecutive",
        'sucursal.nombre AS branch',
        'user.wallet AS wallet',
        'customer.company_name AS companyName',
        'customer.progressLead AS progressLead',
        'reminder.typeAppointment AS typeDate',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%h:%i %p") AS hora',
        'FROM_UNIXTIME(reminder.reminder_date / 1000, "%d-%m-%Y") AS dateAppointment',
        'FROM_UNIXTIME(reminder.reminder_date / 1000) AS localDateTime',
      ])
      .where('reminder.reminder_date IS NOT NULL')
      .andWhere('sucursal.id = :id', { id })
      .andWhere(
        `user.email LIKE '%@propapel.com.mx' OR user.email LIKE '%@optivosa.com'`,
      )
      .andWhere('reminder.typeAppointment IS NOT NULL')
      .getRawMany();
  }

  //This function find all users of branches
  async findAllUsersBranches() {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@optivosa.com') },
        { email: Like('%@propapel.com.mx') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
      ],
    });

    return { users };
  }

  async findAllUsesByBranch(sucursalId: number) {
    const users = await this.usersRepository.find({
      where: [
        {
          sucursales: { id: sucursalId },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          email: Like('%@optivosa.com'),
        },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
      ],
    });

    return { users };
  }

  create(user: CreateUserDto) {
    const newUser = this.usersRepository.create(user);
    return this.usersRepository.save(newUser);
  }

  async findAllUserBySucursale(sucursalId: number) {
    const users = await this.usersRepository.find({
      where: [
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('1') },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('1') },
          email: Like('%@optivosa.com'),
        },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
      ],
    });

    return { users };
  }

  async findAllUsers() {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@optivosa.com') },
        { email: Like('%@propapel.com.mx') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
      ],
    });

    return { users };
  }

  async getUserById(id: number) {
    const user = await this.usersRepository.findOne({
      where: [
        { id: id, email: Like('%@propapel.com.mx') },
        { id: id, email: Like('%@optivosa.com') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
      ],
    });
    return user;
  }

  async getAllUserBySucursales() {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@propapel.com.mx') },
        { email: Like('%@optivosa.com') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
      ],
    });
    return users;
  }

  async findUserBySucursale() {
    const usersFound = await this.usersRepository.find({
      where: [
        { email: Like('%@propapel.com.mx') },
        { email: Like('%@optivosa.com') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        ,
        'customers.conversation.customer',
      ],
    });

    const merida = 'Propapel Merida';
    const mty = 'Propapel Monterrey';
    const mexico = 'Propapel Mexico';

    const usersBySucursal = {
      merida: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === merida),
      ),
      monterrey: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === mty),
      ),
      mexico: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === mexico),
      ),
    };

    return usersBySucursal;
  }

  async findAll() {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@propapel.com.mx') },
        { email: Like('%@optivosa.com') },
      ],
    });

    const data = users.map((user) => ({
      lastname: user.lastname,
      name: user.name,
      phone: user.phone,
      image: user.image,
    }));

    return { users: data };
  }

  async update(id: number, user: UpdateUserDto) {
    console.log('ID recibido:', id);
    console.log('Datos del usuario recibidos:', user);
    const userFound = await this.usersRepository.findOneBy({ id: id });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }

    const updatedUser = Object.assign(userFound, user);
    return this.usersRepository.save(updatedUser);
  }

  async updateInfoUser(updateUserInfo: UpdateInfoUserDto) {
    console.log(updateUserInfo);

    // 2️⃣ Actualiza los datos del usuario
    const existingUser = await this.usersRepository.findOne({
      where: { id: updateUserInfo.id },
    });

    if (!existingUser) {
      throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
    }

    if (updateUserInfo.password.length > 0) {
      // 2. Hashear la nueva contraseña
      const hashedPassword = await hash(
        updateUserInfo.password,
        Number(process.env.HAST_SALT),
      );

      // 3. Actualizar la contraseña
      existingUser.password = hashedPassword;
    }

    // Actualiza los valores del usuario
    existingUser.name = updateUserInfo.name || existingUser.name;
    existingUser.lastname = updateUserInfo.lastname || existingUser.lastname;
    existingUser.email = updateUserInfo.email || existingUser.email;
    existingUser.phone = updateUserInfo.phone || existingUser.phone;
    existingUser.puesto = updateUserInfo.puesto || existingUser.puesto;

    // 3️⃣ Actualiza las sucursales del usuario
    let sucursalIds =
      updateUserInfo.sucusalIds && updateUserInfo.sucusalIds.length > 0
        ? updateUserInfo.sucusalIds
        : ['Propapel Merida'];

    const sucursales = await this.sucusalesRepository.find({
      where: { id: In(sucursalIds) },
    });

    existingUser.sucursales = sucursales; // Asigna las sucursales al usuario

    // 4️⃣ Actualiza los roles del usuario
    let rolesIds =
      updateUserInfo.rolesIds && updateUserInfo.rolesIds.length > 0
        ? updateUserInfo.rolesIds
        : ['Ejecutivo de ventas'];

    const roles = await this.rolesRepository.find({
      where: { id: In(rolesIds) },
    });

    existingUser.roles = roles; // Asigna los roles al usuario

    // 5️⃣ Si se proporciona una nueva imagen, la guarda
    if (updateUserInfo.image != existingUser.image) {
      const buffer = Buffer.from(updateUserInfo.image, 'base64');
      const pathImage = `profilePhoto_${Date.now()}`;
      const imageUrl = await storage.uploadFromBuffer(buffer, pathImage);

      if (imageUrl) {
        existingUser.image = imageUrl; // Actualiza la URL de la imagen
      }
    }

    // 6️⃣ Guarda el usuario actualizado en la base de datos
    const updatedUser = await this.usersRepository.save(existingUser);
  }

  async deleteUser(userId: number) {
    const userFound = await this.usersRepository.findOneBy({ id: userId });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    userFound.isDelete = true;
    await this.usersRepository.save(userFound);

    return { message: 'Usuario elimininado' };
  }

  async activeUser(userId: number) {
    const userFound = await this.usersRepository.findOneBy({ id: userId });
    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }
    userFound.isDelete = false;
    await this.usersRepository.save(userFound);

    return { message: 'Usuario elimininado' };
  }

  async updatePassword(
    userId: number,
    newPassword: string,
  ): Promise<{ message: string }> {
    // 1. Buscar al usuario por su ID
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }

    // 2. Hashear la nueva contraseña
    const hashedPassword = await hash(
      newPassword,
      Number(process.env.HAST_SALT),
    );

    // 3. Actualizar la contraseña
    user.password = hashedPassword;

    // 4. Guardar el usuario con la nueva contraseña
    await this.usersRepository.save(user);

    // 5. Retornar un mensaje de confirmación
    return { message: 'Contraseña actualizada correctamente' };
  }

  async updateWithImage(id: number, user: UpdateUserDto) {
    const userFound = await this.usersRepository.findOneBy({ id: id });

    if (!userFound) {
      throw new HttpException('Usuario no existe', HttpStatus.NOT_FOUND);
    }

    // Solo intentamos procesar la imagen si está presente
    if (user.image != '') {
      const buffer = Buffer.from(user.image, 'base64'); // Asegúrate de que image sea una cadena Base64 válida
      const pathImage = `profilePhoto_${Date.now()}`;
      const imageUrl = await storage.uploadFromBuffer(buffer, pathImage);

      if (imageUrl) {
        user.image = imageUrl; // Actualiza la URL de la imagen en el objeto user
      }
    }
    const updatedUser = Object.assign(userFound, user);
    console.log('User before saving:', updatedUser);

    await this.usersRepository.save(updatedUser);

    console.log('User saved successfully');

    const newUser = await this.usersRepository.findOneBy({ id });

    const data = {
      lastname: newUser.lastname,
      name: newUser.name,
      phone: newUser.phone,
      image: user.image,
    };
    console.log();
    return data;
  }

  // NEW VERSION GET INFO

  async findBYAllUsers() {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@optivosa.com') },
        { email: Like('%@propapel.com.mx') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.notes',
        'customers.interactions',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
      ],
    });

    return { users };
  }

  async getCustomerCountsBySucursalAndMonth(): Promise<
    Record<string, Array<{ year: number; month: number; count: number }>>
  > {
    const emailFilters = ['%@propapel.com.mx', '%@optivosa.com'];
    const sucursalesTarget = [
      'Propapel Merida',
      'Propapel Monterrey',
      'Propapel Mexico',
    ];

    // Query: contar customers agrupados por sucursal, año y mes
    const rawCounts: CustomerCountByMonth[] = await this.usersRepository
      .createQueryBuilder('user')
      .leftJoin('user.sucursales', 'sucursal')
      .leftJoin('user.customers', 'customer')
      .select([
        'sucursal.nombre as sucursalNombre',
        'EXTRACT(YEAR FROM customer.created_at) as year',
        'EXTRACT(MONTH FROM customer.created_at) as month',
        'COUNT(customer.customer_id) as customerCount',
      ])
      .where(
        new Brackets((qb) => {
          emailFilters.forEach((email, idx) => {
            if (idx === 0) {
              qb.where('user.email LIKE :email0', { email0: email });
            } else {
              qb.orWhere(`user.email LIKE :email${idx}`, {
                [`email${idx}`]: email,
              });
            }
          });
        }),
      )
      .andWhere('sucursal.nombre IN (:...sucursales)', {
        sucursales: sucursalesTarget,
      })
      // Filtrar que mes esté entre 1 y 12 para evitar month=0
      .andWhere('EXTRACT(MONTH FROM customer.created_at) BETWEEN 1 AND 12')
      .groupBy('sucursal.nombre')
      .addGroupBy('year')
      .addGroupBy('month')
      .getRawMany();

    // Agrupar por sucursal con estructura simplificada
    const result: Record<
      string,
      Array<{ year: number; month: number; count: number }>
    > = {
      merida: [],
      monterrey: [],
      mexico: [],
    };

    rawCounts.forEach((row) => {
      const nombreLower = (row.sucursalNombre || '').toLowerCase();

      const sucursalKey = nombreLower.includes('merida')
        ? 'merida'
        : nombreLower.includes('monterrey')
          ? 'monterrey'
          : nombreLower.includes('mexico')
            ? 'mexico'
            : null;

      if (sucursalKey) {
        const year = Number(row.year);
        const month = Number(row.month);
        const count = Number(row.customerCount);

        // Validar mes y año antes de agregar
        if (month >= 1 && month <= 12 && year > 0 && count >= 0) {
          result[sucursalKey].push({
            year,
            month,
            count,
          });
        }
      }
    });

    return result;
  }

  /**
   *
   * @returns
   */
  async findByAllUsersByBranches() {
    const usersFound = await this.usersRepository.find({
      where: [
        { email: Like('%@propapel.com.mx') },
        { email: Like('%@optivosa.com') },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.notes',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
      ],
    });

    const merida = 'Propapel Merida';
    const mty = 'Propapel Monterrey';
    const mexico = 'Propapel Mexico';

    const usersBySucursal = {
      merida: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === merida),
      ),
      monterrey: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === mty),
      ),
      mexico: usersFound.filter((user) =>
        user.sucursales.some((sucursal) => sucursal.nombre === mexico),
      ),
    };

    return usersBySucursal;
  }
  async findAllManagerSaleAndRegionalManager(sucursalId: number) {
    const usersFound = await this.usersRepository.find({
      where: [
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('2') },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('2') },
          email: Like('%@optivosa.com'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('3') },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('3') },
          email: Like('%@optivosa.com'),
        },
      ],
    });

    return usersFound;
  }

  /**
   * Find all technical users by branch
   * This function retrieves all technical users associated with a specific branch.
   * It filters users based on their role and email domain, ensuring that only those with the '5' role (technical) and specific email domains are returned.
   *
   *
   * @param sucursalId
   * @returns
   * @memberof UsersService
   */
  async findAllTechnicalByBranch(sucursalId: number) {
    const users = await this.usersRepository.find({
      where: [
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('5') },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('5') },
          email: Like('%@optivosa.com'),
        },
      ],
    });
    if (!users || users.length === 0) {
      throw new HttpException(
        `No se encontraron técnicos para la sucursal con ID ${sucursalId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return users;
  }

  /**
   * Find all users by branch
   * This function retrieves all users associated with a specific branch.
   * It filters users based on their role and email domain, ensuring that only those with the '1' role (sales executive) and specific email domains are returned.
   *
   * @param sucursalId - The ID of the branch to filter users by.
   * @return An object containing an array of users that match the criteria.
   * @memberof UsersService
   */
  async findAllUserByBranch(sucursalId: number) {
    const users = await this.usersRepository.find({
      where: [
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('1') },
          email: Like('%@propapel.com.mx'),
        },
        {
          sucursales: { id: sucursalId },
          roles: { id: Like('1') },
          email: Like('%@optivosa.com'),
        },
      ],
      relations: [
        'sucursales',
        'roles',
        'customers',
        'customers.notes',
        'customers.interactions',
        'customers.purchases',
        'customers.reminders',
        'customers.projects',
        'customers.conversations',
        'customers.conversations.messages',
        'customers.conversations.customer',
      ],
    });

    return { users };
  }

  async findAllDatesNowByAllUsers(): Promise<InfoTableDatesDto[]> {
    /*
     const timestamp: number = Number(reminder.reminder_date);
      const dateUTC = new Date(timestamp).toISOString();
      const reminderDate = new Date(dateUTC);
      const today = new Date();
    */
    const today = new Date();

    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@optivosa.com') },
        { email: Like('%@propapel.com.mx') },
      ],
      relations: ['sucursales', 'customers', 'customers.reminders'],
    });

    const results: InfoTableDatesDto[] = [];

    for (const user of users) {
      const saleExecutive = `${user.name} ${user.lastname}`;
      const clave = user.wallet || 'Sin clave';
      let totalDates = 0;

      for (const customer of user.customers || []) {
        for (const reminder of customer.reminders || []) {
          const timestamp: number = Number(reminder.reminder_date);
          const dateUTC = new Date(timestamp).toISOString();
          const reminderDate = new Date(dateUTC);

          if (
            reminder.is_completed &&
            reminderDate.getUTCFullYear() === today.getUTCFullYear() &&
            reminderDate.getUTCMonth() === today.getUTCMonth() &&
            this.isAppointmentTypeValid(reminder.typeAppointment)
          ) {
            totalDates++;
          }
        }
      }

      if (totalDates > 0) {
        results.push({
          saleExecutive,
          clave,
          totalDates,
        });
      }
    }

    return results;
  }

  private isAppointmentTypeValid(type: string): boolean {
    const validTypes = ['Presencial', 'Reunion Remota']; // ejemplo
    return validTypes.includes(type);
  }

  async findAllDatesByMonthYear(
    month: number,
    year: number,
  ): Promise<InfoTableDatesDto[]> {
    const users = await this.usersRepository.find({
      where: [
        { email: Like('%@optivosa.com') },
        { email: Like('%@propapel.com.mx') },
      ],
      relations: ['sucursales', 'customers', 'customers.reminders'],
    });

    const results: InfoTableDatesDto[] = [];

    for (const user of users) {
      const saleExecutive = `${user.name} ${user.lastname}`;
      const clave = user.wallet || 'Sin clave';
      let totalDates = 0;

      for (const customer of user.customers || []) {
        for (const reminder of customer.reminders || []) {
          const timestamp: number = Number(reminder.reminder_date);
          const reminderDate = new Date(timestamp);

          if (
            reminder.is_completed &&
            reminderDate.getUTCFullYear() === year &&
            reminderDate.getUTCMonth() === month - 1 && // OJO: getUTCMonth() es base 0 (enero = 0)
            this.isAppointmentTypeValid(reminder.typeAppointment)
          ) {
            totalDates++;
          }
        }
      }

      if (totalDates > 0) {
        results.push({
          saleExecutive,
          clave,
          totalDates,
        });
      }
    }

    return results;
  }
}

export class InfoTableDatesDto {
  saleExecutive: string;
  clave: string;
  totalDates: number;
}

interface CustomerCountByMonth {
  userId: number;
  sucursalNombre: string;
  year: number;
  month: number;
  customerCount: number;
}
