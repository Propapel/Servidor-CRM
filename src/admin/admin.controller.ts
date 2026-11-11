import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { BranchesAdminService } from './branches-admin.service';
import { CreatePermissionDto, CreateRoleDto, UpdatePermissionDto, UpdateRoleDto, UpsertBranchDto } from './dto/admin.dto';
import { ADMIN_PERMISSIONS, RequireAdminPermission } from './admin-access';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { PermissionsAdminService } from './permissions-admin.service';
import { RolesAdminService } from './roles-admin.service';

const pageQuery = (page?: string, limit?: string, search?: string) => ({
  page: Number(page) || 1,
  limit: Number(limit) || 25,
  search,
});

/** Administración de roles. Los endpoints anteriores de /roles siguen igual. */
@UseGuards(AdminRolesGuard)
@RequireAdminPermission(ADMIN_PERMISSIONS.ROLES_AND_PERMISSIONS)
@Controller('admin/roles')
export class AdminRolesController {
  constructor(private readonly service: RolesAdminService) {}

  @Get() list() { return this.service.list(); }

  @Post() create(@Body() dto: CreateRoleDto) { return this.service.create(dto); }

  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateRoleDto) { return this.service.update(id, dto); }

  @Delete(':id') remove(@Param('id') id: string) { return this.service.remove(id); }

  @Get(':id/users')
  users(@Param('id') id: string, @Query('page') page: string, @Query('limit') limit: string, @Query('search') search: string, @Req() req: Request) {
    return this.service.usersOf(id, pageQuery(page, limit, search), req);
  }

  /** Cambia el rol del usuario a este. */
  @Put(':id/users/:userId')
  assign(@Param('id') id: string, @Param('userId', ParseIntPipe) userId: number, @Req() req: Request) {
    return this.service.assignUser(id, userId, Number((req as any).user?.sub) || undefined);
  }
}

@UseGuards(AdminRolesGuard)
@RequireAdminPermission(ADMIN_PERMISSIONS.ROLES_AND_PERMISSIONS)
@Controller('admin/permissions')
export class AdminPermissionsController {
  constructor(private readonly service: PermissionsAdminService) {}

  @Get() list() { return this.service.list(); }

  @Post() create(@Body() dto: CreatePermissionDto) { return this.service.create(dto); }

  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdatePermissionDto) { return this.service.update(id, dto); }

  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }
}

@UseGuards(AdminRolesGuard)
@RequireAdminPermission(ADMIN_PERMISSIONS.BRANCHES)
@Controller('admin/branches')
export class AdminBranchesController {
  constructor(private readonly service: BranchesAdminService) {}

  @Get() list() { return this.service.list(); }

  @Post() create(@Body() dto: UpsertBranchDto) { return this.service.create(dto); }

  @Put(':id') update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpsertBranchDto) { return this.service.update(id, dto); }

  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) { return this.service.remove(id); }

  @Get(':id/users')
  users(@Param('id', ParseIntPipe) id: number, @Query('page') page: string, @Query('limit') limit: string, @Query('search') search: string, @Req() req: Request) {
    return this.service.usersOf(id, pageQuery(page, limit, search), req);
  }

  @Put(':id/users/:userId')
  addUser(@Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number) {
    return this.service.addUser(id, userId);
  }

  @Delete(':id/users/:userId')
  removeUser(@Param('id', ParseIntPipe) id: number, @Param('userId', ParseIntPipe) userId: number) {
    return this.service.removeUser(id, userId);
  }
}
