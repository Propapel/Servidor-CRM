import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateLeadNoteDto } from './dto/create-lead-note.dto';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { Repository } from 'typeorm';
import { LeadNote } from './entities/lead-note.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { User } from '../users/user.entity';
const timeRelative = require('../utils/time_relative');

@Injectable()
export class LeadNotesService {
  constructor(
    @InjectRepository(LeadNote) private leadsNotesService: Repository<LeadNote>,
    @InjectRepository(Customer) private customerService: Repository<Customer>,
    @InjectRepository(User) private userService: Repository<User>,
  ) {}

  /**
   * Funcion que crea un nota para el lead
   * @param createLeadNoteDto Clase que contiene toda la informacion del lead
   * @returns Retorna la nota ya creada
   */
  /**
 * Obtiene todas las notas que aún no han sido leídas por el usuario, sin marcarlas como leídas.
 * Se limita solo a los clientes asociados al usuario.
 */
async getUnreadNotesForUser(userId: number): Promise<{ notes: any[] }> {
  const notes = await this.leadsNotesService
    .createQueryBuilder('note')
    .leftJoinAndSelect('note.read_by', 'readBy')
    .leftJoinAndSelect('note.customer', 'customer')
    .leftJoinAndSelect('note.author', 'author')
    .leftJoin('customer.user', 'user')
    .where('author.id != :userId', { userId })
    .andWhere('user.id = :userId', { userId }) // solo notas de clientes asignados al usuario
    .getMany();

  const formattedNotes = notes.map(note => ({
    id: note.id,
    content: note.content,
    created_at: note.created_at,
    timeRelative: timeRelative(new Date().getTime(), note.created_at.getTime()),
    customerId: note.customer.customer_id,
    customerName: note.customer.company_name,
    author: {
      id: note.author.id,
      name: note.author.name,
      lastname: note.author.lastname,
      email: note.author.email,
      isDelete: note.author.isDelete,
      puesto: note.author.puesto,
      phone: note.author.phone,
      image: note.author.image,
      password: note.author.password,
      created_at: note.author.created_at,
      updated_at: note.author.updated_at,
      refreshToken: note.author.refreshToken
    }
  }));

  return { notes: formattedNotes };
}



  async create(createLeadNoteDto: CreateLeadNoteDto) {
    //Busca al usuario
    const user = await this.userService.findOne({
      where: {
        id: createLeadNoteDto.userId,
      },
    });

    //Busca al lead
    const customer = await this.customerService.findOne({
      where: {
        customer_id: createLeadNoteDto.customerId,
      },
    });

    //Crea la nota
    const leadNote = await this.leadsNotesService.save({
      content: createLeadNoteDto.content,
      author: user,
      customer: customer,
    });

    return {
      id: leadNote.id,
      content: leadNote.content,
      created_at: leadNote.created_at,
      author: leadNote.author,
    };
  }

  async countUnreadNotes(userId: number, customerId: number) {
    const allNotes = await this.leadsNotesService.find({
      where: { customer: { customer_id: customerId } },
      relations: ['read_by'],
    });

    return allNotes.filter(
      (note) => !note.read_by.some((read) => read.id === userId),
    ).length;
  }

  async markAllAsReadForAllCustomers(userId: number, customerId: number) {
    // Obtener el usuario que está marcando las notas
    const user = await this.userService.findOne({ where: { id: userId } });

    // Obtener el cliente con el id correspondiente
    const customer = await this.customerService.findOne({
      where: { customer_id: customerId },
      relations: ['notes'], // Asegúrate de incluir las notas del cliente
    });

    if (!customer) {
      throw new Error('Cliente no encontrado');
    }

    // Filtrar las notas del cliente que el usuario aún no ha leído
    const unreadNotes = customer.notes.filter(
      (note) => !note.read_by.some((readUser) => readUser.id === userId),
    );

    // Agregar al usuario al campo `read_by` de cada nota no leída
    unreadNotes.forEach((note) => {
      note.read_by.push(user); // Añadir al usuario en la relación many-to-many
    });

    // Guardar las notas actualizadas
    await this.leadsNotesService.save(unreadNotes);

    return { markedAsRead: unreadNotes.length };
  }

  async markAllAsReadForUser(userId: number) {
    // Obtener el usuario que está marcando las notas
    const user = await this.userService.findOne({
      where: { id: userId },
      relations: ['customers'], // Asegúrate de incluir la lista de clientes del usuario
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Filtrar las notas de los clientes asociados al usuario
    const unreadNotes: LeadNote[] = [];

    // Iterar sobre los clientes del usuario
    for (const customer of user.customers) {
      // Obtener todas las notas del cliente
      const notes = await this.leadsNotesService.find({
        where: { customer: { customer_id: customer.customer_id } },
        relations: ['read_by'], // Asegúrate de incluir la relación read_by
      });

      // Filtrar las notas no leídas por el usuario
      const notesNotReadByUser = notes.filter(
        (note) => !note.read_by.some((readUser) => readUser.id === userId),
      );

      // Añadir las notas no leídas a la lista
      unreadNotes.push(...notesNotReadByUser);
    }

    // Agregar al usuario al campo `read_by` de cada nota no leída
    unreadNotes.forEach((note) => {
      note.read_by.push(user); // Añadir al usuario en la relación many-to-many
    });

    // Guardar las notas actualizadas
    await this.leadsNotesService.save(unreadNotes);

    return { markedAsRead: unreadNotes.length };
  }

  findAll() {
    return `This action returns all leadNotes`;
  }

  findOne(id: number) {
    return `This action returns a #${id} leadNote`;
  }

  update(id: number, updateLeadNoteDto: UpdateLeadNoteDto) {
    return `This action updates a #${id} leadNote`;
  }

  remove(id: number) {
    return `This action removes a #${id} leadNote`;
  }
}
