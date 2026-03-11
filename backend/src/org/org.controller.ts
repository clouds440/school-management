import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { SupportTopic } from '@prisma/client';

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

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class OrgController {
    constructor(private readonly orgService: OrgService) { }

    @Get('stats')
    getStats(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getStats(req.user.organizationId, req.user);
    }

    // --- Settings ---
    @Get('settings')
    getSettings(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getSettings(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Patch('settings')
    updateSettings(@Request() req: AuthenticatedRequest, @Body() updateSettingsDto: UpdateSettingsDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateSettings(req.user.organizationId, updateSettingsDto);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
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
        @Request() req: AuthenticatedRequest,
    ) {
        if (!req.user.organizationId) throw new Error('No organization');

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

        return this.orgService.updateLogo(req.user.organizationId, file, req.user.id);
    }


    @Post('support')
    submitSupportTicket(
        @Request() req: AuthenticatedRequest,
        @Body() body: { topic: SupportTopic, message: string }
    ) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.submitSupportTicket(req.user.organizationId, body.topic, body.message);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Patch('reapply')
    reapply(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.reapply(req.user.organizationId);
    }


    // --- Teachers ---
    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Get('teachers')
    getTeachers(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getTeachers(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Get('teachers/:id')
    getTeacher(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getTeacher(req.user.organizationId, id);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Post('teachers')
    createTeacher(@Request() req: AuthenticatedRequest, @Body() createTeacherDto: CreateTeacherDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createTeacher(req.user.organizationId, createTeacherDto, req.user);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Patch('teachers/:id')
    updateTeacher(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateTeacher(req.user.organizationId, id, updateTeacherDto, req.user);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Delete('teachers/:id')
    deleteTeacher(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteTeacher(req.user.organizationId, id, req.user);
    }

    // --- Courses ---
    @Get('courses')
    getCourses(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getCourses(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Post('courses')
    createCourse(@Request() req: AuthenticatedRequest, @Body() createCourseDto: CreateCourseDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createCourse(req.user.organizationId, createCourseDto);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Patch('courses/:id')
    updateCourse(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateCourse(req.user.organizationId, id, updateCourseDto);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Delete('courses/:id')
    deleteCourse(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteCourse(req.user.organizationId, id);
    }

    // --- Sections ---
    @Get('sections')
    getSections(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getSections(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Post('sections')
    createSection(@Request() req: AuthenticatedRequest, @Body() createSectionDto: CreateSectionDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createSection(req.user.organizationId, createSectionDto);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Patch('sections/:id')
    updateSection(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateSectionDto: UpdateSectionDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateSection(req.user.organizationId, id, updateSectionDto);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER')
    @Delete('sections/:id')
    deleteSection(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteSection(req.user.organizationId, id);
    }

    // --- Students ---
    @Get('students')
    getStudents(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getStudents(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Get('students/:id')
    getStudent(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getStudent(req.user.organizationId, id);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Post('students')
    createStudent(@Request() req: AuthenticatedRequest, @Body() createStudentDto: CreateStudentDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createStudent(req.user.organizationId, createStudentDto, req.user);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Patch('students/:id')
    updateStudent(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateStudent(req.user.organizationId, id, updateStudentDto, req.user);
    }

    @Roles('ORG_ADMIN', 'ORG_MANAGER', 'TEACHER')
    @Delete('students/:id')
    deleteStudent(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteStudent(req.user.organizationId, id);
    }
}
