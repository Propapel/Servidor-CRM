import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Customer } from './entity/customer.entity';
import { Like, Not, Repository } from 'typeorm';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { User } from 'src/users/user.entity';
import { Reminder } from 'src/remider/entity/remider.entity';
import { Purchase } from 'src/purchase/entity/purchase.entity';
import { Interaction } from 'src/interation/entity/interation.entity';
import { Opportunity } from 'src/oportunity/entity/oportunity.entity';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { LeadHistory } from 'src/lead-history/entities/lead-history.entity';
import { LeadAction } from 'src/enums/lead-action';
import { UpdateStatusCustomerDto } from './dto/update_status_customer.dto';
import { LeadStatus } from 'src/enums/lead_status';
import { ManagerReviewStatus } from 'src/enums/lead_manager_review';
import { MailService } from 'src/auth/service/MailService';
import { NotifityAlertAssignedCustomer } from 'src/auth/service/notifityAlertAssignedCustomer.dto';
import { Conversation } from 'src/conversation/entities/conversation.entity';
import { CalendarEvent } from 'src/calendar-event/entities/calendar-event.entity';

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
  ) {}

  async probar(){
     await this.mailService.sendTestEmail()
  }

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
    const customer = this.customersRepository.create(customerData);
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
    const customer = this.customersRepository.create(customerData);
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

  async getMyCustomer(id: number) {
    const getMyCustomers = await this.customersRepository.find({
      where: {
        user: { id },
        managerReviewStatus: Not(ManagerReviewStatus.DISCARDED),
      }, // Filtra por el id del usuario relacionado,
      relations: ['opportunities', 'interactions', 'purchases', 'reminders'],
    });

    // Usar map para calcular el progreso y actualizar al mismo tiempo
    const updatedCustomers = await Promise.all(
      getMyCustomers.map(async (customer) => {
        customer.calculateProgress(id);
        return this.customersRepository.save(customer); // Guardar los cambios
      }),
    );
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

    // Usar map para calcular el progreso y actualizar al mismo tiempo
    const updatedCustomers = await Promise.all(
      getMyCustomers.map(async (customer) => {
        customer.calculateProgress(id);
        return this.customersRepository.save(customer); // Guardar los cambios
      }),
    );
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
    const updatedCustomer = Object.assign(customer, updateCustomerDto);
    await this.customersRepository.save(updatedCustomer);
  }

  async findAllCustomerByUserId(id: number) {
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

    // Usar map para calcular el progreso y actualizar al mismo tiempo
    const updatedCustomers = await Promise.all(
      getMyCustomers.map(async (customer) => {
        customer.calculateProgress(id);
        return this.customersRepository.save(customer); // Guardar los cambios
      }),
    );
    return { customers: updatedCustomers };
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
