import { z } from 'zod';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../constants';
import { IMAGE_STATUSES, REJECTION_REASONS } from '../enums';

export const presignRequestSchema = z.object({
  originalName: z.string().min(1).max(255),
  mimeType: z.enum(ALLOWED_MIME_TYPES),
  sizeBytes: z.number().int().positive().max(MAX_FILE_SIZE_BYTES),
  batchId: z.string().min(1).max(64),
});

export const completeUploadSchema = z.object({
  imageId: z.string().min(1),
});

export const listImagesQuerySchema = z.object({
  status: z.enum(IMAGE_STATUSES).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});

export const imageIdParamSchema = z.object({
  id: z.string().min(1),
});

export const imageDtoSchema = z.object({
  id: z.string(),
  status: z.enum(IMAGE_STATUSES),
  originalName: z.string(),
  mimeType: z.string(),
  sizeBytes: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
  previewUrl: z.string().nullable(),
  rejectionReasons: z.array(z.enum(REJECTION_REASONS)),
  rejectionMessage: z.string().nullable(),
  createdAt: z.string(),
  processedAt: z.string().nullable(),
  batchId: z.string().nullable(),
});

export const quotaDtoSchema = z.object({
  accepted: z.number().int(),
  processing: z.number().int(),
  remaining: z.number().int(),
});

export const presignResponseSchema = z.object({
  imageId: z.string(),
  uploadUrl: z.string(),
  storageKey: z.string(),
});

export type PresignRequest = z.infer<typeof presignRequestSchema>;
export type CompleteUploadRequest = z.infer<typeof completeUploadSchema>;
export type ImageDto = z.infer<typeof imageDtoSchema>;
export type QuotaDto = z.infer<typeof quotaDtoSchema>;
export type PresignResponse = z.infer<typeof presignResponseSchema>;
