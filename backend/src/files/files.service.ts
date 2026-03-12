import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { FileUploadDto } from './files.dto';
import { Role } from '../common/enums';
import { UploadedFileInfo, DeleteFileResult } from './interfaces/files.interfaces';

const prisma = new PrismaClient();

@Injectable()
export class FilesService {
  /**
   * Creates a database record for a file that multer already saved to disk.
   * Returns structured file metadata.
   */
  async saveFile(
    dto: FileUploadDto,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<UploadedFileInfo> {
    const forwardSlash = file.path.replace(/\\/g, '/');
    // On Windows, multer gives an absolute path (e.g. C:/…/uploads/orgs/…).
    // Strip everything before 'uploads/' so we store a portable relative path.
    const uploadsIndex = forwardSlash.indexOf('uploads/');
    const normalizedPath = uploadsIndex >= 0
      ? forwardSlash.slice(uploadsIndex)
      : forwardSlash;

    const record = await prisma.file.create({
      data: {
        orgId: dto.orgId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        path: normalizedPath,
        filename: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedBy,
      },
    });

    return {
      id: record.id,
      path: record.path,
      filename: record.filename,
      size: record.size,
      mimeType: record.mimeType,
      entityType: record.entityType,
      entityId: record.entityId,
      orgId: record.orgId,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
    };
  }

  /**
   * Deletes a file from disk and removes its database record.
   * Verifies that the requesting user belongs to the same organization that
   * owns the file (SUPER_ADMIN and PLATFORM_ADMIN are exempt).
   */
  async deleteFile(
    fileId: string,
    requestingUser: { id: string; role: string; organizationId: string | null },
  ): Promise<DeleteFileResult> {
    const record = await prisma.file.findUnique({ where: { id: fileId } });

    if (!record) {
      throw new NotFoundException(`File with id "${fileId}" not found`);
    }

    // Org-ownership check: skip for global admins
    const isGlobalAdmin =
      requestingUser.role === Role.SUPER_ADMIN ||
      requestingUser.role === Role.PLATFORM_ADMIN;

    if (!isGlobalAdmin && requestingUser.organizationId !== record.orgId) {
      throw new ForbiddenException(
        'You do not have permission to delete this file',
      );
    }

    // Remove from filesystem (best-effort, do not throw if already gone)
    const absolutePath = path.resolve(record.path);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
    }

    await prisma.file.delete({ where: { id: fileId } });

    return { message: 'File deleted successfully' };
  }
}
