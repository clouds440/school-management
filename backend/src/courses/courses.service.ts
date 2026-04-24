import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import {
  getPaginationOptions,
  formatPaginatedResponse,
  PaginationOptions,
} from '../common/utils';

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  async getCourses(orgId: string, options: PaginationOptions = {}) {
    const { skip, take, sortBy, sortOrder } = getPaginationOptions({
      ...options,
      sortBy: options.sortBy || 'name',
      sortOrder: options.sortOrder || 'asc',
    });

    const where: Prisma.CourseWhereInput = {
      organizationId: orgId,
      ...(options.my && options.userId
        ? {
            sections: {
              some: {
                teachers: {
                  some: { userId: options.userId },
                },
              },
            },
          }
        : {}),
      ...(options.search
        ? {
            OR: [
              { name: { contains: options.search, mode: 'insensitive' } },
              {
                description: { contains: options.search, mode: 'insensitive' },
              },
            ],
          }
        : {}),
    };

    const [courses, totalRecords] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take,
        include: { sections: true },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.course.count({ where }),
    ]);

    return formatPaginatedResponse(
      courses,
      totalRecords,
      options.page,
      options.limit,
    );
  }

  async createCourse(orgId: string, data: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        ...data,
        organizationId: orgId,
      },
    });
  }

  async updateCourse(orgId: string, id: string, data: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course || course.organizationId !== orgId) {
      throw new NotFoundException('Course not found');
    }
    return this.prisma.course.update({
      where: { id },
      data,
    });
  }

  async deleteCourse(orgId: string, id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { sections: true },
    });
    if (!course || course.organizationId !== orgId) {
      throw new NotFoundException('Course not found');
    }
    if (course.sections.length > 0) {
      throw new BadRequestException(
        'Cannot delete course with active sections',
      );
    }
    return this.prisma.course.delete({ where: { id } });
  }

  async getCourseById(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async validateCourseBelongsToOrg(courseId: string, organizationId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.organizationId !== organizationId) {
      throw new ForbiddenException('Course does not belong to your organization');
    }

    return course;
  }
}
