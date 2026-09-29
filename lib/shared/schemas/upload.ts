import { z } from 'zod';
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
} from '../constants';

export const clientFileSchema = z.object({
  name: z.string().min(1),
  type: z.string(),
  size: z.number().int().positive().max(MAX_FILE_SIZE_BYTES, {
    message: 'File is too large',
  }),
});

export function isAllowedMimeType(type: string): boolean {
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(type);
}

export function isAllowedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function isAllowedUploadFile(file: { name: string; type: string }): boolean {
  if (isAllowedMimeType(file.type)) {
    return true;
  }
  return isAllowedExtension(file.name);
}
