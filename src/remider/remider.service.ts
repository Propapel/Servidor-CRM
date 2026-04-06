import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Reminder } from './entity/remider.entity';
import { Repository } from 'typeorm';
import { CreateOnlyReminderDto } from './dto/create-only-reminder.dto';
import { Customer } from '../customers/entity/customer.entity';
import { UpdateReminderDto } from './dto/update_reminder.dto';
import { CloseReminderDto } from './dto/close_reminder.dto';

@Injectable()
export class RemiderService {

    constructor(
        @InjectRepository(Reminder)
        private reminderRepository: Repository<Reminder>,
        @InjectRepository(Customer)
        private customerRepository: Repository<Customer>
    ){}

    async getAllReminders(){
        const reminders = await this.reminderRepository.find({
            relations: ['customer'],
        })
        return {
            reminders: reminders
        }
    }

    async getAllReminderByNotification() {
        const reminders = await this.reminderRepository.find({
            relations: ['customer', 'customer.user'], // Incluye la relación 'user' dentro de 'customer'
        });
    
        return {
            reminders: reminders.map(reminder => ({
                ...reminder,
                customer: {
                    ...reminder.customer,
                    user: reminder.customer?.user, // Asegura que el usuario se incluya en la respuesta
                },
            })),
        };
    }
    
    async closeReminder(closeReminder: CloseReminderDto) {
        const reminder = await this.reminderRepository.findOneBy(
            {
                reminder_id: closeReminder.id
            }
        )

        reminder.is_completed = true
        reminder.description = closeReminder.notes

        await this.reminderRepository.save(reminder);
}


    async getAllRemindersByUser(userId: number) {
        // Obtén los recordatorios con las relaciones necesarias
        const reminders = await this.reminderRepository.find({
            relations: ['customer', 'customer.user'],  // Incluye las relaciones necesarias
            where: {
                customer: {
                    user: {
                        id: userId,  // Filtra por el usuario
                    },
                },
            },
        });
    
        // Remueve la información del usuario de los resultados
        const filteredReminders = reminders.map(reminder => {
            // Elimina la relación `user` del `customer`
            const { customer, ...rest } = reminder;
            const { user, ...customerWithoutUser } = customer; // Elimina `user` de `customer`
            return { ...rest, customer: customerWithoutUser }; // Retorna el reminder sin el `user`
        });
    
        return {
            reminders: filteredReminders,
        };
    }

    

    async createReminder(createReminderDto: CreateOnlyReminderDto) {
        const { customerId, ...reminderData } = createReminderDto;

        // Corrige el método findOne para buscar el cliente por ID
        const customer = await this.customerRepository.findOne({ where: { customer_id: customerId} });
        if (!customer) {
            throw new NotFoundException(`Customer with id ${customerId} not found`);
        }

        const reminder = this.reminderRepository.create({
            ...reminderData,
            customer,
        });
        
        return this.reminderRepository.save(reminder);  // Guarda el recordatorio en la base de datos
    }

    
    async completeReminder(reminderId: number){
        const reminder = await this.reminderRepository.findOneBy(
            {
                reminder_id: reminderId
            }
        )

        reminder.is_completed = true
        await this.reminderRepository.save(reminder);
    }
    

    async updateReminder(reminderId: number, updateReminder: UpdateReminderDto){
        const reminderFound = await this.reminderRepository.findOne({
            where : {
                reminder_id: reminderId
            }
        })
        reminderFound.typeAppointment = updateReminder.typeAppointment
        reminderFound.description = updateReminder.typeAppointment
        reminderFound.reminder_date = updateReminder.reminder_date
    

        const updateReminderObject = Object.assign(reminderFound, updateReminder)
        await this.reminderRepository.save(updateReminderObject);
    }
    
    async deleteReminder(reminderId: number) {
        // Buscar el recordatorio por su ID
        const reminder = await this.reminderRepository.findOne({
            where: {
                reminder_id: reminderId
            },
        });
    
        // Eliminar el recordatorio
        await this.reminderRepository.remove(reminder);
    }
}
