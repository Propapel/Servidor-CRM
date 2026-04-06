import { Injectable } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from './entities/project.entity';
import { Repository } from 'typeorm';
import { Customer } from '../customers/entity/customer.entity';
import { Purchase } from '../purchase/entity/purchase.entity';
import { ProjectCancellation } from './entities/projectCancellation.entity';
import { DeleteProjectDto } from './dto/delete_project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project) private projectRepository: Repository<Project>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(ProjectCancellation)
    private cancellRepository: Repository<ProjectCancellation>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
  ) {}

  async completeProject(projectId: number) {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
      relations: ['customer', 'products'],
    });
    console.log(project);
    project.status = 'Cierre';
    project.progress = 100.0;
    const newProject = await this.projectRepository.save(project);
    return newProject;
  }

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Buscar el cliente por su ID
    const customer = await this.customerRepository.findOneBy({
      customer_id: Number(createProjectDto.customerId),
    });
    console.log(createProjectDto.valorProject);
    // Crear el nuevo proyecto
    const newProject = this.projectRepository.create({
      nameProject: createProjectDto.nameProject,
      valorProject: createProjectDto.valorProject,
      prioridad: createProjectDto.prioridad,
      progress: createProjectDto.progress,
      status: createProjectDto.state,
      customer: customer,
    });

    // Guardar el proyecto antes para obtener su ID
    await this.projectRepository.save(newProject);

    // Actualizar las compras si es necesario
    if (createProjectDto.purchases && createProjectDto.purchases.length > 0) {
      for (const updatePurchaseDto of createProjectDto.purchases) {
        const purchase = await this.purchaseRepository.findOneBy({
          purchase_id: Number(updatePurchaseDto.purchaseId),
        });
        if (purchase) {
          // Actualizar el monto de la compra
          purchase.amount = updatePurchaseDto.amount;
          purchase.isIntoProduct = true;
          await this.purchaseRepository.save(purchase);

          // Asociar la compra al proyecto
          purchase.project = newProject; // Relacionar el proyecto con la compra
          await this.purchaseRepository.save(purchase);
        }
      }
    }

    return newProject;
  }
  async findAllByCustomerId(customerId: number) {
    const projects = await this.projectRepository.find({
      where: {
        customer: {
          customer_id: customerId
        },
      },
      relations: ['customer', 'products'],
    });

    return projects;
  }

  async findAllByUserId(userId: number) {
    console.log(userId)
    const projects = await this.projectRepository.find({
      where: {
        customer: {
          user: {
            id: userId,
          },
        },
      },
      relations: ['customer', 'products'],
    });

    return projects;
  }

  async updateProject(updateProject: UpdateProjectDto) {
    const project = await this.projectRepository.findOneBy({
      id: updateProject.id,
    });
  
    if (!project) {
      throw new Error('Project not found');
    }
  
    // Actualiza los campos necesarios
    project.nameProject = updateProject.nameProject;
    project.prioridad = updateProject.prioridad;
    project.valorProject = updateProject.valorProject;
  
    // Guarda los cambios
    const updatedProject = await this.projectRepository.save(project);
    return updatedProject;
  }
  

  async cancelProject(
    projectId: number,
    deleteProject: DeleteProjectDto,
  ): Promise<Project> {
    const project = await this.projectRepository.findOne({
      where: { id: projectId },
    });

    // Crear registro de cancelación en la tabla auxiliar
    const cancellation = new ProjectCancellation();
    cancellation.project = project;
    cancellation.comments = deleteProject.comments;
    cancellation.cancellationReason = deleteProject.motivos;
    cancellation.competencia = deleteProject.competencia;

    // Guardar la cancelación
    await this.cancellRepository.save(cancellation);

    // Marcar el proyecto como cancelado
    project.isCancel = true;
    project.status = 'Perdido';
    project.progress = 60.0;

    // Guardar los cambios en el proyecto
    await this.projectRepository.save(project);

    return project;
  }

  findOne(id: number) {
    return `This action returns a #${id} project`;
  }

  update(id: number, updateProjectDto: UpdateProjectDto) {
    return `This action updates a #${id} project`;
  }

  remove(id: number) {}
}
