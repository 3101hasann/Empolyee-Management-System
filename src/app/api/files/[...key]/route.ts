import { NextResponse, type NextRequest } from "next/server";

import { getSessionUser } from "@/lib/auth/guards";
import { getFileStorage } from "@/lib/storage";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  pdf: "application/pdf",
};

/** Serves stored uploads to authenticated users only — never from /public. */
export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ key: string[] }> },
): Promise<NextResponse> {
  const user = await getSessionUser();
  if (!user) return new NextResponse(null, { status: 401 });

  const { key: parts } = await context.params;
  const key = parts.join("/");

  const extension = key.split(".").pop() ?? "";
  const contentType = CONTENT_TYPES[extension];
  if (!contentType) return new NextResponse(null, { status: 404 });

  const data = await getFileStorage().read(key);
  if (!data) return new NextResponse(null, { status: 404 });

  return new NextResponse(Buffer.from(data), {
    headers: {
      "Content-Type": contentType,
      "Content-Length": String(data.byteLength),
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
