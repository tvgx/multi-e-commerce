import { apiClient } from './api-client';

export async function uploadFileToMinIO(
  file: File,
  type: string,
  shopId?: string,
  entityId?: string
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  if (type) formData.append('entityType', type);
  if (entityId) formData.append('entityId', entityId);

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
