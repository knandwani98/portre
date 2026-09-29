export const MAX_ACCEPTED_PHOTOS = 10;
export const MIN_FILE_SIZE_BYTES = 50 * 1024;
export const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
export const MIN_IMAGE_DIMENSION = 640;
export const BLUR_VARIANCE_THRESHOLD = 100;
export const MIN_FACE_RATIO = 0.15;
export const PHASH_HAMMING_THRESHOLD = 8;
export const JOB_STALE_LOCK_MS = 2 * 60 * 1000;
export const JOB_MAX_ATTEMPTS = 2;
export const JOB_POLL_INTERVAL_MS = 1500;
export const SIGNED_URL_EXPIRES_SECONDS = 60 * 10;
export const PRESIGN_EXPIRES_SECONDS = 60 * 5;

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/heif',
] as const;

export const ALLOWED_EXTENSIONS = [
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.heif',
] as const;

export type AllowedMimeType = (typeof ALLOWED_MIME_TYPES)[number];
