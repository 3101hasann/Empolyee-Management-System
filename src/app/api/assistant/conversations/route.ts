import { getSessionUser } from "@/lib/auth/guards";
import { roleHasPermission } from "@/lib/auth/permissions";
import { db } from "@/lib/db";

/** Conversation list for the history dropdown (newest first). */
export async function GET() {
  const user = await getSessionUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!roleHasPermission(user.role, "assistant:use")) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const conversations = await db.conversation.findMany({
    where: { userId: Number(user.id), deletedAt: null },
    orderBy: { updatedAt: "desc" },
    take: 30,
    select: {
      id: true,
      title: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return Response.json({
    conversations: conversations.map((c) => ({
      id: c.id,
      title: c.title,
      updatedAt: c.updatedAt,
      messageCount: c._count.messages,
    })),
  });
}
