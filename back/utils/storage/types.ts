import type { Document } from "lesan";

export type UploadTarget = {
  uploadUrl: string;
  method: "PUT" | "POST";
  headers?: Record<string, string>;
  expiresIn: number;
};

export type DownloadTarget = {
  url: string;
  expiresIn: number;
};

export type StorageAdapter = {
  driver: "local" | "s3";
  requestUpload(file: Document, ttlSeconds: number): Promise<UploadTarget>;
  requestDownload(file: Document, ttlSeconds: number): Promise<DownloadTarget>;
  put(file: Document, data: Uint8Array, contentType: string): Promise<void>;
  get(file: Document): Promise<Uint8Array>;
  head(file: Document): Promise<{ size: number; contentType?: string }>;
  remove(file: Document): Promise<void>;
};
