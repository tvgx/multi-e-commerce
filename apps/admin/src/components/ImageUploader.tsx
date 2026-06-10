import React, { useState } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

interface ImageUploaderProps {
  shopId: string;
  onUpload: (url: string) => void;
}

export function ImageUploader({ shopId, onUpload }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiClient.post<any>('/api/media/upload', formData, { shopId } as any);

      if (res.data?.url) {
        onUpload(res.data.url);
      } else {
        alert('Upload failed');
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <label className={`cursor-pointer border-2 border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" disabled={uploading} />
      {uploading ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Upload size={16} className="text-slate-400" />}
      <span className="text-sm font-medium text-slate-300">
        {uploading ? 'Uploading...' : 'Upload Image'}
      </span>
    </label>
  );
}
