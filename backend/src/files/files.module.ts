import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as fs from 'fs';
import * as path from 'path';
import { FilesController } from './files.controller';
import { FilesService } from './files.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: (
          req: Express.Request & {
            body: { orgId?: string; entityType?: string; entityId?: string };
          },
          _file: Express.Multer.File,
          cb: (error: Error | null, destination: string) => void,
        ) => {
          const { orgId, entityType, entityId } = req.body;

          // Fallback values so multer doesn't crash before validation runs
          const safeOrg = orgId ?? 'unknown';
          const safeEntity = entityType ?? 'unknown';
          const safeEntityId = entityId ?? 'unknown';

          const uploadPath = path.join(
            process.cwd(),
            'uploads',
            'orgs',
            safeOrg,
            safeEntity,
            safeEntityId,
          );

          fs.mkdirSync(uploadPath, { recursive: true });
          cb(null, uploadPath);
        },
        filename: (
          _req: Express.Request,
          file: Express.Multer.File,
          cb: (error: Error | null, filename: string) => void,
        ) => {
          const uniquePrefix = Date.now().toString();
          // Sanitise original name: replace spaces with dashes
          const sanitized = file.originalname.replace(/\s+/g, '-');
          cb(null, `${uniquePrefix}-${sanitized}`);
        },
      }),
      // Hard upper limit — per-type enforcement happens in the controller
      limits: { fileSize: 20 * 1024 * 1024 },
    }),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
