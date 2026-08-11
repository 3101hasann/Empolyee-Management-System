import { LocalFileStorage } from "./local";
import type { FileStorage } from "./types";

export type { FileStorage, StorageFolder, StoredFile } from "./types";

const DEFAULT_ROOT = "./storage/uploads";

let instance: FileStorage | undefined;

/** Single storage driver for the app; local disk unless configured otherwise. */
export function getFileStorage(): FileStorage {
  instance ??= new LocalFileStorage(process.env.STORAGE_ROOT ?? DEFAULT_ROOT);
  return instance;
}
