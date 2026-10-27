import { localAdapter } from "./local.ts";
import { s3Adapter } from "./s3.ts";
import type { StorageAdapter } from "./types.ts";

export type { StorageAdapter } from "./types.ts";
export { localAdapter, s3Adapter };

export const getStorage = (): StorageAdapter => {
  const driver = (Deno.env.get("STORAGE_DRIVER") || "local").toLowerCase();
  return driver === "s3" ? s3Adapter : localAdapter;
};
