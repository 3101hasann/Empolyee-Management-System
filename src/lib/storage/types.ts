/** Logical buckets uploads are grouped under. */
export type StorageFolder = "profile-images" | "cvs" | "certificates";

export interface StoredFile {
  /** Relative key persisted in the DB (e.g. "cvs/3f9d…a2.pdf"). */
  key: string;
  contentType: string;
  sizeBytes: number;
}

export interface FileStorage {
  /** Persists the file and returns its storage key. */
  save(params: {
    folder: StorageFolder;
    data: Uint8Array;
    contentType: string;
    extension: string;
  }): Promise<StoredFile>;

  /** Returns file contents, or null if the key does not exist. */
  read(key: string): Promise<Uint8Array | null>;

  /** Removes a file; succeeds silently if already gone. */
  delete(key: string): Promise<void>;
}
