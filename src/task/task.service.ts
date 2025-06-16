import { Injectable } from '@nestjs/common';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/user.entity';
import { NumericType, Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import storage = require('../utils/cloud_storage.js');

@Injectable()
export class TaskService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Task) private taskRepository: Repository<Task>,
  ) {}

  async create(createTaskDto: CreateTaskDto) {
    const user = await this.userRepository.findOne({
      where: {
        id: createTaskDto.userId,
      },
    });

    const newListFiles = [];

    //Upload files
    if (createTaskDto.files && createTaskDto.files.length > 0) {
      for (let i = 0; i < createTaskDto.files.length; i++) {
        const attachment = createTaskDto.files[i];
        const buffer = Buffer.from(attachment, 'base64');
        const pathFile = `fileActivity${createTaskDto.userId}_${Date.now()}`;
        const fileUrl = await storage(buffer, pathFile, 'application/pdf');
        if (fileUrl) {
          newListFiles.push(fileUrl);
        }
      }
    }

    const task = this.taskRepository.create({
      ...createTaskDto,
      steps: createTaskDto.steps ?? [],
      files: newListFiles,
      isImportant: createTaskDto.isImportant,
      isComplete: createTaskDto.isComplete,
      user,
    });

    return this.taskRepository.save(task);
  }

  async markAsCompleted(taskId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.isComplete = true;
    return this.taskRepository.save(task);
  }

  async unmarkAsCompleted(taskId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.isComplete = false;
    return this.taskRepository.save(task);
  }

  async markAsImportant(taskId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.isImportant = true;
    return this.taskRepository.save(task);
  }
  async unmarkAsImportant(taskId: number): Promise<Task> {
    const task = await this.taskRepository.findOne({ where: { id: taskId } });
    if (!task) throw new Error('Task not found');

    task.isImportant = false;
    return this.taskRepository.save(task);
  }

  async findAllTaskByUser(userId: number) {
    const tasks = await this.taskRepository.find({
      where: {
        user: {
          id: userId,
        },
      },
    });

    return tasks;
  }

  async deleteTask(taskId: number) {
    const task = await this.taskRepository.findOne({
      where: {
        id: taskId,
      },
    });
    task.isDeleted = true;
    await this.taskRepository.save(task);
  }

  findAll() {
    return `This action returns all task`;
  }

  findOne(id: number) {
    return `This action returns a #${id} task`;
  }

  async update(taskId: number, updateTaskDto: UpdateTaskDto) {
    const task = await this.taskRepository.findOne({
      where: { id: taskId },
    });

    if (!task) {
     // throw new NotFoundException('Tarea no encontrada');
    }

    let updatedFiles = task.files ?? [];

    if (updateTaskDto.files && updateTaskDto.files.length > 0) {
      updatedFiles = [];

      for (const file of updateTaskDto.files) {
        if (file.startsWith('http')) {
          // Mantener archivo existente
          updatedFiles.push(file);
        } else {
          // Subir archivo nuevo en base64
          try {
            const buffer = Buffer.from(file, 'base64');
            const pathFile = `fileActivity${updateTaskDto.userId}_${Date.now()}`;
            const fileUrl = await storage(buffer, pathFile, 'application/pdf');

            if (fileUrl) {
              updatedFiles.push(fileUrl);
            }
          } catch (error) {
            console.error('Error al procesar archivo base64:', error);
          }
        }
      }
    }

    // Actualizar campos normales
    task.title = updateTaskDto.title ?? task.title;
    task.note = updateTaskDto.note ?? task.note;
    task.reminderDate = updateTaskDto.reminderDate ?? task.reminderDate;
    task.isImportant = updateTaskDto.isImportant ?? task.isImportant;
    task.isComplete = updateTaskDto.isComplete ?? task.isComplete;
    task.steps = updateTaskDto.steps ?? task.steps;
    task.files = updatedFiles;
    task.finishTask = updateTaskDto.finishTask ?? task.finishTask;

    // Reasignar usuario si cambia el userId

    return this.taskRepository.save(task);
  }

  remove(id: number) {
    return `This action removes a #${id} task`;
  }
}
