import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAcademicCycleDto } from './dto/create-academic-cycle.dto';
import { UpdateAcademicCycleDto } from './dto/update-academic-cycle.dto';
import {
  getPaginationOptions,
  formatPaginatedResponse,
  PaginationOptions,
} from '../common/utils';
import { Prisma } from '@prisma/client';

@Injectable()
export class AcademicCyclesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCycle(orgId: string, dto: CreateAcademicCycleDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // If setting as active, deactivate all others first
    if (dto.isActive) {
      await this.prisma.academicCycle.updateMany({
        where: { organizationId: orgId, isActive: true },
        data: { isActive: false },
      });
    }

    return this.prisma.academicCycle.create({
      data: {
        name: dto.name,
        startDate,
        endDate,
        isActive: dto.isActive ?? false,
        organizationId: orgId,
      },
    });
  }

  async getCycles(orgId: string, options: PaginationOptions & { academicCycleId?: string }) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions({
      ...options,
      sortBy: options.sortBy || 'startDate',
      sortOrder: options.sortOrder || 'desc',
    });

    const where: Prisma.AcademicCycleWhereInput = {
      organizationId: orgId,
      ...(options.search
        ? { name: { contains: options.search, mode: 'insensitive' } }
        : {}),
    };

    const [cycles, totalRecords] = await Promise.all([
      this.prisma.academicCycle.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              cohorts: true,
              sections: true,
              enrollments: true,
            },
          },
        },
      }),
      this.prisma.academicCycle.count({ where }),
    ]);

    return formatPaginatedResponse(cycles, totalRecords, options.page, options.limit);
  }

  async getCycle(orgId: string, id: string) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { id, organizationId: orgId },
      include: {
        _count: {
          select: {
            cohorts: true,
            sections: true,
            enrollments: true,
          },
        },
      },
    });

    if (!cycle) throw new NotFoundException('Academic cycle not found');
    return cycle;
  }

  async updateCycle(orgId: string, id: string, dto: UpdateAcademicCycleDto) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cycle) throw new NotFoundException('Academic cycle not found');

    const updateData: Prisma.AcademicCycleUpdateInput = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.startDate !== undefined) updateData.startDate = new Date(dto.startDate);
    if (dto.endDate !== undefined) updateData.endDate = new Date(dto.endDate);

    // Validate dates if either is being updated
    const newStart = dto.startDate ? new Date(dto.startDate) : cycle.startDate;
    const newEnd = dto.endDate ? new Date(dto.endDate) : cycle.endDate;
    if (newEnd <= newStart) {
      throw new BadRequestException('End date must be after start date');
    }

    if (dto.isActive !== undefined) {
      if (dto.isActive) {
        // Deactivate all others
        await this.prisma.academicCycle.updateMany({
          where: { organizationId: orgId, isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }
      updateData.isActive = dto.isActive;
    }

    return this.prisma.academicCycle.update({
      where: { id },
      data: updateData,
    });
  }

  async setActiveCycle(orgId: string, id: string) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { id, organizationId: orgId },
    });
    if (!cycle) throw new NotFoundException('Academic cycle not found');

    await this.prisma.$transaction([
      this.prisma.academicCycle.updateMany({
        where: { organizationId: orgId, isActive: true },
        data: { isActive: false },
      }),
      this.prisma.academicCycle.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    return { message: 'Academic cycle activated', id };
  }

  async getActiveCycle(orgId: string) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { organizationId: orgId, isActive: true },
      include: {
        _count: {
          select: { cohorts: true, sections: true, enrollments: true },
        },
      },
    });

    if (!cycle) throw new NotFoundException('No active academic cycle found');
    return cycle;
  }

  async deleteCycle(orgId: string, id: string) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { id, organizationId: orgId },
      include: {
        _count: {
          select: { sections: true, enrollments: true },
        },
      },
    });

    if (!cycle) throw new NotFoundException('Academic cycle not found');

    if (cycle._count.sections > 0 || cycle._count.enrollments > 0) {
      throw new ConflictException(
        'Cannot delete academic cycle with existing sections or enrollments. Archive it instead by deactivating.',
      );
    }

    await this.prisma.academicCycle.delete({ where: { id } });
    return { message: 'Academic cycle deleted' };
  }

  /**
   * Validates that a cycle belongs to the given organization. 
   * Returns the cycle or throws NotFoundException.
   */
  async validateCycleBelongsToOrg(cycleId: string, orgId: string) {
    const cycle = await this.prisma.academicCycle.findFirst({
      where: { id: cycleId, organizationId: orgId },
    });
    if (!cycle) throw new NotFoundException('Academic cycle not found in this organization');
    return cycle;
  }
}
