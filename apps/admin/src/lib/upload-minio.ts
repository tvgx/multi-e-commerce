import { apiClient } from './api-client';

export async function uploadFileToMinIO(
  file: File,
  type: string,
  shopId?: string
): Promise<string> {
  // 1. Xin cấp phép (Presign)
  const presignRes = await apiClient.post<any>(
    '/api/storage/presigned-url',
    {
      fileName: file.name,
      contentType: file.type,
      size: file.size,
    },
    { shopId }
  );

  const { uploadUrl, key, fileUrl } = presignRes.data;

  if (!uploadUrl || !key) {
    throw new Error('Không thể lấy Presigned URL');
  }

  // 2. Upload trực tiếp (Direct Put)
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  });

  if (!uploadRes.ok) {
    throw new Error('Upload trực tiếp lên MinIO thất bại');
  }

  // 3. Xác nhận (Confirm)
  const confirmRes = await apiClient.post<any>(
    '/api/storage/confirm-upload',
    {
      key,
      size: file.size,
      bucket: 'shop-public', // Default bucket for public uploads
      mimeType: file.type,
    },
    { shopId }
  );

  if (!confirmRes.data || !confirmRes.data.url) {
    throw new Error('Xác nhận upload thất bại');
  }

  return confirmRes.data.url;
}
