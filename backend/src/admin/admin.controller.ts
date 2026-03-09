import { Controller, Get, Patch, Post, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { OrgStatus } from '@prisma/client';

import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CreatePlatformAdminDto } from './dto/create-platform-admin.dto';
import { UpdatePlatformAdminDto } from './dto/update-platform-admin.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin')
export class AdminController {

    constructor(private readonly adminService: AdminService) { }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Get('organizations')
    async getOrganizations(@Query('status') status?: OrgStatus) {
        return this.adminService.getOrganizations(status);
    }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Get('stats')
    async getAdminStats() {
        return this.adminService.getAdminStats();
    }



    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Patch('organizations/:id/approve')
    approveOrganization(@Param('id') id: string) {
        return this.adminService.approveOrganization(id);
    }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Patch('organizations/:id/reject')
    rejectOrganization(@Param('id') id: string, @Body('reason') reason: string) {
        return this.adminService.rejectOrganization(id, reason);
    }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Patch('organizations/:id/suspend')
    suspendOrganization(@Param('id') id: string, @Body('reason') reason: string) {
        return this.adminService.suspendOrganization(id, reason);
    }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Get('support')
    getSupportTickets() {
        return this.adminService.getSupportTickets();
    }

    @Roles('SUPER_ADMIN', 'PLATFORM_ADMIN')
    @Patch('support/:id/resolve')
    resolveSupportTicket(@Param('id') id: string) {
        return this.adminService.resolveSupportTicket(id);
    }

    // --- Platform Admins ---
    @Roles('SUPER_ADMIN')
    @Get('platform-admins')
    getPlatformAdmins() {
        return this.adminService.getPlatformAdmins();
    }

    @Roles('SUPER_ADMIN')
    @Post('platform-admins')
    createPlatformAdmin(@Body() createPlatformAdminDto: CreatePlatformAdminDto) {
        return this.adminService.createPlatformAdmin(createPlatformAdminDto);
    }

    @Roles('SUPER_ADMIN')
    @Patch('platform-admins/:id')
    updatePlatformAdmin(@Param('id') id: string, @Body() updatePlatformAdminDto: UpdatePlatformAdminDto) {
        return this.adminService.updatePlatformAdmin(id, updatePlatformAdminDto);
    }

    @Roles('SUPER_ADMIN')
    @Delete('platform-admins/:id')
    deletePlatformAdmin(@Param('id') id: string) {
        return this.adminService.deletePlatformAdmin(id);
    }


}

