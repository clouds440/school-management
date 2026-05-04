'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Camera, User, Building2 } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';
import { getPublicUrl } from '@/lib/utils';

interface PhotoUploadPickerProps {
  /** Currently saved image URL from the server (null if none) */
  currentImageUrl?: string | null;
  /** Called whenever the user finishes cropping — parent stores the File for submission */
  onFileReady: (file: File) => void;
  /** Small text to show below the picker */
  hint?: string;
  /** The icon to show as a placeholder ('user' or 'org') */
  type?: 'user' | 'org';
  /** Sizes for the container (default is w-24 h-24) */
  sizeClassName?: string;
  /** Whether the picker is disabled */
  disabled?: boolean;
}

/**
 * Clickable photo avatar. 
 * Generalization of LogoUploadPicker for users and organizations.
 */
export function PhotoUploadPicker({
  currentImageUrl,
  onFileReady,
  hint = 'Recommended: square image, at least 256×256px',
  type = 'user',
  sizeClassName = 'w-24 h-24',
  disabled = false,
}: PhotoUploadPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewObjectUrlRef = useRef<string | null>(null);
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null);   // for cropper
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);   // real-time preview
  const [pendingFilename, setPendingFilename] = useState('photo.jpg');
  const [showCropper, setShowCropper] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type === 'image/svg+xml') {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setRawDataUrl(reader.result as string);
      setPendingFilename(file.name);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Reset so the same file can be picked again
    e.target.value = '';
  }, []);

  const handleCropConfirm = useCallback((croppedFile: File) => {
    setShowCropper(false);
    setRawDataUrl(null);

    // Generate local preview URL
    if (previewObjectUrlRef.current) {
      URL.revokeObjectURL(previewObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(croppedFile);
    previewObjectUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);

    onFileReady(croppedFile);
  }, [onFileReady]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setRawDataUrl(null);
  }, []);

  useEffect(() => {
    return () => {
      if (previewObjectUrlRef.current) {
        URL.revokeObjectURL(previewObjectUrlRef.current);
        previewObjectUrlRef.current = null;
      }
    };
  }, []);

  // Determine what to show in the avatar
  const displaySrc = previewUrl ?? currentImageUrl ?? null;

  const resolvedSrc = (displaySrc?.startsWith('blob:') || displaySrc?.startsWith('data:'))
    ? displaySrc
    : getPublicUrl(displaySrc);

  return (
    <>
      <div className="flex flex-col items-center gap-3 sm:gap-4">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => !disabled && fileInputRef.current?.click()}
          className={`group relative ${sizeClassName} rounded-full border-2 border-dashed ${disabled ? 'border-border bg-muted/10 cursor-not-allowed opacity-60' : 'border-primary/30 hover:border-primary/60 bg-primary/5 hover:bg-primary/10 cursor-pointer'} transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg focus:outline-none focus:ring-4 focus:ring-primary/20 focus:ring-offset-2`}
          aria-label={`Upload ${type === 'user' ? 'profile picture' : 'organisation logo'}`}
          disabled={disabled}
        >
          {resolvedSrc ? (
            resolvedSrc.startsWith('blob:') || resolvedSrc.startsWith('data:') ? (
              <Image
                src={resolvedSrc}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 640px) 96px, 96px"
                unoptimized
              />
            ) : (
              <Image
                src={resolvedSrc}
                alt="Saved photo"
                fill
                className="object-cover"
              />
            )
          ) : (
            type === 'user' ? (
              <User className="w-1/2 h-1/2 text-primary/30" />
            ) : (
              <Building2 className="w-1/2 h-1/2 text-primary/30" />
            )
          )}

          {/* Hover overlay */}
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
          )}
        </button>

        {hint && <p className="text-[10px] sm:text-xs text-muted-foreground text-center max-w-45 sm:max-w-60 leading-tight">{hint}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="sr-only"
          onChange={handleFileChange}
          aria-hidden
        />
      </div>

      {/* Crop modal */}
      {showCropper && rawDataUrl && (
        <ImageCropperModal
          imageSrc={rawDataUrl}
          filename={pendingFilename}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      )}
    </>
  );
}
