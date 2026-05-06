import { Module } from '@nestjs/common';
import { CopyForwardService } from './copy-forward.service';
import { CopyForwardController } from './copy-forward.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CopyForwardController],
  providers: [CopyForwardService],
  exports: [CopyForwardService],
})
export class CopyForwardModule {}
