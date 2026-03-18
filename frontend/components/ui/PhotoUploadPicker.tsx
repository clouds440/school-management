'use client';

import { useState, useRef, useCallback } from 'react';
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
}: PhotoUploadPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null);   // for cropper
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);   // real-time preview
  const [pendingFilename, setPendingFilename] = useState('photo.jpg');
  const [showCropper, setShowCropper] = useState(false);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    const objectUrl = URL.createObjectURL(croppedFile);
    setPreviewUrl(objectUrl);

    onFileReady(croppedFile);
  }, [onFileReady]);

  const handleCropCancel = useCallback(() => {
    setShowCropper(false);
    setRawDataUrl(null);
  }, []);

  // Determine what to show in the avatar
  const displaySrc = previewUrl ?? currentImageUrl ?? null;

  const resolvedSrc = (displaySrc?.startsWith('blob:') || displaySrc?.startsWith('data:'))
    ? displaySrc
    : getPublicUrl(displaySrc);

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className={`group relative ${sizeClassName} rounded-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/60 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center overflow-hidden shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2`}
          aria-label={`Upload ${type === 'user' ? 'profile picture' : 'organisation logo'}`}
        >
          {resolvedSrc ? (
            resolvedSrc.startsWith('blob:') || resolvedSrc.startsWith('data:') ? (
              <Image
                src={resolvedSrc}
                alt="Preview"
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            ) : (
              <Image
                src={resolvedSrc}
                alt="Saved photo"
                fill
                className="object-cover"
                unoptimized
              />
            )
          ) : (
            type === 'user' ? (
              <User className="w-1/2 h-1/2 text-indigo-300" />
            ) : (
              <Building2 className="w-1/2 h-1/2 text-indigo-300" />
            )
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>

        {hint && <p className="text-[10px] text-gray-400 text-center max-w-[180px] leading-tight">{hint}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
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
