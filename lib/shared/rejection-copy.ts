import type { RejectionReason } from './enums';

export const REJECTION_COPY: Record<RejectionReason, string> = {
  BLURRY: 'Blurry face',
  FACE_TOO_SMALL: 'Face is too far from the camera',
  TOO_SIMILAR: 'You have already uploaded a similar photo',
  MULTIPLE_FACES: 'Multiple faces in the photo',
  NO_FACE: 'No face detected',
  INVALID_FORMAT: "This file type isn't supported",
  FILE_TOO_SMALL: 'Photo is too small',
  RESOLUTION_TOO_LOW: 'Photo is too small',
};

export function rejectionMessage(reason: RejectionReason): string {
  return REJECTION_COPY[reason];
}
