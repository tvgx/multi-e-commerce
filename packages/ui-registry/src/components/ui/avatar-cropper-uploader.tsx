"use client";
import React, { useState, useRef, useCallback } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './button'; // Giả sử có sẵn
import { cn } from '../../lib/utils';
import { useDropzone } from 'react-dropzone';

interface AvatarCropperUploaderProps {
  onUploadSuccess: (url: string) => void;
  currentAvatar?: string;
  className?: string;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarCropperUploader({
  onUploadSuccess,
  currentAvatar,
  className,
}: AvatarCropperUploaderProps) {
  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      setCrop(undefined); // Reset crop
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
    noDrag: true,
  });

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const getCroppedImg = async (
    image: HTMLImageElement,
    crop: PixelCrop,
    fileName: string
  ): Promise<File> => {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) throw new Error('No 2d context');

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'));
          return;
        }
        const file = new File([blob], fileName, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg');
    });
  };

  const handleUpload = async () => {
    if (!completedCrop || !imgRef.current) return;
    setIsUploading(true);
    try {
      const croppedFile = await getCroppedImg(imgRef.current, completedCrop, 'avatar.jpg');
      
      const formData = new FormData();
      formData.append('file', croppedFile);

      // Dùng Next.js API Route proxy (/api/storage/upload) thay vì gọi thẳng NestJS
      // Proxy chạy server-side, tự forward cookie session — giải quyết cross-origin cookie
      const response = await fetch(`/api/storage/upload?type=avatar`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        throw new Error(errBody.message || `Upload failed (${response.status})`);
      }
      
      // API trả về BaseResponseDto: { code: "1000", message: "OK", data: { url, key, ... } }
      const data = await response.json();
      if (data.code === '1000' && data.data?.url) {
        onUploadSuccess(data.data.url);
        setImgSrc(''); // Reset after success
      } else {
        throw new Error(data.message || 'Upload failed: no URL returned');
      }
    } catch (err) {
      console.error(err);
      alert('Upload failed: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-4 items-start', className)}>
      {imgSrc ? (
        <div className="flex flex-col gap-4 items-center bg-gray-50 p-4 rounded-lg border">
          <ReactCrop
            crop={crop}
            onChange={(c: Crop, percentCrop: Crop) => setCrop(percentCrop)}
            onComplete={(c: PixelCrop) => setCompletedCrop(c)}
            aspect={1}
            circularCrop
          >
            <img
              ref={imgRef}
              alt="Crop me"
              src={imgSrc}
              onLoad={onImageLoad}
              className="max-h-[300px] w-auto object-contain"
            />
          </ReactCrop>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImgSrc('')} disabled={isUploading}>
              <X className="w-4 h-4 mr-2" /> Hủy
            </Button>
            <Button onClick={handleUpload} disabled={isUploading || !completedCrop}>
              {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
              Cập nhật Avatar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden border">
            {currentAvatar ? (
              <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Upload className="w-6 h-6" />
              </div>
            )}
          </div>
          <div {...getRootProps()}>
            <input {...getInputProps()} />
            <Button type="button" variant="outline">Đổi Avatar</Button>
          </div>
        </div>
      )}
    </div>
  );
}
