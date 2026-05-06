import { Module } from '@nestjs/common';
import { AcademicCyclesService } from './academic-cycles.service';
import { AcademicCyclesController } from './academic-cycles.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AcademicCyclesController],
  providers: [AcademicCyclesService],
  exports: [AcademicCyclesService],
})
export class AcademicCyclesModule {}
