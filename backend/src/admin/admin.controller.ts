import { Controller, Get, Patch, Delete, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAdminAuthGuard } from '../auth/jwt-admin-auth.guard';

@UseGuards(JwtAdminAuthGuard)
@Controller('admin')
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    @Get('organizations/pending')
    getPendingOrganizations() {
        return this.adminService.getPendingOrganizations();
    }

    @Patch('organizations/:id/approve')
    approveOrganization(@Param('id') id: string) {
        return this.adminService.approveOrganization(id);
    }

    @Delete('organizations/:id/reject')
    rejectOrganization(@Param('id') id: string) {
        return this.adminService.rejectOrganization(id);
    }
}
