// Trạng thái build trả về cho UI poll (drive thanh 0→100% + URL khi xong).
export interface BuildStatusDto {
  shopId: string;
  jobId: string | null;
  status: string; // QUEUED | RUNNING | COMPLETED | FAILED
  percent: number; // 0..100
  stage: string | null; // extract|parse|assemble|compile|db-save|minio|published
  storefrontUrl: string | null;
  error: string | null;
  updatedAt: string | null;
}

export interface EnqueueBuildResultDto {
  jobId: string;
  status: string;
}
