import { PrismaClient, Role, OrgStatus, TeacherStatus, StudentStatus, Teacher, Course, Section } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

const TARGET_ORG_ID = '7375c4e6-3a3b-4698-9cbd-68e5c85774e2';

async function main() {
    const adminEmail = process.env.SUPER_ADMIN_USERNAME;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    const hashedPassword = await bcrypt.hash(adminPassword!, 10);

    console.log('--- Seeding Super Admin ---');
    await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail!,
            password: hashedPassword,
            role: Role.SUPER_ADMIN,
            isFirstLogin: false,
            name: 'System Super Admin'
        }
    });

    console.log('--- Seeding Many Organizations ---');
    const orgsToCreate = 400;
    for (let i = 0; i < orgsToCreate; i++) {
        const name = faker.company.name();
        await prisma.organization.create({
            data: {
                name: `${name} Academy`,
                location: faker.location.city(),
                type: faker.helpers.arrayElement(['K-12', 'High School', 'Middle School', 'Primary School', 'International']),
                contactEmail: faker.internet.email(),
                phone: faker.phone.number(),
                status: faker.helpers.arrayElement([OrgStatus.APPROVED, OrgStatus.PENDING, OrgStatus.SUSPENDED]),
                createdAt: faker.date.past()
            }
        });
    }

    console.log(`--- Seeding/Ensuring Specific Organization: ${TARGET_ORG_ID} ---`);
    await prisma.organization.upsert({
        where: { id: TARGET_ORG_ID },
        update: {
            status: OrgStatus.APPROVED
        },
        create: {
            id: TARGET_ORG_ID,
            name: 'Main Testing University',
            location: 'Springfield',
            type: 'University',
            contactEmail: 'contact@testinguni.edu',
            phone: '555-0199',
            status: OrgStatus.APPROVED
        }
    });

    console.log('--- Seeding Courses for Target Org ---');
    const courses: Course[] = [];
    const courseNames = ['Mathematics 101', 'Introduction to Physics', 'World History', 'English Literature', 'Computer Science Fundamentals'];
    for (const name of courseNames) {
        const course = await prisma.course.create({
            data: {
                name,
                description: faker.lorem.sentence(),
                organizationId: TARGET_ORG_ID
            }
        });
        courses.push(course);
    }

    console.log('--- Seeding Teachers for Target Org ---');
    const teachers: Teacher[] = [];
    for (let i = 0; i < 12; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.TEACHER,
                name: `${firstName} ${lastName}`,
                organizationId: TARGET_ORG_ID,
                isFirstLogin: false
            }
        });

        const teacher = await prisma.teacher.create({
            data: {
                userId: user.id,
                organizationId: TARGET_ORG_ID,
                subject: faker.helpers.arrayElement(courseNames),
                designation: faker.person.jobTitle(),
                department: faker.commerce.department(),
                salary: parseFloat(faker.commerce.price({ min: 30000, max: 80000 })),
                status: TeacherStatus.ACTIVE
            }
        });
        teachers.push(teacher);
    }

    console.log('--- Seeding Sections for Target Org ---');
    const sections: Section[] = [];
    const semesters = ['Fall 2025', 'Spring 2026', 'Fall 2026'];
    for (const course of courses) {
        for (let j = 1; j <= 3; j++) {
            const section = await prisma.section.create({
                data: {
                    name: `Section ${String.fromCharCode(64 + j)}`,
                    semester: faker.helpers.arrayElement(semesters),
                    year: '2025',
                    room: `Room ${faker.number.int({ min: 101, max: 405 })}`,
                    courseId: course.id,
                    teachers: {
                        connect: [{ id: faker.helpers.arrayElement(teachers).id }]
                    }
                }
            });
            sections.push(section);
        }
    }

    console.log('--- Seeding Students for Target Org ---');
    for (let i = 0; i < 60; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({ firstName, lastName }).toLowerCase();

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                role: Role.STUDENT,
                name: `${firstName} ${lastName}`,
                organizationId: TARGET_ORG_ID,
                isFirstLogin: false
            }
        });

        const student = await prisma.student.create({
            data: {
                userId: user.id,
                organizationId: TARGET_ORG_ID,
                registrationNumber: `STU-${faker.string.alphanumeric(8).toUpperCase()}`,
                fatherName: faker.person.fullName({ sex: 'male' }),
                fee: parseFloat(faker.commerce.price({ min: 1000, max: 5000 })),
                age: faker.number.int({ min: 18, max: 25 }),
                status: StudentStatus.ACTIVE,
                admissionDate: faker.date.past()
            }
        });

        // Enroll student in 2-3 random sections
        const numEnrollments = faker.number.int({ min: 2, max: 3 });
        const selectedSections = faker.helpers.arrayElements(sections, numEnrollments);

        for (const section of selectedSections) {
            await prisma.enrollment.create({
                data: {
                    studentId: student.id,
                    sectionId: section.id
                }
            }).catch(() => {
                // Ignore unique constraint errors if any
            });
        }
    }

    console.log('Seeding completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
