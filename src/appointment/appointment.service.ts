import { Injectable } from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { Appointment } from './entities/appointment.entity';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AppointmentService {

  constructor(
    @InjectRepository(Appointment) private appointmentRepository: Repository<Appointment>,
    @InjectRepository(Customer) private customerRepository: Repository<Customer>
  ){

  }
  async create(createAppointmentDto: CreateAppointmentDto) {
      const customerFound = await this.customerRepository.findOne({
        where: {
          customer_id: createAppointmentDto.customerId
        }
      })
      const appointment = this.appointmentRepository.create({
        descripcion: createAppointmentDto.description,
        duracion: createAppointmentDto.duracion,
        estado: createAppointmentDto.estado,
        fecha: createAppointmentDto.fecha,
        lugar: createAppointmentDto.lugar,
        titulo: createAppointmentDto.titulo,
        tipo: createAppointmentDto.tipo
      })
      const data = await this.appointmentRepository.save(appointment);

      return data;
  }

  async findAll() {
    const appointments = await this.appointmentRepository.find()

  
    return {
      appointments: appointments
    };
  }

  async findAllReminderWithCustomer(){
     const appointments = await this.appointmentRepository.find({
      relations : ['customer']
     })

     return {
      appointments : appointments
     }
  }

  async findOne(appointmentId: number) {
    const appointment = await this.appointmentRepository.findOne({
      where:  { 
        id: appointmentId
      }
    })
    return appointment;
  }

  async update(appointmentId: number, updateAppointmentDto: UpdateAppointmentDto) {
    const appointment = await this.appointmentRepository.findOneBy(
      {
        id: appointmentId
      }
    )
    appointment.descripcion = updateAppointmentDto.descripcion
    appointment.duracion = updateAppointmentDto.duracion
    appointment.estado = updateAppointmentDto.estado
    appointment.fecha = updateAppointmentDto.fecha
    appointment.lugar = updateAppointmentDto.lugar
    appointment.tipo = updateAppointmentDto.tipo

    const updateAppointment = Object.assign(appointment, updateAppointmentDto)
    await this.appointmentRepository.save(updateAppointment);
  }

  remove(id: number) {
    return `This action removes a #${id} appointment`;
  }
}
