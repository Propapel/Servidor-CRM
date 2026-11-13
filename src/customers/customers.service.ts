import { Optional } from '@nestjs/common';
import { LeadPushService } from '../push/lead-push.service';
import { Request } from 'express';
import { Brackets } from 'typeorm';
import { PageQueryDto, likeTerm } from '../common/pagination/page-query.dto';
import { normalizePage, orderByIds, safeUserSelect, toPagedResponse } from '../common/pagination/paged-response';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entity/customer.entity';
import { Like, Not, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { User } from '../users/user.entity';
import { Reminder } from '../remider/entity/remider.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { Interaction } from '../interation/entity/interation.entity';
import { Opportunity } from '../oportunity/entity/oportunity.entity';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LeadHistory } from '../lead-history/entities/lead-history.entity';
import { LeadAction } from '../enums/lead-action';
import { UpdateStatusCustomerDto } from './dto/update_status_customer.dto';
import { LeadStatus } from '../enums/lead_status';
import { ManagerReviewStatus } from '../enums/lead_manager_review';
import { MailService } from '../auth/service/MailService';
import { NotifityAlertAssignedCustomer } from '../auth/service/notifityAlertAssignedCustomer.dto';
import { Conversation } from '../conversation/entities/conversation.entity';
import { CalendarEvent } from '../calendar-event/entities/calendar-event.entity';


/** Limpia los datos de CRM que manda la app: vacíos a null, fecha y monto con su tipo. */
function normalizeCrmFields<T extends Record<string, any>>(data: T): T {
  const out: Record<string, any> = { ...data };
  for (const key of ['job_title', 'lead_source', 'industry', 'company_size', 'website', 'rfc', 'city', 'priority']) {
    if (key in out) out[key] = typeof out[key] === 'string' && out[key].trim() ? out[key].trim() : null;
  }
  if ('rfc' in out && out.rfc) out.rfc = String(out.rfc).toUpperCase();
  if ('estimated_value' in out) {
    const n = Number(out.estimated_value);
    out.estimated_value = out.estimated_value === null || out.estimated_value === '' || !Number.isFinite(n) || n <= 0 ? null : n;
  }
  if ('expected_close_date' in out) {
    const d = out.expected_close_date ? new Date(out.expected_close_date) : null;
    out.expected_close_date = d && !Number.isNaN(d.getTime()) ? d : null;
  }
  if ('tags' in out) {
    const tags = Array.isArray(out.tags) ? out.tags.map((t: unknown) => String(t).trim()).filter(Boolean) : [];
    out.tags = tags.length ? [...new Set(tags)].slice(0, 20) : null;
  }
  return out as T;
}

@Injectable()
export class CustomersService {
  constructor(
    private mailService: MailService,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @InjectRepository(Opportunity)
    private opportunitiesRepository: Repository<Opportunity>,
    @InjectRepository(Interaction)
    private interactionsRepository: Repository<Interaction>,
    @InjectRepository(Purchase)
    private purchasesRepository: Repository<Purchase>,
    @InjectRepository(Reminder)
    private remindersRepository: Repository<Reminder>,
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(LeadHistory)
    private leadHistoryRepository: Repository<LeadHistory>,
    @InjectRepository(Conversation)
    private conversationRepository: Repository<Conversation>,
    @InjectRepository(CalendarEvent)
    private calendarEventRepository: Repository<CalendarEvent>,
    @Optional() private readonly leadPush?: LeadPushService,
  ) {}


  async create(createCustomerDto: CreateCustomerDto): Promise<Customer> {
    const {
      opportunities,
      interactions,
      purchases,
      reminders,
      ...customerData
    } = createCustomerDto;

    const user = await this.userRepository.findOne({
      where: { id: createCustomerDto.idUser },
    });

    // Crear el cliente
    const customer = this.customersRepository.create(normalizeCrmFields(customerData) as any as Customer);
    customer.user = user;

    await this.customersRepository.save(customer);

    // Crear las oportunidades relacionadas (si se proporcionaron)
    if (opportunities) {
      const opportunityEntities = opportunities.map((opportunityDto) => {
        return this.opportunitiesRepository.create({
          ...opportunityDto,
          customer,
        });
      });
      await this.opportunitiesRepository.save(opportunityEntities);
    }

    // Crear las interacciones relacionadas (si se proporcionaron)
    if (interactions) {
      const reminderEntities = interactions.map((reminderDto) => {
        return this.remindersRepository.create({
          ...reminderDto,
          customer,
        });
      });

      await this.remindersRepository.save(reminderEntities);
    }

    // Crear las compras relacionadas (si se proporcionaron)
    if (purchases) {
      const purchaseEntities = purchases.map((purchaseDto) => {
        return this.purchasesRepository.create({
          ...purchaseDto,
          customer,
        });
      });
      await this.purchasesRepository.save(purchaseEntities);
    }

    // Crear los recordatorios relacionados (si se proporcionaron)
    if (reminders) {
      const reminderEntities = reminders.map((reminderDto) => {
        return this.remindersRepository.create({
          ...reminderDto,
          customer,
        });
      });
      await this.remindersRepository.save(reminderEntities);
    }

    return customer;
  }

  async createNewVersion(
    createCustomerDto: CreateCustomerDto,
  ): Promise<Customer> {
    const {
      opportunities,
      interactions,
      purchases,
      reminders,
      ...customerData
    } = createCustomerDto;

    const user = await this.userRepository.findOne({
      where: { id: createCustomerDto.idUser },
    });

    // Crear el cliente
    const customer = this.customersRepository.create(normalizeCrmFields(customerData) as any as Customer);
    customer.user = user;

    await this.customersRepository.save(customer);

    // Crear las oportunidades relacionadas (si se proporcionaron)

    // Crear las compras relacionadas (si se proporcionaron)
    if (purchases) {
      const purchaseEntities = purchases.map((purchaseDto) => {
        return this.purchasesRepository.create({
          ...purchaseDto,
          customer,
        });
      });
      await this.purchasesRepository.save(purchaseEntities);
    }

    if (interactions) {
      const userEvents = await this.calendarEventRepository.find({
        where: { createdBy: { id: user.id } },
        relations: ['reminders'],
      });

      for (const reminderDto of interactions) {
        const reminderDate = new Date(reminderDto.reminder_date);

        // Crear el reminder con su customer
        const reminder = this.remindersRepository.create({
          ...reminderDto,
          customer,
        });

        // Buscar evento con misma fecha
        const matchingEvent = userEvents.find((event) => {
          const activityDate = new Date(event.activityDate);
          return (
            activityDate.getFullYear() === reminderDate.getFullYear() &&
            activityDate.getMonth() === reminderDate.getMonth() &&
            activityDate.getDay() === reminderDate.getDay()
          );
        });

        // Guardar el reminder primero
        const savedReminder = await this.remindersRepository.save(reminder);

        if (matchingEvent) {
          // Asegúrate que reminders esté inicializado
          if (!matchingEvent.reminders) {
            matchingEvent.reminders = [];
          }

          // Asocia el reminder al evento
          matchingEvent.reminders.push(savedReminder);

          // Ahora guarda el evento con su nuevo reminder relacionado
          await this.calendarEventRepository.save(matchingEvent);
        }
      }
    }

    // Crear los recordatorios relacionados (si se proporcionaron)
    if (reminders) {
      const userEvents = await this.calendarEventRepository.find({
        where: { createdBy: { id: user.id } },
        relations: ['reminders'],
      });

      for (const reminderDto of reminders) {
        const timestamp: number = Number(reminderDto.reminder_date);
        const dateUTC = new Date(timestamp).toISOString();
        const reminderDate = new Date(dateUTC);

        console.log(userEvents);
        console.log(reminderDto);
        // Crear el reminder con su customer
        const reminder = this.remindersRepository.create({
          ...reminderDto,
          customer,
        });

        // Buscar evento con misma fecha
        const matchingEvent = userEvents.find((event) => {
          const activityDate = new Date(event.activityDate);
          console.log(event.id)
          console.log(activityDate)
           console.log('Este es la fecha del reminder')
          console.log(reminderDate)
          return (
            activityDate.getFullYear() === reminderDate.getFullYear() &&
            activityDate.getMonth() === reminderDate.getMonth() &&
            activityDate.getDay() === reminderDate.getDay()
          );
        });

        console.log(matchingEvent)

        // Guardar el reminder primero
        const savedReminder = await this.remindersRepository.save(reminder);

        if (matchingEvent) {
        
          // Asocia el reminder al evento
          matchingEvent.reminders.push(savedReminder);

          // Ahora guarda el evento con su nuevo reminder relacionado
          await this.calendarEventRepository.save(matchingEvent);
        }
      }
    }

    await this.leadHistoryRepository.save({
      customerId: customer.customer_id,
      action: LeadAction.CREATED,
      performedById: user.id,
    });

    return customer;
  }

  async getCustomerById(customerId: number) {
    const customer = await this.customersRepository.findOne({
      relations: ['opportunities', 'interactions', 'purchases', 'reminders'],
      where: {
        customer_id: customerId,
      },
    });

    await this.customersRepository.save(customer); // Persistir el progreso calculado

    return customer;
  }

  /**
   * Recalcula progreso/estatus y guarda SOLO los clientes que cambiaron, y solo esas dos columnas.
   * Antes se hacía save() de cada cliente con todas sus relaciones en cada consulta (cientos de queries por GET).
   */
  private async refreshProgress(customers: Customer[], userId: number) {
    const changed: Customer[] = [];
    for (const customer of customers) {
      const prevStatus = customer.status;
      const prevProgress = customer.progressLead;
      customer.calculateProgress(userId);
      if (customer.status !== prevStatus || Number(customer.progressLead) !== Number(prevProgress)) {
        changed.push(customer);
      }
    }
    if (changed.length > 0) {
      await this.customersRepository.manager.transaction(async (em) => {
        for (const c of changed) {
          await em.update(
            Customer,
            { customer_id: c.customer_id },
            { status: c.status, progressLead: c.progressLead },
          );
        }
      });
    }
    return customers;
  }

  async getMyCustomer(id: number) {
    const getMyCustomers = await this.customersRepository.find({
      where: {
        user: { id },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      }, // Filtra por el id del usuario relacionado,
      relations: ['opportunities', 'interactions', 'purchases', 'reminders'],
    });

    const updatedCustomers = await this.refreshProgress(getMyCustomers, id);
    return { customers: updatedCustomers };
  }

  async getAllCustomersBySucursal() {
    const customers = await this.customersRepository.find({
      where: {
        user: {
          email: Like('%@propapel.com.mx'),
        },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      },
      relations: [
        'opportunities',
        'interactions',
        'purchases',
        'reminders',
        'projects',
        'user.sucursales',
      ],
    });
  }
  async updateStatusLead(updateStatusCustomerDto: UpdateStatusCustomerDto) {
    const { customerId, status, userId, managerId } = updateStatusCustomerDto;

    const customerFound = await this.customersRepository.findOne({
      where: { customer_id: customerId },
    });

    let userAnteriorAssing = null;

    if (updateStatusCustomerDto.userId != null) {
      userAnteriorAssing = customerFound.user.id;
    }

    if (!customerFound) {
      throw new HttpException('Nose encontro el cliente', HttpStatus.NOT_FOUND);
    }

    customerFound.managerReviewStatus =
      ManagerReviewStatus[status as keyof typeof ManagerReviewStatus];

    if (userId != null) {
      const userAssigned = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!userAssigned) {
        throw new HttpException(
          'Nose encontro el usuario',
          HttpStatus.NOT_FOUND,
        );
      }

      customerFound.user = userAssigned;
    }

    await this.customersRepository.save(customerFound); // Guardar cambios en el cliente

    let leadAction: LeadAction;

    switch (ManagerReviewStatus[status as keyof typeof ManagerReviewStatus]) {
      case ManagerReviewStatus.REVIEWED:
        leadAction = LeadAction.REVIEWED;
        break;
      case ManagerReviewStatus.IN_PROGRESS:
        leadAction = LeadAction.ACCEPTED;
        break;
      case ManagerReviewStatus.DISCARDED:
        leadAction = LeadAction.DISCARDED;
        break;
      default:
        leadAction = LeadAction.REASSIGNED;
        break;
    }

    if (leadAction == LeadAction.REASSIGNED) {
      await this.leadHistoryRepository.save({
        customerId: customerFound.customer_id,
        action: leadAction,
        performedById: managerId,
        userAnteriorAssing: userAnteriorAssing,
        userAssigned: updateStatusCustomerDto.userId,
        notes: updateStatusCustomerDto.notesOfUpdate,
      });
      const notif = new NotifityAlertAssignedCustomer();
      notif.emailUserAssignment = customerFound.user.email;
      notif.customer = customerFound.company_name;
      notif.user = customerFound.user.name;

      await this.mailService.notifityNewAssigmentLead(notif);
    } else {
      await this.leadHistoryRepository.save({
        customerId: customerFound.customer_id,
        action: leadAction,
        performedById: managerId,
        notes: updateStatusCustomerDto.notesOfUpdate,
      });
    }
    this.leadPush?.leadReviewed({
      customerId: customerFound.customer_id,
      companyName: customerFound.company_name,
      ownerId: customerFound.user?.id,
      status: leadAction === LeadAction.REASSIGNED ? 'REASSIGNED' : String(customerFound.managerReviewStatus),
      managerId,
      notes: updateStatusCustomerDto.notesOfUpdate,
    });
    return {
      message: 'Customer status updated successfully',
      customerId: customerFound.customer_id,
      newStatus: customerFound.managerReviewStatus,
      assignedUser: userId ?? null,
    };
  }

  async getFunnerCharByBrach(branch: string) {
    const customers = await this.customersRepository.find({
      where: {
        user: {
          sucursales: {
            nombre: branch, // Asegúrate de que `nombre` es un atributo correcto de Sucursales
          },
          email: Like('%@propapel.com.mx'),
        },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      },
      relations: [
        'opportunities',
        'interactions',
        'purchases',
        'reminders',
        'projects',
      ],
    });

    const funnelData = {
      prospectos: customers.length,
      contactados: customers.filter((c) => c.status == LeadStatus.CONTACTED)
        .length,
      interesados: customers.filter((c) => c.status == LeadStatus.INTERESTED)
        .length,
      negociacion: customers.filter(
        (c) => c.status == LeadStatus.NEGOTIATION, //c.projects.some((p) => p.status === 'En negociacion'),
      ).length,
      cerrados: customers.filter((c) => c.status == LeadStatus.CLIENT).length,
    };

    return funnelData;
  }
  async categorizeLeads() {
    const customers = await this.customersRepository.find({
      where: {
        user: {
          email: Like('%@propapel.com.mx'),
        },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      },
      relations: [
        'opportunities',
        'interactions',
        'purchases',
        'reminders',
        'projects',
      ],
    });

    const funnelData = {
      prospectos: customers.length,
      contactados: customers.filter((c) => c.status == LeadStatus.CONTACTED)
        .length,
      interesados: customers.filter((c) => c.status == LeadStatus.INTERESTED)
        .length,
      negociacion: customers.filter(
        (c) => c.status == LeadStatus.NEGOTIATION, //c.projects.some((p) => p.status === 'En negociacion'),
      ).length,
      cerrados: customers.filter((c) => c.status == LeadStatus.CLIENT).length,
    };
    return funnelData;
  }

  async getAllCustomer() {
    const customers = await this.customersRepository.find({
      where: {
        user: {
          email: Like('%@propapel.com.mx'),
        },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      },
      relations: ['opportunities', 'interactions', 'purchases', 'reminders'],
    });
    return { customers: customers };
  }

  /**
   *
   */

  async findById(id: number) {
    const customer = await this.customersRepository.findOne({
      relations: [
        'opportunities',
        'interactions',
        'purchases',
        'reminders',
        'notes',
      ],
      where: {
        customer_id: id,
      },
    });

    return customer;
  }

  /**
   * Funcion para trabajar las llamadas de un solo lead
   * @param idCustomer F
   * @param updateCustomerDto
   */
  async findByUserId(id: number) {
    const getMyCustomers = await this.customersRepository.find({
      where: {
        user: { id },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      }, // Filtra por el id del usuario relacionado,
      relations: [
        'opportunities',
        'interactions',
        'purchases',
        'reminders',
        'notes',
      ],
    });

    const updatedCustomers = await this.refreshProgress(getMyCustomers, id);
    return { customers: updatedCustomers };
  }

  async updateCustomer(
    idCustomer: number,
    updateCustomerDto: UpdateCustomerDto,
  ) {
    const customer = await this.customersRepository.findOneBy({
      customer_id: idCustomer,
    });

    // Use `updateCustomerDto` directly to set fields
    customer.address = updateCustomerDto.address;
    customer.company_name = updateCustomerDto.company_name;
    customer.contact_name = updateCustomerDto.contact_name;
    customer.email = updateCustomerDto.email;
    customer.type_of_client = updateCustomerDto.type_of_client;

    // Assign updated fields to `customer` and rename the result variable
    const updatedCustomer = Object.assign(customer, normalizeCrmFields(updateCustomerDto));
    await this.customersRepository.save(updatedCustomer);
  }

  /**
   * Leads paginados de un ejecutivo con búsqueda y filtros en el servidor.
   * Misma forma que findAllCustomersByUserId, pero solo los de la página y sin datos sensibles del usuario.
   */
  async findPage(
    query: PageQueryDto & { userId: number; typeClient?: string; month?: number; year?: number },
    request?: Request,
  ) {
    const { page, limit, offset } = normalizePage(query.page, query.limit);
    const term = likeTerm(query.search);

    const base = this.customersRepository
      .createQueryBuilder('customer')
      .where('customer.userId = :userId', { userId: query.userId })
      .andWhere('customer.managerReviewStatus != :discarded', { discarded: ManagerReviewStatus.DISCARDED });
    if (query.typeClient) base.andWhere('customer.type_of_client = :typeClient', { typeClient: query.typeClient });
    if (query.year) {
      // Rango de fechas (usa el índice) en lugar de YEAR()/MONTH() sobre la columna
      const from = new Date(Date.UTC(query.year, query.month ? query.month - 1 : 0, 1));
      const to = query.month
        ? new Date(Date.UTC(query.year, query.month, 1))
        : new Date(Date.UTC(query.year + 1, 0, 1));
      base.andWhere('customer.created_at >= :from AND customer.created_at < :to', { from, to });
    } else if (query.month) {
      base.andWhere('MONTH(customer.created_at) = :month', { month: query.month });
    }
    if (term) {
      base.andWhere(
        new Brackets((qb) =>
          qb
            .where('customer.company_name LIKE :term', { term })
            .orWhere('customer.contact_name LIKE :term', { term })
            .orWhere('customer.email LIKE :term', { term })
            .orWhere('customer.phone_number LIKE :term', { term })
            .orWhere('customer.type_of_client LIKE :term', { term })
            .orWhere('customer.address LIKE :term', { term }),
        ),
      );
    }

    const [total, rows] = await Promise.all([
      base.clone().getCount(),
      base
        .clone()
        .select('customer.customer_id', 'id')
        .orderBy('customer.created_at', 'DESC')
        .addOrderBy('customer.customer_id', 'DESC')
        .offset(offset)
        .limit(limit)
        .getRawMany<{ id: number }>(),
    ]);
    const ids = rows.map((r) => Number(r.id));
    if (ids.length === 0) return toPagedResponse([], total, page, limit, request);

    const customers = await this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin('customer.user', 'user')
      .addSelect(safeUserSelect('user'))
      .leftJoinAndSelect('customer.opportunities', 'opportunities')
      .leftJoinAndSelect('customer.interactions', 'interactions')
      .leftJoinAndSelect('customer.purchases', 'purchases')
      .leftJoinAndSelect('customer.reminders', 'reminders')
      .leftJoinAndSelect('customer.notes', 'notes')
      .where('customer.customer_id IN (:...ids)', { ids })
      .getMany();

    return toPagedResponse(orderByIds(customers, ids, (c) => c.customer_id), total, page, limit, request);
  }

  async findAllCustomerByUserId(id: number) {
  // Traer solo los campos esenciales y relaciones necesarias
  const customers = await this.customersRepository
  .createQueryBuilder('customer')
  .leftJoinAndSelect('customer.user', 'user') // 🔹 Asegura que user esté definido
  .leftJoinAndSelect('customer.opportunities', 'opportunities')
  .leftJoinAndSelect('customer.interactions', 'interactions')
  .leftJoinAndSelect('customer.purchases', 'purchases')
  .leftJoinAndSelect('customer.reminders', 'reminders')
  .leftJoinAndSelect('customer.notes', 'notes')
  .where('customer.userId = :id', { id })
  .andWhere('customer.managerReviewStatus != :discarded', { discarded: ManagerReviewStatus.DISCARDED })
  .getMany();

  return { customers: customers };
}


  async findAllCustomersByTypes(id: number) {
    const customersFound = await this.customersRepository.find({
      where: {
        user: {
          id: id,
        },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      },
    });

    const data = {
      all: customersFound.length,
      news: customersFound.filter((c) => c.type_of_client.includes('Nuevo'))
        .length,
      recovery: customersFound.filter((c) =>
        c.type_of_client.includes('Recuperación'),
      ).length,
      developer: customersFound.filter(
        (c) => c.type_of_client.includes('Expansión de producto'), //c.projects.some((p) => p.status === 'En negociacion'),
      ).length,
    };

    return data;
  }
}
