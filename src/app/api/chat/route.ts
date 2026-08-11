import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/guards";
import { generateChatbotResponse } from "@/lib/ai/gemini";
import { db } from "@/lib/db";
import { applicationKnowledge } from "@/lib/chatbot/application-knowledge";
import { getGeneralStats, listBatches } from "@/lib/chatbot/chatbot-service";

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages, conversationId } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const lastMessage = messages[messages.length - 1].content.toLowerCase();
    
    let dbContext = "";
    try {
      const stats = await getGeneralStats();
      const activeBatches = await listBatches({ status: 'ACTIVE', limit: 5 });
      
      let extraData = "";
      // Simple keyword heuristics for dynamic data
      if (lastMessage.includes("faisalabad")) {
        const fsdCount = await db.internee.count({
          where: { person: { city: { name: { contains: "Faisalabad" } } }, deletedAt: null }
        });
        extraData += `\nInternees from Faisalabad: ${fsdCount}`;
      }
      if (lastMessage.includes("batch")) {
        extraData += `\nActive Batches: ${activeBatches.map(b => b.name).join(", ")}`;
      }
      if (lastMessage.includes("completed")) {
         // Completed internees: tenures in CLOSED batches
         const completedCount = await db.internee.count({
           where: { tenures: { some: { batch: { status: 'CLOSED' } } }, deletedAt: null }
         });
         extraData += `\nInternees with completed internship (CLOSED batch): ${completedCount}`;
      }

      dbContext = `
System Stats: Total Internees=${stats.totalInternees}, Total Batches=${stats.totalBatches}, Active Batches=${stats.activeBatches}
${extraData}

Application Knowledge:
${applicationKnowledge}
      `;
    } catch (e) {
      console.error("Context fetch error:", e);
    }

    // Call Gemini
    const answerResult = await generateChatbotResponse(messages, dbContext);
    const answer = answerResult || "Sorry, I could not generate an answer.";

    // Save to database
    let convId = conversationId;
    
    // Convert string ID to number if needed
    if (typeof convId === 'string') {
      convId = parseInt(convId, 10);
    }

    if (!convId) {
      const newConv = await db.chatConversation.create({
        data: {
          userId: Number(user.id),
          title: messages[0].content.substring(0, 50),
        }
      });
      convId = newConv.id;
    }

    // Save user message
    await db.chatMessage.create({
      data: {
        conversationId: convId,
        userId: Number(user.id),
        role: "user",
        content: messages[messages.length - 1].content
      }
    });

    // Save assistant message
    const assistantMessage = await db.chatMessage.create({
      data: {
        conversationId: convId,
        userId: Number(user.id),
        role: "assistant",
        content: answer
      }
    });

    return NextResponse.json({
      answer,
      conversationId: convId,
      messageId: assistantMessage.id
    });

  } catch (error: any) {
    console.error("Chat API Error:", error);
    return NextResponse.json(
      { error: "Sorry, I could not retrieve that information right now. Please try again." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (conversationId) {
      const messages = await db.chatMessage.findMany({
        where: { conversationId: parseInt(conversationId), userId: Number(user.id) },
        orderBy: { createdAt: 'asc' }
      });
      return NextResponse.json({ messages });
    }

    const conversations = await db.chatConversation.findMany({
      where: { userId: Number(user.id) },
      orderBy: { updatedAt: 'desc' },
      take: 20
    });
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Chat GET Error:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get('conversationId');

    if (!conversationId) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await db.chatConversation.deleteMany({
      where: { id: parseInt(conversationId), userId: Number(user.id) }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
