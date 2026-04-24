import { Module } from '@nestjs/common';
import { InsightsService } from './insights.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [InsightsService],
  exports: [InsightsService],
})
export class InsightsModule {}
