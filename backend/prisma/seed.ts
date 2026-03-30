import { PrismaClient, Role, OrgStatus, RequestStatus, TeacherStatus, StudentStatus, AssessmentType, GradeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Starting clean database reset ---');

  // Order of deletion matters to avoid FK violations
  const tableNames = [
    'RequestActionLog',
    'RequestMessage',
    'RequestUserView',
    'Request',
    'Submission',
    'Grade',
    'Assessment',
    'Enrollment',
    'Section',
    'Course',
    'Teacher',
    'Student',
    'User',
    'Organization',
    'File',
  ];

  for (const tableName of tableNames) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${tableName}" CASCADE;`);
    } catch (e) {
      console.log(`Could not truncate ${tableName}, skipping...`);
    }
  }

  console.log('--- Successfully cleaned database ---');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  // 1. Create Super Admin
  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@system.com',
      password: hashedPassword,
      role: Role.SUPER_ADMIN,
      name: 'System Root Admin',
      isFirstLogin: false,
    },
  });
  console.log('--- Super Admin Created: admin@system.com ---');

  // 2. Create Platform Admins
  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        email: `platform${i}@system.com`,
        password: hashedPassword,
        role: Role.PLATFORM_ADMIN,
        name: faker.person.fullName(),
        isFirstLogin: false,
      },
    });
  }
  console.log('--- 3 Platform Admins Created ---');

  // 3. Create 20 Organizations with diverse statuses
  const orgs: any[] = [];
  const statuses = [OrgStatus.APPROVED, OrgStatus.PENDING, OrgStatus.REJECTED, OrgStatus.SUSPENDED];
  
  for (let i = 0; i < 20; i++) {
    const status = i < 12 ? OrgStatus.APPROVED : statuses[i % 4];
    const org = await prisma.organization.create({
      data: {
        name: faker.company.name() + ' Academy',
        location: `${faker.location.city()}, ${faker.location.country()}`,
        type: faker.helpers.arrayElement(['HIGH_SCHOOL', 'UNIVERSITY', 'COLLEGE', 'ACADEMY']),
        contactEmail: faker.internet.email(),
        phone: faker.phone.number(),
        status: status,
      },
    });
    orgs.push(org);
  }
  console.log('--- 20 Organizations Created ---');

  // 4. Select the representative "Target Organization" for deep seeding
  const targetOrg = orgs.find((o) => o.status === OrgStatus.APPROVED)!;
  console.log(`--- Seeding Depth Data for: ${targetOrg.name} ---`);

  // Target Org Admin
  const orgAdminUser = await prisma.user.create({
    data: {
      email: 'admin@org.com',
      password: hashedPassword,
      role: Role.ORG_ADMIN,
      organizationId: targetOrg.id,
      name: faker.person.fullName(),
      isFirstLogin: false,
    },
  });

  // 5. Create 20 Courses for Target Org
  const subjectPool = ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'English', 'Computer Science', 'Economics', 'Geography', 'Art', 'Music', 'Philosophy', 'Sociology', 'Law', 'Engineering', 'Psychology', 'Literature', 'Marketing', 'Accounting', 'Environmental Science'];
  const courses: any[] = [];
  for (const subject of subjectPool) {
    const course = await prisma.course.create({
      data: {
        name: subject,
        description: `Introductory and Advanced studies in ${subject}.`,
        organizationId: targetOrg.id,
      },
    });
    courses.push(course);
  }
  console.log('--- 20 Courses Created ---');

  // 6. Create 10 Teachers (2 Managers)
  const teachers: any[] = [];
  for (let i = 0; i < 10; i++) {
    const isManager = i < 2;
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        role: isManager ? Role.ORG_MANAGER : Role.TEACHER,
        organizationId: targetOrg.id,
        name: faker.person.fullName(),
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        userId: user.id,
        organizationId: targetOrg.id,
        subject: faker.helpers.arrayElement(subjectPool),
        designation: isManager ? 'Head of Department' : 'Senior Lecturer',
        education: 'Masters in Education',
        status: TeacherStatus.ACTIVE,
        joiningDate: faker.date.past({ years: 5 }),
      },
      include: { user: true },
    });
    teachers.push(teacher);
  }
  console.log('--- 10 Teachers Created (2 Managers) ---');

  // 7. Create 10 Sections (meaningful names + linked to courses & teachers)
  const sections: any[] = [];
  for (let i = 0; i < 10; i++) {
    const course = courses[i];
    const section = await prisma.section.create({
      data: {
        name: `${course.name} - Section ${String.fromCharCode(65 + i)}`,
        semester: faker.helpers.arrayElement(['Spring 2026', 'Fall 2026']),
        year: '2026',
        room: `Hall ${100 + i}`,
        courseId: course.id,
        teachers: {
          connect: [{ id: teachers[i % teachers.length].id }],
        },
      },
    });
    sections.push(section);
  }
  console.log('--- 10 Sections Created ---');

  // 8. Create 45 legit Students
  const students: any[] = [];
  for (let i = 0; i < 45; i++) {
    const user = await prisma.user.create({
      data: {
        email: faker.internet.email().toLowerCase(),
        password: hashedPassword,
        role: Role.STUDENT,
        organizationId: targetOrg.id,
        name: faker.person.fullName(),
      },
    });

    const student = await prisma.student.create({
      data: {
        userId: user.id,
        organizationId: targetOrg.id,
        registrationNumber: `REG-${targetOrg.name.substring(0, 3).toUpperCase()}-${1000 + i}`,
        rollNumber: `${100 + i}`,
        major: faker.helpers.arrayElement(['Science', 'Arts', 'Commerce', 'Engineering']),
        status: StudentStatus.ACTIVE,
        admissionDate: faker.date.past({ years: 2 }),
      },
      include: { user: true },
    });
    students.push(student);
  }
  console.log('--- 45 Students Created ---');

  // 9. Enroll Students in different Sections
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    // Each student in 2-3 sections
    const numSections = faker.number.int({ min: 2, max: 3 });
    const selectedSections = faker.helpers.arrayElements(sections, numSections);
    
    for (const section of selectedSections) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          sectionId: section.id,
        },
      }).catch(() => {}); // Avoid duplicates
    }
  }
  console.log('--- Enrollments Completed ---');

  // 10. Assessments, Grades, and Submissions
  const assessmentTypes = [AssessmentType.ASSIGNMENT, AssessmentType.QUIZ, AssessmentType.MIDTERM, AssessmentType.PROJECT];
  for (const section of sections) {
    const numAssessments = faker.number.int({ min: 3, max: 4 });
    for (let i = 0; i < numAssessments; i++) {
      const type = assessmentTypes[i % assessmentTypes.length];
      const assessment = await prisma.assessment.create({
        data: {
          sectionId: section.id,
          courseId: section.courseId,
          organizationId: targetOrg.id,
          title: `${type} - ${faker.word.adjective()} Topic`,
          type: type,
          totalMarks: type === AssessmentType.QUIZ ? 20 : 100,
          weightage: type === AssessmentType.MIDTERM ? 30 : 10,
          dueDate: faker.date.future(),
        },
      });

      // Add Submissions and Grades for some students
      const enrolledStudents = students.slice(i * 10, (i + 1) * 10);
      for (const student of enrolledStudents) {
        if (faker.datatype.boolean(0.7)) {
          await prisma.submission.create({
            data: {
              assessmentId: assessment.id,
              studentId: student.id,
              fileUrl: 'https://example.com/submission.pdf',
            },
          });

          if (faker.datatype.boolean(0.8)) {
            await prisma.grade.create({
              data: {
                assessmentId: assessment.id,
                studentId: student.id,
                marksObtained: faker.number.int({ min: 5, max: assessment.totalMarks }),
                status: GradeStatus.PUBLISHED,
                feedback: faker.lorem.sentence(),
              },
            });
          }
        }
      }
    }
  }
  console.log('--- Assessments & Grades Seeded ---');

  // 11. Mail System (Requests, Messages, Logs)
  const users = await prisma.user.findMany({ take: 50 });
  const possibleCategories = ['Billing', 'Technical Support', 'Admission Query', 'Attendance Issue', 'Grade Revision'];
  const possiblePriorities = ['LOW', 'NORMAL', 'HIGH', 'URGENT'];

  for (let i = 0; i < 50; i++) {
    const creator = faker.helpers.arrayElement(users);
    const request = await prisma.request.create({
      data: {
        subject: faker.lorem.sentence({ min: 3, max: 6 }),
        category: faker.helpers.arrayElement(possibleCategories),
        priority: faker.helpers.arrayElement(possiblePriorities),
        status: faker.helpers.arrayElement([RequestStatus.OPEN, RequestStatus.RESOLVED, RequestStatus.IN_PROGRESS]),
        creatorId: creator.id,
        creatorRole: creator.role,
        organizationId: creator.organizationId,
        targetRole: creator.role === Role.ORG_ADMIN ? Role.SUPER_ADMIN : Role.ORG_ADMIN,
      },
    });

    // Add conversation history
    const numMessages = faker.number.int({ min: 1, max: 4 });
    for (let j = 0; j < numMessages; j++) {
      await prisma.requestMessage.create({
        data: {
          requestId: request.id,
          senderId: j % 2 === 0 ? creator.id : (users.find(u => u.role === Role.SUPER_ADMIN)?.id || creator.id),
          content: faker.lorem.paragraphs(1),
        },
      });
    }

    // Add action log
    await prisma.requestActionLog.create({
      data: {
        requestId: request.id,
        performedBy: creator.id,
        action: 'CREATED',
        note: 'Request initialized via seeding.',
      },
    });
  }
  console.log('--- 50+ Mail Requests Created ---');

  console.log('--- Seeding Completed Perfectly! ---');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
