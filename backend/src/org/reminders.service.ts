import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class RemindersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  /**
   * Runs every hour to check for assessments due in exactly 24 hours (+/- 30 mins window).
   * This ensures students get a single notification one day before the deadline.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkDueSoonAssessment() {
    const now = new Date();
    const tomorrowStart = new Date(now.getTime() + 23.5 * 60 * 60 * 1000);
    const tomorrowEnd = new Date(now.getTime() + 24.5 * 60 * 60 * 1000);

    // Find assessments due in the next 23.5 to 24.5 hours
    const assessments = await this.prisma.assessment.findMany({
      where: {
        dueDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
      },
      include: {
        section: {
          include: {
            enrollments: {
              include: {
                student: {
                  include: {
                    user: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    for (const assessment of assessments) {
      const enrollments = assessment.section.enrollments;

      for (const enrollment of enrollments) {
        const studentUser = enrollment.student.user;

        // Avoid duplicate notifications (idempotency check)
        const existing = await this.prisma.notification.findFirst({
          where: {
            userId: studentUser.id,
            type: 'ASSESSMENT_DUE_SOON',
            createdAt: {
              gte: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // within last 48h
            },
            // Prisma Json filter
            metadata: {
              path: ['assessmentId'],
              equals: assessment.id,
            },
          },
        });

        if (!existing) {
          await this.notifications.createNotification({
            userId: studentUser.id,
            title: 'Assignment Due Soon',
            body: `Reminder: Your assessment "${assessment.title}" is due in 24 hours.`,
            type: 'ASSESSMENT_DUE_SOON',
            actionUrl: `/assessments/${assessment.id}`,
            metadata: { assessmentId: assessment.id },
          });
        }
      }
    }
  }
}
