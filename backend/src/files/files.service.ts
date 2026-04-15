import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { v2 as cloudinary } from 'cloudinary';
import { FileUploadDto } from './files.dto';
import { Role } from '../common/enums';
import {
  UploadedFileInfo,
  DeleteFileResult,
} from './interfaces/files.interfaces';

@Injectable()
export class FilesService {
  constructor(private readonly prisma: PrismaService) {}
  /**
   * Creates a database record for a file that was uploaded to Cloudinary.
   * Returns structured file metadata.
   */
  async saveFile(
    dto: FileUploadDto,
    file: Express.Multer.File,
    uploadedBy: string,
  ): Promise<UploadedFileInfo> {
    // Cloudinary returns the full URL in file.path and public_id in file.filename (standard for multer-storage-cloudinary)
    const publicId = (file as any).public_id || file.filename;

    const record = await this.prisma.file.create({
      data: {
        orgId: dto.orgId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        path: file.path, // Full secure URL
        publicId: publicId,
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
   * Deletes a file from Cloudinary and removes its database record.
   * Verifies that the requesting user belongs to the same organization that
   * owns the file (SUPER_ADMIN and PLATFORM_ADMIN are exempt).
   */
  async deleteFile(
    fileId: string,
    requestingUser: { id: string; role: string; organizationId: string | null },
  ): Promise<DeleteFileResult> {
    const record = await this.prisma.file.findUnique({ where: { id: fileId } });

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

    // Remove from Cloudinary (best-effort)
    const publicId = record.publicId;
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.error(
          `Failed to delete file from Cloudinary: ${publicId}`,
          err,
        );
      }
    }

    await this.prisma.file.delete({ where: { id: fileId } });

    return { message: 'File deleted successfully' };
  }

  /**
   * Replaces an existing file (on disk or Cloudinary) with a new one.
   * Useful for logos and avatars where we only store the URL string.
   */
  async replaceFile(
    oldUrl: string | null,
    file: Express.Multer.File,
  ): Promise<string> {
    // 1. Delete old file if it exists
    if (oldUrl) {
      if (oldUrl.startsWith('http') && oldUrl.includes('cloudinary.com')) {
        // Extract public_id from Cloudinary URL
        const parts = oldUrl.split('/');
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
          const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
          const publicId = publicIdWithExt.split('.')[0];
          try {
            await cloudinary.uploader.destroy(publicId);
          } catch (err) {
            console.error(
              `Failed to delete old file from Cloudinary: ${publicId}`,
              err,
            );
          }
        }
      }
    }
    // Note: Local file deletion is omitted here as we transitioned to Cloudinary,
    // but the logic can be added back if mixed storage is needed.

    return file.path; // New Cloudinary URL
  }
}
