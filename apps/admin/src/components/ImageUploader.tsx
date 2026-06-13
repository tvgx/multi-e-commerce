import React from 'react';
import { Upload, Loader2 } from 'lucide-react';

interface ImageUploaderProps {
  onFileSelected: (file: File) => void;
  busy?: boolean;
}

// Chỉ chọn file — việc upload do form cha quyết định (ảnh sản phẩm phải
// upload sau khi có productId để MinIO đặt tên <productId>-N).
export function ImageUploader({ onFileSelected, busy = false }: ImageUploaderProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelected(file);
    e.target.value = '';
  };

  return (
    <label className={`cursor-pointer border-2 border-dashed border-white/20 rounded-xl p-4 flex items-center justify-center gap-2 hover:bg-white/5 transition-colors ${busy ? 'opacity-50 pointer-events-none' : ''}`}>
      <input type="file" accept="image/*" onChange={handleChange} className="hidden" disabled={busy} />
      {busy ? <Loader2 size={16} className="animate-spin text-indigo-400" /> : <Upload size={16} className="text-slate-400" />}
      <span className="text-sm font-medium text-slate-300">
        {busy ? 'Uploading...' : 'Upload Image'}
      </span>
    </label>
  );
}
