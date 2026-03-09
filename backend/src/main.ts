import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const frontendUrl = process.env.FRONTEND_URL; // Default to permissive in dev if not set, but restrict in prod
  app.enableCors({ origin: frontendUrl });
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Initialize Super Admin
  const prisma = new PrismaClient();
  const adminEmail = process.env.SUPER_ADMIN_USERNAME;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

  if (adminEmail && adminPassword) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'SUPER_ADMIN' }
    });

    if (!existingAdmin) {
      await prisma.user.create({
        data: {
          email: adminEmail,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          isFirstLogin: true,
        }
      });
    }
  }

  await app.listen(3000);
}
bootstrap();
