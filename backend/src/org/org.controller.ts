import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OrgService } from './org.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { AuthenticatedRequest } from '../auth/interfaces/authenticated-request.interface';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('org')
export class OrgController {
    constructor(private readonly orgService: OrgService) { }

    // --- Settings ---
    @Get('settings')
    getSettings(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getSettings(req.user.organizationId);
    }

    @Roles('ORG_ADMIN')
    @Patch('settings')
    updateSettings(@Request() req: AuthenticatedRequest, @Body() updateSettingsDto: UpdateSettingsDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateSettings(req.user.organizationId, updateSettingsDto);
    }

    // --- Teachers ---
    @Roles('ORG_ADMIN')
    @Get('teachers')
    getTeachers(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getTeachers(req.user.organizationId);
    }

    @Roles('ORG_ADMIN')
    @Post('teachers')
    createTeacher(@Request() req: AuthenticatedRequest, @Body() createTeacherDto: CreateTeacherDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createTeacher(req.user.organizationId, createTeacherDto);
    }

    @Roles('ORG_ADMIN')
    @Patch('teachers/:id')
    updateTeacher(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateTeacherDto: UpdateTeacherDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateTeacher(req.user.organizationId, id, updateTeacherDto);
    }

    @Roles('ORG_ADMIN')
    @Delete('teachers/:id')
    deleteTeacher(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteTeacher(req.user.organizationId, id);
    }

    // --- Classes ---
    @Get('classes')
    getClasses(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        // We pass the full user object to service to determine filtering
        return this.orgService.getClasses(req.user.organizationId, req.user);
    }

    @Roles('ORG_ADMIN')
    @Post('classes')
    createClass(@Request() req: AuthenticatedRequest, @Body() createClassDto: CreateClassDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createClass(req.user.organizationId, createClassDto, req.user);
    }

    @Roles('ORG_ADMIN', 'TEACHER')
    @Patch('classes/:id')
    updateClass(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateClassDto: UpdateClassDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateClass(req.user.organizationId, id, updateClassDto, req.user);
    }

    @Roles('ORG_ADMIN')
    @Delete('classes/:id')
    deleteClass(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteClass(req.user.organizationId, id);
    }

    // --- Students ---
    @Get('students')
    getStudents(@Request() req: AuthenticatedRequest) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.getStudents(req.user.organizationId);
    }

    @Roles('ORG_ADMIN', 'TEACHER')
    @Post('students')
    createStudent(@Request() req: AuthenticatedRequest, @Body() createStudentDto: CreateStudentDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.createStudent(req.user.organizationId, createStudentDto, req.user);
    }

    @Roles('ORG_ADMIN', 'TEACHER')
    @Patch('students/:id')
    updateStudent(@Request() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.updateStudent(req.user.organizationId, id, updateStudentDto, req.user);
    }

    @Roles('ORG_ADMIN', 'TEACHER')
    @Delete('students/:id')
    deleteStudent(@Request() req: AuthenticatedRequest, @Param('id') id: string) {
        if (!req.user.organizationId) throw new Error('No organization');
        return this.orgService.deleteStudent(req.user.organizationId, id);
    }
}
