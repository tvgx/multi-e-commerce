import { apiClient } from './api-client';

export async function uploadFileToMinIO(
  file: File,
  type: string,
  shopId?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('entityType', type);

  const res = await apiClient.post<{ url: string }>(
    '/api/media/upload',
    formData,
    { shopId } as any
  );

  if (!res.data?.url) {
    throw new Error('Upload thất bại');
  }

  return res.data.url;
}
