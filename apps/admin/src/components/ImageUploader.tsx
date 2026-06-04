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
      formData.append('shopId', shopId);
      
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      const res = await fetch(`${API_BASE}/api/media/upload`, {
        method: 'POST',
        body: formData,
        // Since we are uploading to same domain or API domain, include credentials if needed.
        // Wait, the Next.js app is on port 3001 and API is on port 3000. 
        // Our apiClient handles this for us! Let's use apiClient instead of fetch if possible.
        // But apiClient might not handle FormData well if it sets Content-Type to application/json by default.
        // Let's stick with fetch, or better, use apiClient with no custom Content-Type.
      });
      
      const data = await res.json();
      if (data.data?.url) {
        onUpload(data.data.url);
      } else {
        alert('Upload failed: ' + (data.message || 'Unknown error'));
      }
    } catch (err: any) {
      alert('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
      // Reset input
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
