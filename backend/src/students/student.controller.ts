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
import { StudentService } from './student.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { CreateStudentDto } from '../org/dto/create-student.dto';
import { UpdateStudentDto } from '../org/dto/update-student.dto';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get('students')
  async getStudents(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('my') my?: string,
    @Query('sectionId') sectionId?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.studentService.getStudents(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sortBy,
      sortOrder,
      my: my === 'true',
      sectionId,
      userId: req?.user?.id,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Get('students/:id')
  getStudent(@OrgId() orgId: string, @Param('id') id: string) {
    return this.studentService.getStudent(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('students')
  createStudent(
    @OrgId() orgId: string,
    @Body() createStudentDto: CreateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.createStudent(orgId, createStudentDto, {
      name: req.user.name,
      email: req.user.email!,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('students/:id')
  updateStudent(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.studentService.updateStudent(orgId, id, updateStudentDto, {
      role: req.user.role.toString() as Role,
      name: req.user.name,
      email: req.user.email!,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete('students/:id')
  deleteStudent(
    @OrgId() orgId: string,
    @Param('id') id: string,
  ) {
    return this.studentService.deleteStudent(orgId, id);
  }
}
