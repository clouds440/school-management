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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Query,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '../common/enums';

import { OrgService } from './org.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { UpdateSectionDto } from './dto/update-section.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { OrgId } from '../common/decorators/org-id.decorator';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { CreateSubmissionDto } from './dto/create-submission.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class OrgController {
  constructor(private readonly orgService: OrgService) {}

  @Get('stats')
  getStats(@OrgId() orgId: string, @Request() req: AuthenticatedRequest) {
    return this.orgService.getStats(orgId, req.user);
  }

  // --- Settings ---
  @Get('settings')
  getSettings(@OrgId() orgId: string) {
    return this.orgService.getSettings(orgId);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('settings')
  updateSettings(
    @OrgId() orgId: string,
    @Body() updateSettingsDto: UpdateSettingsDto,
  ) {
    return this.orgService.updateSettings(orgId, updateSettingsDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('settings/logo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req: AuthenticatedRequest, _file: any) => {
          const orgId = req.user?.organizationId ?? 'unknown';
          const fileName = _file.originalname
            .replace(/\s+/g, '-')
            .split('.')
            .slice(0, -1)
            .join('.');
          return {
            folder: `school-management/orgs/${orgId}/orgLogo`,
            resource_type: 'auto',
            public_id: `${Date.now()}-${fileName}`,
          };
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap
    }),
  )
  async updateLogo(
    @UploadedFile() file: Express.Multer.File,
    @OrgId() orgId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ALLOWED_IMAGE_TYPES = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]);

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed. Only images are accepted for logos.`,
      );
    }

    return this.orgService.updateLogo(orgId, file, req.user.id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('reapply')
  reapply(@OrgId() orgId: string) {
    return this.orgService.reapply(orgId);
  }

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
    return this.orgService.getTeachers(orgId, {
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
    return this.orgService.getManagers(orgId, {
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
    return this.orgService.getTeacher(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('teachers')
  createTeacher(
    @OrgId() orgId: string,
    @Body() createTeacherDto: CreateTeacherDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.createTeacher(orgId, createTeacherDto, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('teachers/:id')
  updateTeacher(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.updateTeacher(orgId, id, updateTeacherDto, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete('teachers/:id')
  deleteTeacher(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.deleteTeacher(orgId, id, req.user);
  }

  // --- Courses ---
  @Get('courses')
  async getCourses(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('my') my?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.orgService.getCourses(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sortBy,
      sortOrder,
      my: my === 'true',
      userId: req?.user?.id,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('courses')
  createCourse(
    @OrgId() orgId: string,
    @Body() createCourseDto: CreateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    createCourseDto.updatedBy = req.user.name || req.user.email;
    return this.orgService.createCourse(orgId, createCourseDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('courses/:id')
  updateCourse(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() updateCourseDto: UpdateCourseDto,
    @Request() req: AuthenticatedRequest,
  ) {
    updateCourseDto.updatedBy = req.user.name || req.user.email;
    return this.orgService.updateCourse(orgId, id, updateCourseDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete('courses/:id')
  deleteCourse(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.deleteCourse(orgId, id);
  }

  // --- Sections ---
  @Get('sections')
  async getSections(
    @OrgId() orgId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
    @Query('my') my?: string,
    @Request() req?: AuthenticatedRequest,
  ) {
    return this.orgService.getSections(orgId, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      search,
      sortBy,
      sortOrder,
      my: my === 'true',
      userId: req?.user?.id,
    });
  }

  @Get('sections/:id')
  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  getSection(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.getSection(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('sections')
  createSection(
    @OrgId() orgId: string,
    @Body() createSectionDto: CreateSectionDto,
  ) {
    return this.orgService.createSection(orgId, createSectionDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Patch('sections/:id')
  updateSection(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() updateSectionDto: UpdateSectionDto,
  ) {
    return this.orgService.updateSection(orgId, id, updateSectionDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Delete('sections/:id')
  deleteSection(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.deleteSection(orgId, id);
  }

  // --- Students ---
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
    return this.orgService.getStudents(orgId, {
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
    return this.orgService.getStudent(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
  @Post('students')
  createStudent(
    @OrgId() orgId: string,
    @Body() createStudentDto: CreateStudentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.createStudent(orgId, createStudentDto, {
      name: req.user.name,
      email: req.user.email,
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
    return this.orgService.updateStudent(orgId, id, updateStudentDto, {
      role: req.user.role.toString() as Role,
      name: req.user.name,
      email: req.user.email,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  @Get('profile')
  getProfile(@OrgId() orgId: string, @Request() req: AuthenticatedRequest) {
    return this.orgService.getProfile(orgId, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  @Patch('profile')
  updateProfile(
    @OrgId() orgId: string,
    @Body() updateDto: UpdateStudentDto | UpdateTeacherDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.updateProfile(orgId, req.user, updateDto);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Patch('users/:id/avatar')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: new CloudinaryStorage({
        cloudinary: cloudinary,
        params: (req: any, _file: any) => {
          const userId = req.params.id as string;
          const fileName = _file.originalname
            .replace(/\s+/g, '-')
            .split('.')
            .slice(0, -1)
            .join('.');
          return {
            folder: `school-management/users/${userId}/avatar`,
            resource_type: 'auto',
            public_id: `${Date.now()}-${fileName}`,
          };
        },
      }),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async updateUserAvatar(
    @UploadedFile() file: Express.Multer.File,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    const ALLOWED_IMAGE_TYPES = new Set([
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ]);

    if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
      throw new BadRequestException(
        `File type "${file.mimetype}" is not allowed.`,
      );
    }

    // Authorization check: User can update their own avatar, or ORG_ADMIN/MANAGER can update any
    if (
      req.user.role !== Role.ORG_ADMIN &&
      req.user.role !== Role.ORG_MANAGER &&
      req.user.id !== id
    ) {
      throw new ForbiddenException('You can only update your own avatar');
    }

    return this.orgService.updateUserAvatar(id, file, req.user.id);
  }

  // --- Assessments ---
  @Roles(Role.ORG_MANAGER, Role.TEACHER)
  @Post('assessments')
  createAssessment(
    @OrgId() orgId: string,
    @Body() dto: CreateAssessmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const orgSlug = req.user.organization?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return this.orgService.createAssessment(orgId, dto, req.user, orgSlug);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  @Get('assessments')
  getAssessments(
    @OrgId() orgId: string,
    @Request() req: AuthenticatedRequest,
    @Query('sectionId') sectionId?: string,
    @Query('courseId') courseId?: string,
  ) {
    return this.orgService.getAssessments(orgId, req.user, {
      sectionId,
      courseId,
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Patch('assessments/:id')
  updateAssessment(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateAssessmentDto,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.updateAssessment(orgId, id, dto, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Get('assessments/:id')
  getAssessment(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.getAssessment(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Delete('assessments/:id')
  deleteAssessment(
    @OrgId() orgId: string,
    @Param('id') id: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.deleteAssessment(orgId, id, req.user);
  }

  @Get('grades/final')
  getStudentFinalGrades(
    @OrgId() orgId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.getStudentFinalGrades(orgId, req.user.id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  @Get('assessments/:id/grades')
  getGrades(
    @OrgId() orgId: string,
    @Param('id') assessmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.getGrades(orgId, assessmentId, req.user);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Patch('grades/:assessmentId/:studentId')
  updateGrade(
    @OrgId() orgId: string,
    @Param('assessmentId') assessmentId: string,
    @Param('studentId') studentId: string,
    @Body() dto: UpdateGradeDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const orgSlug = req.user.organization?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return this.orgService.updateGrade(
      orgId,
      assessmentId,
      studentId,
      dto,
      req.user.id,
      req.user.role.toString() as Role,
      orgSlug,
    );
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Patch('assessments/:id/publish')
  publishGrades(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.publishGrades(orgId, id);
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
  @Patch('assessments/:id/finalize')
  finalizeGrades(@OrgId() orgId: string, @Param('id') id: string) {
    return this.orgService.finalizeGrades(orgId, id);
  }

  // --- Submissions ---
  @Roles(Role.STUDENT)
  @Post('assessments/:id/submissions')
  createSubmission(
    @OrgId() orgId: string,
    @Param('id') assessmentId: string,
    @Body() dto: CreateSubmissionDto,
    @Request() req: AuthenticatedRequest,
  ) {
    const orgSlug = req.user.organization?.name
      ?.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    // Find student profile for the current user
    return this.orgService.getStudentByUserId(req.user.id).then((student) => {
      if (!student) throw new NotFoundException('Student profile not found');
      return this.orgService.createSubmission(
        orgId,
        student.id,
        { ...dto, assessmentId },
        orgSlug,
      );
    });
  }

  @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
  @Get('assessments/:id/submissions')
  getSubmissions(
    @OrgId() orgId: string,
    @Param('id') assessmentId: string,
    @Request() req: AuthenticatedRequest,
  ) {
    return this.orgService.getSubmissions(orgId, assessmentId, req.user);
  }

  // --- Final Results ---
  @Get('students/:id/final-grades')
  getFinalGrades(
    @OrgId() orgId: string,
    @Param('id') studentId: string,
    @Query('sectionId') sectionId?: string,
  ) {
    return this.orgService.calculateFinalGrade(studentId, sectionId);
  }
}
