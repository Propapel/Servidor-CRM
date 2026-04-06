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
  UseGuards,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { AccessTokenGuard } from '../auth/guards/jwt-auth.guard';

@Controller('task')
export class TaskController {
  constructor(private readonly taskService: TaskService) { }

  @UseGuards(AccessTokenGuard)
  @Delete('delete/:id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.deleteTask(id)
  }

  @UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() createTaskDto: CreateTaskDto) {
    return this.taskService.create(createTaskDto);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findTaskByUser/:id')
  findTaskByUser(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.findAllTaskByUser(id)
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.taskService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    return this.taskService.update(+id, updateTaskDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.remove(+id);
  }

  @UseGuards(AccessTokenGuard)
  // ✅ Marcar como completada
  @Put('markAsCompleted/:id')
  markAsCompleted(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.markAsCompleted(id);
  }

  @UseGuards(AccessTokenGuard)
  // ✅ Desmarcar como completada
  @Put('unmarkAsCompleted/:id')
  unmarkAsCompleted(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.unmarkAsCompleted(id);
  }

  @UseGuards(AccessTokenGuard)
  // ✅ Marcar como importante
  @Put('markAsImportant/:id')
  markAsImportant(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.markAsImportant(id);
  }

  @UseGuards(AccessTokenGuard)
  // ✅ Desmarcar como importante
  @Put('unmarkAsImportant/:id')
  unmarkAsImportant(@Param('id', ParseIntPipe) id: number) {
    return this.taskService.unmarkAsImportant(id);
  }
}
