/**
 * Server-side upload validation. Content type is determined from the file's
 * magic bytes — never from the client-supplied extension or Content-Type.
 */

export interface DetectedFileType {
  contentType: "image/jpeg" | "image/png" | "image/webp" | "application/pdf";
  extension: "jpg" | "png" | "webp" | "pdf";
}

export const UPLOAD_LIMITS = {
  profileImage: { maxBytes: 2 * 1024 * 1024, kinds: ["image"] },
  cv: { maxBytes: 5 * 1024 * 1024, kinds: ["image", "pdf"] },
  certificate: { maxBytes: 5 * 1024 * 1024, kinds: ["image", "pdf"] },
} as const satisfies Record<string, { maxBytes: number; kinds: readonly UploadKind[] }>;

export type UploadKind = "image" | "pdf";

function startsWith(data: Uint8Array, bytes: number[], offset = 0): boolean {
  if (data.length < offset + bytes.length) return false;
  return bytes.every((b, i) => data[offset + i] === b);
}

/** Detects the real file type from magic bytes; null when unrecognized. */
export function detectFileType(data: Uint8Array): DetectedFileType | null {
  if (startsWith(data, [0xff, 0xd8, 0xff])) {
    return { contentType: "image/jpeg", extension: "jpg" };
  }
  if (startsWith(data, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return { contentType: "image/png", extension: "png" };
  }
  if (
    startsWith(data, [0x52, 0x49, 0x46, 0x46]) &&
    startsWith(data, [0x57, 0x45, 0x42, 0x50], 8)
  ) {
    return { contentType: "image/webp", extension: "webp" };
  }
  if (startsWith(data, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return { contentType: "application/pdf", extension: "pdf" };
  }
  return null;
}

export function kindOf(type: DetectedFileType): UploadKind {
  return type.contentType === "application/pdf" ? "pdf" : "image";
}

export type UploadValidationError = "too-large" | "unsupported-type";

export function validateUpload(
  data: Uint8Array,
  limit: { maxBytes: number; kinds: readonly UploadKind[] },
): { ok: true; type: DetectedFileType } | { ok: false; error: UploadValidationError } {
  if (data.byteLength > limit.maxBytes) {
    return { ok: false, error: "too-large" };
  }
  const type = detectFileType(data);
  if (!type || !limit.kinds.includes(kindOf(type))) {
    return { ok: false, error: "unsupported-type" };
  }
  return { ok: true, type };
}
