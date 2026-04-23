'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useGlobal } from '@/context/GlobalContext';
import { api } from '@/lib/api';
import { Role } from '@/types';
import { FileText, Download, ExternalLink, Trash2, Plus, Upload, X, FileImage, FileCode, Archive, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Loading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { downloadFile } from '@/lib/utils';

interface CourseMaterial {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  files: Array<{
    id: string;
    filename: string;
    path: string;
    mimeType: string;
    size: number;
  }>;
  creator: {
    id: string;
    name?: string;
  } | null;
}

// Helper function to get file icon based on MIME type
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return FileImage;
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
  if (mimeType.includes('javascript') || mimeType.includes('json') || mimeType.includes('xml')) return FileCode;
  return FileText;
}

// Helper function to format file size
function formatFileSize(bytes: number) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

interface CourseMaterialsProps {
  sectionId: string;
  role: Role;
}

export default function CourseMaterials({ sectionId, role }: CourseMaterialsProps) {
  const { token } = useAuth();
  const { state, dispatch } = useGlobal();
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<CourseMaterial | null>(null);
  const [viewingMaterial, setViewingMaterial] = useState<CourseMaterial | null>(null);
  const [deletingMaterial, setDeletingMaterial] = useState<CourseMaterial | null>(null);

  const fetchMaterials = useCallback(async () => {
    if (!token || !sectionId) return;
    setIsLoading(true);
    try {
      const data = await api.courseMaterials.getMaterials(sectionId, token);
      setMaterials(data);
    } catch (error) {
      console.error('Failed to fetch materials:', error);
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to load materials', type: 'error' } });
    } finally {
      setIsLoading(false);
    }
  }, [token, sectionId, dispatch]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const handleDelete = async () => {
    if (!token || !deletingMaterial) return;
    
    try {
      await api.courseMaterials.deleteMaterial(deletingMaterial.id, token);
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Material deleted successfully', type: 'success' } });
      fetchMaterials();
      setDeletingMaterial(null);
    } catch (error) {
      console.error('Failed to delete material:', error);
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to delete material', type: 'error' } });
      setDeletingMaterial(null);
    }
  };

  const handleDownload = async (file: { path: string; filename: string }) => {
    try {
      await downloadFile(file.path, file.filename);
    } catch (error) {
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to download file', type: 'error' } });
    }
  };

  const canUpload = role === Role.TEACHER || role === Role.ORG_ADMIN || role === Role.ORG_MANAGER;
  const canDelete = role === Role.TEACHER || role === Role.ORG_ADMIN || role === Role.ORG_MANAGER;
  const canViewDetails = true; // All users can view material details

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loading size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        {canUpload && (
          <Button
            onClick={() => setShowUploadModal(true)}
            icon={Plus}
          >
            Add Material
          </Button>
        )}
      </div>

      {/* Materials List */}
      {materials.length === 0 ? (
        <div className="bg-primary/5 border border-dashed border-border rounded-xl p-12 text-center">
          <FileText className="w-12 h-12 text-card-text/20 mx-auto mb-4" />
          <p className="text-card-text/40 font-bold tracking-widest text-xs">No materials uploaded yet</p>
          {canUpload && (
            <p className="text-card-text/30 text-sm mt-2">Click "Add Material" to upload your first resource</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <div
              key={material.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-all shadow-sm hover:shadow-md group"
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <FileText className="w-4 h-4 text-primary" />
                    </div>
                    <h4 className="font-semibold text-card-text truncate text-lg">{material.title}</h4>
                  </div>
                  {material.description && (
                    <p className="text-sm text-card-text/60 line-clamp-2">{material.description}</p>
                  )}
                </div>
                {(canViewDetails || canDelete) && (
                  <div className="flex gap-2 opacity-40 group-hover:opacity-100 transition-all duration-300">
                    {canViewDetails && (
                      <button
                        onClick={() => setViewingMaterial(material)}
                        className="p-2.5 text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-xl border border-transparent hover:border-primary bg-foreground shadow-xs"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    {canDelete && (
                      <>
                        <button
                          onClick={() => setEditingMaterial(material)}
                          className="p-2.5 text-muted hover:text-primary transition-all hover:bg-primary/10 rounded-xl border border-transparent hover:border-primary bg-foreground shadow-xs"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingMaterial(material)}
                          className="p-2.5 text-red-500 hover:text-red-500 transition-all hover:bg-red-500/50 rounded-xl border border-transparent hover:border-red-500 bg-foreground shadow-xs"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4 text-[11px] text-card-text/40 font-bold tracking-widest mb-4">
                <span>Added {new Date(material.createdAt).toLocaleDateString()}</span>
                {material.creator?.name && <span>by {material.creator.name}</span>}
              </div>

              {/* Files */}
              {material.files.length > 0 && (
                <div className="pt-4 border-t border-border/50">
                  <p className="text-[10px] font-black text-card-text/40 tracking-widest mb-3">ATTACHED FILES</p>
                  <div className="space-y-2">
                    {material.files.map((file) => {
                      const FileIcon = getFileIcon(file.mimeType);
                      return (
                        <button
                          key={file.id}
                          onClick={() => handleDownload(file)}
                          className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-primary/5 transition-colors group/file w-full text-left"
                        >
                          <FileIcon className="w-4 h-4 text-card-text/40 group-hover/file:text-primary transition-colors shrink-0" />
                          <span className="text-sm text-card-text/70 group-hover/file:text-card-text transition-colors flex-1 truncate">
                            {file.filename}
                          </span>
                          <span className="text-xs text-card-text/30 shrink-0">
                            {formatFileSize(file.size)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <UploadMaterialModal
          sectionId={sectionId}
          onClose={() => setShowUploadModal(false)}
          onSuccess={() => {
            fetchMaterials();
            setShowUploadModal(false);
          }}
        />
      )}

      {/* View Details Modal */}
      {viewingMaterial && (
        <Modal
          isOpen={true}
          onClose={() => setViewingMaterial(null)}
          title="Material Details"
          maxWidth="max-w-2xl"
        >
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-black text-card-text mb-2">{viewingMaterial.title}</h3>
              {viewingMaterial.description && (
                <p className="text-card-text/70">{viewingMaterial.description}</p>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-card-text/40">
              <span>Added {new Date(viewingMaterial.createdAt).toLocaleDateString()}</span>
              {viewingMaterial.creator?.name && <span>by {viewingMaterial.creator.name}</span>}
            </div>

            {viewingMaterial.files.length > 0 && (
              <div>
                <p className="text-[10px] font-black text-card-text/40 tracking-widest mb-3">ATTACHED FILES</p>
                <div className="space-y-2">
                  {viewingMaterial.files.map((file) => {
                    const FileIcon = getFileIcon(file.mimeType);
                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                      >
                        <FileIcon className="w-5 h-5 text-primary shrink-0" />
                        <span className="text-sm text-card-text/70 flex-1 truncate">{file.filename}</span>
                        <span className="text-xs text-card-text/30">{formatFileSize(file.size)}</span>
                        <button
                          onClick={() => handleDownload(file)}
                          className="p-2 text-primary cursor-pointer hover:text-primary/80 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => setViewingMaterial(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingMaterial && (
        <UploadMaterialModal
          sectionId={sectionId}
          material={editingMaterial}
          onClose={() => setEditingMaterial(null)}
          onSuccess={() => {
            fetchMaterials();
            setEditingMaterial(null);
          }}
        />
      )}

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingMaterial}
        onClose={() => setDeletingMaterial(null)}
        onConfirm={handleDelete}
        title="Delete Material"
        description={`Are you sure you want to delete "${deletingMaterial?.title}"? This will also remove all attached files.`}
        confirmText="Delete Material"
        isDestructive={true}
      />
    </div>
  );
}

// Upload Modal Component
function UploadMaterialModal({
  sectionId,
  material,
  onClose,
  onSuccess,
}: {
  sectionId: string;
  material?: CourseMaterial | null;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { token } = useAuth();
  const { state, dispatch } = useGlobal();
  const [title, setTitle] = useState(material?.title || '');
  const [description, setDescription] = useState(material?.description || '');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<Array<{id: string, filename: string, path: string, mimeType: string, size: number}>>(material?.files || []);
  const [filesToRemove, setFilesToRemove] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (material) {
      setTitle(material.title);
      setDescription(material.description || '');
      setExistingFiles(material.files || []);
    }
  }, [material]);

  const handleFileUpload = async (files: FileList) => {
    setPendingFiles([...pendingFiles, ...Array.from(files)]);
  };

  const handleRemoveFile = (index: number) => {
    setPendingFiles(pendingFiles.filter((_, i) => i !== index));
  };

  const handleRemoveExistingFile = (fileId: string) => {
    setFilesToRemove([...filesToRemove, fileId]);
    setExistingFiles(existingFiles.filter(f => f.id !== fileId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !title) return;

    setIsUploading(true);
    try {
      if (material) {
        // Edit existing material
        const orgId = state.auth.user?.orgId || state.auth.user?.organizationId;
        const uploadedFileIds: string[] = [];
        
        // Upload new files
        if (orgId && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const data = await api.files.uploadFile(orgId, 'COURSE_MATERIAL', 'temp', file, token);
            uploadedFileIds.push(data.id);
          }
        }

        // Update material
        await api.courseMaterials.updateMaterial(
          material.id,
          { title, description, fileIds: uploadedFileIds, filesToRemove },
          token,
        );

        dispatch({ type: 'TOAST_ADD', payload: { message: 'Material updated successfully', type: 'success' } });
        onSuccess();
      } else {
        // Create new material
        const orgId = state.auth.user?.orgId || state.auth.user?.organizationId;
        const uploadedFileIds: string[] = [];
        
        if (orgId && pendingFiles.length > 0) {
          for (const file of pendingFiles) {
            const data = await api.files.uploadFile(orgId, 'COURSE_MATERIAL', 'temp', file, token);
            uploadedFileIds.push(data.id);
          }
        }

        // Create material with fileIds
        const newMaterial = await api.courseMaterials.createMaterial(
          sectionId,
          { title, description, fileIds: uploadedFileIds },
          token,
        );

        dispatch({ type: 'TOAST_ADD', payload: { message: 'Material created successfully', type: 'success' } });
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to save material:', error);
      dispatch({ type: 'TOAST_ADD', payload: { message: 'Failed to save material', type: 'error' } });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose} title="Upload Course Material">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20"
            placeholder="e.g., Lecture Notes - Week 1"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-25"
            placeholder="Optional description of the material..."
            rows={4}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Files</label>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              multiple
              onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-3"
            >
              <Upload className="w-8 h-8 text-card-text/40" />
              <span className="text-sm text-card-text/60">
                {isUploading ? 'Uploading...' : 'Click to upload files'}
              </span>
              <span className="text-xs text-card-text/30">
                PDF, DOCX, XLSX, PPTX, ZIP (max 50MB)
              </span>
            </label>
          </div>
          
          {/* Staged Files List */}
          {(pendingFiles.length > 0 || existingFiles.length > 0) && (
            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-card-text/40 tracking-widest">
                {material ? 'FILES' : 'STAGED FILES'}
              </p>
              
              {/* Existing files (in edit mode) */}
              {existingFiles.map((file) => {
                const FileIcon = getFileIcon(file.mimeType);
                return (
                  <div
                    key={file.id}
                    className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                  >
                    <FileIcon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-card-text/70 flex-1 truncate">{file.filename}</span>
                    <span className="text-xs text-card-text/30">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveExistingFile(file.id)}
                      className="text-card-text/40 hover:text-destructive transition-colors p-1"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
              
              {/* New pending files */}
              {pendingFiles.map((file, index) => {
                const FileIcon = getFileIcon(file.type);
                return (
                  <div
                    key={`new-${index}`}
                    className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg border border-primary/20"
                  >
                    <FileIcon className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-sm text-card-text/70 flex-1 truncate">{file.name}</span>
                    <span className="text-xs text-card-text/30">{formatFileSize(file.size)}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-card-text/40 hover:text-destructive transition-colors p-1"
                      title="Remove file"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title || isUploading}>
            {isUploading ? 'Creating...' : 'Create Material'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
