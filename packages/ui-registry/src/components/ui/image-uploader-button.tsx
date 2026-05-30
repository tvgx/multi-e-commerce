"use client";
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './button'; // Giả sử có sẵn component Button
import { cn } from '../../lib/utils';

interface ImageUploaderButtonProps {
  onUploadSuccess: (urls: string[]) => void;
  uploadType?: 'product' | 'avatar' | 'banner';
  multiple?: boolean;
  maxFiles?: number;
  className?: string;
}

export function ImageUploaderButton({
  onUploadSuccess,
  uploadType = 'product',
  multiple = true,
  maxFiles = 10,
  className,
}: ImageUploaderButtonProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      setError(null);
      setIsUploading(true);

      try {
        const formData = new FormData();
        acceptedFiles.forEach((file) => {
          formData.append(multiple ? 'files' : 'file', file);
        });

        // Dùng Next.js API Route proxy (/api/storage/upload) thay vì gọi thẳng
        // NestJS — proxy chạy server-side nên forward được cookie session đúng cách
        const endpoint = multiple 
          ? `/api/storage/upload?type=${uploadType}&batch=true`
          : `/api/storage/upload?type=${uploadType}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => ({}));
          throw new Error(errBody.message || `Upload failed (${response.status})`);
        }

        // API trả về BaseResponseDto: { code: "1000", message: "OK", data: MediaObject | MediaObject[] }
        const data = await response.json();
        
        if (data.code === '1000') {
          // Single upload: data.data là MediaObject { url, key, ... }
          // Batch upload:  data.data là MediaObject[]
          const mediaData = data.data;
          const urls: string[] = multiple
            ? (Array.isArray(mediaData) ? mediaData.map((m: any) => m.url) : [mediaData?.url])
            : [mediaData?.url];
          onUploadSuccess(urls.filter(Boolean));
        } else {
          throw new Error(data.message || 'Upload failed');
        }
      } catch (err: any) {
        setError(err.message || 'Something went wrong while uploading');
      } finally {
        setIsUploading(false);
      }
    },
    [multiple, onUploadSuccess, uploadType]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
    },
    maxSize: 5 * 1024 * 1024, // 5MB
    multiple,
    maxFiles: multiple ? maxFiles : 1,
    noDrag: true, // Chúng ta muốn nó hoạt động chủ yếu như một nút bấm
  });

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div {...getRootProps()} className="inline-block">
        <input {...getInputProps()} />
        <Button
          type="button"
          variant="outline"
          disabled={isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          <span>{isUploading ? 'Đang tải lên...' : 'Tải ảnh lên'}</span>
        </Button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
