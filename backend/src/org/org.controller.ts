import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException, Query, ForbiddenException } from '@nestjs/common';
import { Role, SupportTopic } from '../common/enums';

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
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { OrgId } from '../common/decorators/org-id.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class OrgController {
    constructor(private readonly orgService: OrgService) { }

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
    updateSettings(@OrgId() orgId: string, @Body() updateSettingsDto: UpdateSettingsDto) {
        return this.orgService.updateSettings(orgId, updateSettingsDto);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Patch('settings/logo')
    @UseInterceptors(FileInterceptor('file', {
        // Explicitly use disk storage so file.path is populated.
        // orgId is read from req.user because JwtAuthGuard runs before interceptors.
        storage: diskStorage({
            destination: (req: AuthenticatedRequest, _file, cb) => {
                const orgId = req.user?.organizationId ?? 'unknown';
                const uploadPath = path.join(
                    process.cwd(), 'uploads', 'orgs', orgId, 'orgLogo', orgId,
                );
                fs.mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (_req, file: Express.Multer.File, cb) => {
                const sanitized = file.originalname.replace(/\s+/g, '-');
                cb(null, `${Date.now()}-${sanitized}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB hard cap
    }))
    async updateLogo(
        @UploadedFile() file: Express.Multer.File,
        @OrgId() orgId: string,
        @Request() req: AuthenticatedRequest,
    ) {

        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const ALLOWED_IMAGE_TYPES = new Set([
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        ]);

        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            throw new BadRequestException(
                `File type "${file.mimetype}" is not allowed. Only images are accepted for logos.`,
            );
        }

        return this.orgService.updateLogo(orgId, file, req.user.id);
    }


    @Post('support')
    submitSupportTicket(
        @OrgId() orgId: string,
        @Body() body: { topic: SupportTopic, message: string }
    ) {
        return this.orgService.submitSupportTicket(orgId, body.topic as SupportTopic, body.message);
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
    @Get('teachers/:id')
    getTeacher(@OrgId() orgId: string, @Param('id') id: string) {
        return this.orgService.getTeacher(orgId, id);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Post('teachers')
    createTeacher(@OrgId() orgId: string, @Body() createTeacherDto: CreateTeacherDto, @Request() req: AuthenticatedRequest) {
        return this.orgService.createTeacher(orgId, createTeacherDto, req.user);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Patch('teachers/:id')
    updateTeacher(@OrgId() orgId: string, @Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto, @Request() req: AuthenticatedRequest) {
        return this.orgService.updateTeacher(orgId, id, updateTeacherDto, req.user);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Delete('teachers/:id')
    deleteTeacher(@OrgId() orgId: string, @Param('id') id: string, @Request() req: AuthenticatedRequest) {
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
    ) {
        return this.orgService.getCourses(orgId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search,
            sortBy,
            sortOrder,
        });
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Post('courses')
    createCourse(@OrgId() orgId: string, @Body() createCourseDto: CreateCourseDto) {
        return this.orgService.createCourse(orgId, createCourseDto);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Patch('courses/:id')
    updateCourse(@OrgId() orgId: string, @Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
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
    ) {
        return this.orgService.getSections(orgId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search,
            sortBy,
            sortOrder,
        });
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER)
    @Post('sections')
    createSection(@OrgId() orgId: string, @Body() createSectionDto: CreateSectionDto) {
        return this.orgService.createSection(orgId, createSectionDto);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
    @Patch('sections/:id')
    updateSection(@OrgId() orgId: string, @Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
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
    ) {
        return this.orgService.getStudents(orgId, {
            page: page ? parseInt(page, 10) : 1,
            limit: limit ? parseInt(limit, 10) : 10,
            search,
            sortBy,
            sortOrder,
        });
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
    @Get('students/:id')
    getStudent(@OrgId() orgId: string, @Param('id') id: string) {
        return this.orgService.getStudent(orgId, id);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
    @Post('students')
    createStudent(@OrgId() orgId: string, @Body() createStudentDto: CreateStudentDto, @Request() req: AuthenticatedRequest) {
        return this.orgService.createStudent(orgId, createStudentDto, req.user);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
    @Patch('students/:id')
    updateStudent(@OrgId() orgId: string, @Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto, @Request() req: AuthenticatedRequest) {
        return this.orgService.updateStudent(orgId, id, updateStudentDto, req.user);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER)
    @Delete('students/:id')
    deleteStudent(@OrgId() orgId: string, @Param('id') id: string) {
        return this.orgService.deleteStudent(orgId, id);
    }

    @Roles(Role.ORG_ADMIN, Role.ORG_MANAGER, Role.TEACHER, Role.STUDENT)
    @Patch('users/:id/avatar')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: (req, file, cb) => {
                const userId = req.params.id as string;
                const uploadPath = path.join(
                    process.cwd(), 'uploads', 'users', userId, 'avatar',
                );
                fs.mkdirSync(uploadPath, { recursive: true });
                cb(null, uploadPath);
            },
            filename: (_req, file, cb) => {
                const sanitized = file.originalname.replace(/\s+/g, '-');
                cb(null, `${Date.now()}-${sanitized}`);
            },
        }),
        limits: { fileSize: 5 * 1024 * 1024 },
    }))
    async updateUserAvatar(
        @UploadedFile() file: Express.Multer.File,
        @Param('id') id: string,
        @Request() req: AuthenticatedRequest,
    ) {
        if (!file) {
            throw new BadRequestException('No file provided');
        }

        const ALLOWED_IMAGE_TYPES = new Set([
            'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
        ]);

        if (!ALLOWED_IMAGE_TYPES.has(file.mimetype)) {
            throw new BadRequestException(
                `File type "${file.mimetype}" is not allowed.`,
            );
        }

        // Authorization check: User can update their own avatar, or ORG_ADMIN/MANAGER can update any
        if (req.user.role !== Role.ORG_ADMIN && req.user.role !== Role.ORG_MANAGER && req.user.id !== id) {
            throw new ForbiddenException('You can only update your own avatar');
        }

        return this.orgService.updateUserAvatar(id, file, req.user.id);
    }
}
