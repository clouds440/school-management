import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { Role } from '../common/enums';
import { TeacherService } from './teacher.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateTeacherDto } from '../org/dto/create-teacher.dto';
import { UpdateTeacherDto } from '../org/dto/update-teacher.dto';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  // --- Teachers ---
  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Get('teachers')
  async getTeachers(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.teacherService.getTeachers(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sortBy,
      sortOrder,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Get('managers')
  async getManagers(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.teacherService.getManagers(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sortBy: sortBy || 'user.name',
      sortOrder,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Get('teachers/:id')
  getTeacher(@OrgId() orgId: string, @Param('id') id: string) {
    return this.teacherService.getTeacher(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('teachers')
  createTeacher(
    @OrgId() orgId: string,
    @Body() createTeacherDto: CreateTeacherDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.teacherService.createTeacher(orgId, createTeacherDto, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('teachers/:id')
  updateTeacher(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.teacherService.updateTeacher(orgId, id, updateTeacherDto, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete('teachers/:id')
  deleteTeacher(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.teacherService.deleteTeacher(orgId, id, req.user);
  }
}
