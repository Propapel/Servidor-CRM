import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.deleteTask(id)
  }
  @Post('create')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @Get('findTaskByUser/:id')
  findTaskByUser(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findAllTaskByUser(id)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }

    // ✅ Marcar como completada
  @Put('markAsCompleted/:id')
  markAsCompleted(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.markAsCompleted(id);
  }

  // ✅ Desmarcar como completada
  @Put('unmarkAsCompleted/:id')
  unmarkAsCompleted(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.unmarkAsCompleted(id);
  }

  // ✅ Marcar como importante
  @Put('markAsImportant/:id')
  markAsImportant(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.markAsImportant(id);
  }

  // ✅ Desmarcar como importante
  @Put('unmarkAsImportant/:id')
  unmarkAsImportant(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.unmarkAsImportant(id);
  }
}
