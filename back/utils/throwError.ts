const statusByCode: Record<string, number> = {
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_FAILED: 400,
  PUBLISHED_IMMUTABLE: 409,
  QUOTA_EXCEEDED: 429,
  DUPLICATE_OPERATION: 409,
  AI_UNAVAILABLE: 503,
  MEDIA_UPLOAD_FAILED: 400,
};

export class AppError extends Error {
  code: string;
  status: number;
  retryable: boolean;

  constructor(raw: string) {
    const separator = raw.indexOf(":");
    const code = separator > 0 ? raw.slice(0, separator).trim() : "INTERNAL";
    const message = separator > 0 ? raw.slice(separator + 1).trim() : raw;

    super(separator > 0 ? `${code}: ${message}` : raw);
    this.name = "AppError";
    this.code = code;
    this.status = statusByCode[code] ?? 500;
    this.retryable = code === "AI_UNAVAILABLE" || code === "QUOTA_EXCEEDED";
  }
}

export const throwError = (msg?: string): never => {
  throw new AppError(msg || "INTERNAL: Unknown error");
};

export const isAppError = (error: unknown): error is AppError =>
  error instanceof AppError;
