export interface UploadedFileInfo {
  id: string;
  path: string;
  filename: string;
  size: number;
  mimeType: string;
  entityType: string;
  entityId: string;
  orgId: string;
  publicId?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface DeleteFileResult {
  message: string;
}
