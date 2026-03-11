'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import { Camera, Building2 } from 'lucide-react';
import { ImageCropperModal } from './ImageCropperModal';

interface LogoUploadPickerProps {
  /** Currently saved logo URL from the server (null if none) */
  currentLogoUrl?: string | null;
  /** Called whenever the user finishes cropping — parent stores the File for submission */
  onFileReady: (file: File) => void;
  /** Small text to show below the picker */
  hint?: string;
}

/**
 * Clickable logo avatar.
 * - Shows live preview immediately after crop
 * - Does NOT upload — parent uploads on form submit
 */
export function LogoUploadPicker({
  currentLogoUrl,
  onFileReady,
  hint = 'Recommended: square image, at least 256×256px',
}: LogoUploadPickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [rawDataUrl, setRawDataUrl] = useState<string | null>(null);   // for cropper
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);   // real-time preview
  const [pendingFilename, setPendingFilename] = useState('logo.jpg');
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
  const displaySrc = previewUrl ?? currentLogoUrl ?? null;
  const backendBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ?? '';

  // Guard: if the stored URL is an absolute OS path (legacy bad record),
  // skip it to avoid Next.js Image rejecting a malformed URL.
  const isValidLogoUrl = displaySrc &&
    (displaySrc.startsWith('blob:') ||
     displaySrc.startsWith('data:') ||
     displaySrc.startsWith('/uploads/'));

  const resolvedSrc = isValidLogoUrl
    ? (displaySrc!.startsWith('blob:') || displaySrc!.startsWith('data:')
        ? displaySrc!
        : `${backendBase}${displaySrc}`)
    : null;

  return (
    <>
      <div className="flex flex-col items-center gap-3">
        {/* Avatar */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="group relative w-24 h-24 rounded-full border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/60 hover:bg-indigo-50 transition-all duration-200 flex items-center justify-center overflow-hidden shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          aria-label="Upload organisation logo"
        >
          {resolvedSrc ? (
            resolvedSrc.startsWith('blob:') || resolvedSrc.startsWith('data:') ? (
              // Blob/data URLs: use next/image (local, no optimizer proxy needed)
              <Image
                src={resolvedSrc}
                alt="Organisation logo"
                fill
                className="object-cover"
                sizes="96px"
                unoptimized
              />
            ) : (
              // Server-stored URL (http://localhost:3000/uploads/...)
              // Use a plain <img> so it goes directly to the backend,
              // bypassing Next.js's image optimizer which blocks loopback IPs.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={resolvedSrc}
                alt="Organisation logo"
                className="w-full h-full object-cover"
              />
            )
          ) : (
            <Building2 className="w-10 h-10 text-indigo-300" />
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full flex items-center justify-center">
            <Camera className="w-6 h-6 text-white" />
          </div>
        </button>

        <p className="text-xs text-gray-400 text-center max-w-[180px]">{hint}</p>

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
