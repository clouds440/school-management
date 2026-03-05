import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = process.env.SUPER_ADMIN_USERNAME;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
        console.error('SUPER_ADMIN_USERNAME or SUPER_ADMIN_PASSWORD not set in environment variables');
        return;
    }

    const existing = await prisma.user.findUnique({
        where: { email: adminEmail }
    });

    if (!existing) {
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        await prisma.user.create({
            data: {
                email: adminEmail,
                password: hashedPassword,
                role: 'SUPER_ADMIN',
                isFirstLogin: true
            }
        });
        console.log('Super Admin created: admin@school.com / adminpassword123');
    } else {
        console.log('Super Admin already exists');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
