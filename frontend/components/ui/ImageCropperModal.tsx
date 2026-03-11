'use client';

import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { X, Check, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

interface ImageCropperModalProps {
  /** The raw data-url of the image to crop */
  imageSrc: string;
  /** Called with the final cropped File blob when user confirms */
  onConfirm: (croppedFile: File) => void;
  /** Called when user cancels */
  onCancel: () => void;
  /** Original filename — used to name the output file */
  filename: string;
}

/**
 * Turns an image element + crop rect into a Blob via an off-screen <canvas>.
 */
async function getCroppedBlob(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height,
      );

      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas toBlob failed'));
      }, 'image/jpeg', 0.92);
    };
    image.onerror = () => reject(new Error('Failed to load image'));
  });
}

export function ImageCropperModal({
  imageSrc,
  onConfirm,
  onCancel,
  filename,
}: ImageCropperModalProps) {
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [confirming, setConfirming] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return;
    setConfirming(true);
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels);
      const ext = filename.split('.').pop() ?? 'jpg';
      const outputName = filename.replace(/\.[^.]+$/, `-cropped.${ext}`);
      const file = new File([blob], outputName, { type: 'image/jpeg' });
      onConfirm(file);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-gray-900">Crop Logo Image</h3>
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cropper */}
        <div className="relative bg-gray-900" style={{ height: 320 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            cropShape="round"
            showGrid={false}
          />
        </div>

        {/* Controls */}
        <div className="px-5 py-4 space-y-3 border-t border-gray-100">
          {/* Zoom */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 h-1.5 appearance-none rounded-full bg-gray-200 accent-indigo-600 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
          </div>

          {/* Rotation */}
          <div className="flex items-center gap-3">
            <RotateCw className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="range"
              min={0}
              max={360}
              step={1}
              value={rotation}
              onChange={(e) => setRotation(Number(e.target.value))}
              className="flex-1 h-1.5 appearance-none rounded-full bg-gray-200 accent-indigo-600 cursor-pointer"
            />
            <span className="text-xs text-gray-400 w-10 text-right">{rotation}°</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-5 pb-5">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-md border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-2.5 rounded-md bg-indigo-600 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {confirming ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Use This Crop
          </button>
        </div>
      </div>
    </div>
  );
}
