import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import type { FileStorage, StorageFolder, StoredFile } from "./types";

/**
 * Development driver: files on local disk under STORAGE_ROOT.
 * Production on Vercel swaps this for an object-storage driver (same interface).
 */
export class LocalFileStorage implements FileStorage {
  private readonly root: string;

  constructor(root: string) {
    this.root = path.resolve(root);
  }

  /** Resolves a stored key to an absolute path, rejecting path traversal. */
  private resolve(key: string): string | null {
    const absolute = path.resolve(this.root, key);
    if (!absolute.startsWith(this.root + path.sep)) return null;
    return absolute;
  }

  async save(params: {
    folder: StorageFolder;
    data: Uint8Array;
    contentType: string;
    extension: string;
  }): Promise<StoredFile> {
    const key = `${params.folder}/${randomUUID()}.${params.extension}`;
    const absolute = this.resolve(key);
    if (!absolute) throw new Error("Invalid storage key generated");
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, params.data);
    return { key, contentType: params.contentType, sizeBytes: params.data.byteLength };
  }

  async read(key: string): Promise<Uint8Array | null> {
    const absolute = this.resolve(key);
    if (!absolute) return null;
    try {
      return await readFile(absolute);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") return null;
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    const absolute = this.resolve(key);
    if (!absolute) return;
    await rm(absolute, { force: true });
  }
}
