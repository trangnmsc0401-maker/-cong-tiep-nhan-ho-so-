import { getConversationMessages, peekConversationId } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const conversationId = await peekConversationId();
    if (!conversationId) {
      return Response.json({ messages: [] });
    }

    const messages = await getConversationMessages(conversationId);
    return Response.json({ messages });
  } catch (error) {
    console.error("Chat history error:", error);
    return Response.json(
      { error: "Không tải được lịch sử hội thoại." },
      { status: 502 },
    );
  }
}
