import type { CompleteUploadRequest, ImageDto, PresignRequest, PresignResponse } from '@/lib/shared';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function isAbortError(error: unknown): boolean {
  return (
    (error instanceof DOMException && error.name === 'AbortError') ||
    (error instanceof Error && error.name === 'AbortError')
  );
}

type TokenFn = () => Promise<string | null>;

async function request<T>(
  path: string,
  getToken: TokenFn,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const json: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const error = json as { error?: { code?: string; message?: string } } | null;
    throw new ApiError(
      response.status,
      error?.error?.code ?? 'UNKNOWN',
      error?.error?.message ?? 'Request failed',
    );
  }
  return json as T;
}

export function createApi(getToken: TokenFn, signal?: AbortSignal) {
  return {
    listImages: () =>
      request<{ data: ImageDto[] }>('/api/v1/images', getToken, { signal }),
    getImage: (id: string) =>
      request<ImageDto>(`/api/v1/images/${id}`, getToken, { signal }),
    deleteImage: (id: string) =>
      request<void>(`/api/v1/images/${id}`, getToken, { method: 'DELETE', signal }),
    presign: (body: PresignRequest) =>
      request<PresignResponse>('/api/v1/uploads/presign', getToken, {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }),
    complete: (body: CompleteUploadRequest) =>
      request<ImageDto>('/api/v1/uploads/complete', getToken, {
        method: 'POST',
        body: JSON.stringify(body),
        signal,
      }),
  };
}

export async function putToPresignedUrl(
  url: string,
  file: File,
  contentType: string,
  token?: string | null,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch(url, {
    method: 'PUT',
    body: file,
    signal,
    headers: {
      'Content-Type': contentType,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!response.ok) {
    throw new Error('Failed to upload file to storage');
  }
}
