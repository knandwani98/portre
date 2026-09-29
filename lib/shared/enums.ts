export const IMAGE_STATUSES = [
  'PENDING',
  'PROCESSING',
  'ACCEPTED',
  'REJECTED',
] as const;

export type ImageStatus = (typeof IMAGE_STATUSES)[number];

export const REJECTION_REASONS = [
  'INVALID_FORMAT',
  'FILE_TOO_SMALL',
  'RESOLUTION_TOO_LOW',
  'TOO_SIMILAR',
  'BLURRY',
  'NO_FACE',
  'FACE_TOO_SMALL',
  'MULTIPLE_FACES',
] as const;

export type RejectionReason = (typeof REJECTION_REASONS)[number];

export const JOB_STATUSES = [
  'QUEUED',
  'RUNNING',
  'SUCCEEDED',
  'FAILED',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];
