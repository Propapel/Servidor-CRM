import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { DeleteProjectDto } from './dto/delete_project.dto';
import { AccessTokenGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  @UseGuards(AccessTokenGuard)
  @Post('create')
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @UseGuards(AccessTokenGuard)
  @Put('update')
  updateProject() {

  }

  @UseGuards(AccessTokenGuard)
  @Get('findProjectById/:id')
  findAll(@Param('id') id: number) {
    return this.projectsService.findAllByCustomerId(id);
  }

  @UseGuards(AccessTokenGuard)
  @Get('findProjectByUserId/:id')
  findProjectByUserId(@Param('id') id: number) {
    return this.projectsService.findAllByUserId(id);
  }

  @UseGuards(AccessTokenGuard)
  @Post('closeProject/:id')
  closeProject(@Param('id') id: number) {
    return this.projectsService.completeProject(id);
  }

  @UseGuards(AccessTokenGuard)
  @Delete('delete/:id')
  deleteProject(
    @Param('id') id: number,
    @Body() deleteProject: DeleteProjectDto,
  ) {
    this.projectsService.cancelProject(id, deleteProject);
  }

  @UseGuards(AccessTokenGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(+id);
  }

  @UseGuards(AccessTokenGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateProjectDto: UpdateProjectDto) {
    return this.projectsService.update(+id, updateProjectDto);
  }

  @UseGuards(AccessTokenGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(+id);
  }
}
