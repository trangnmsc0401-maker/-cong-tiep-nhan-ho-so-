import { GoogleGenAI } from "@google/genai";
import { chatbotSystemInstruction } from "@/lib/chatbot-faq";
import { appendMessage, getConversationMessages, getOrCreateConversationId } from "@/lib/chat-store";

export const dynamic = "force-dynamic";

const MODEL = "gemini-3.5-flash-lite";
const MAX_HISTORY_MESSAGES = 20;

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "Thiếu GEMINI_API_KEY trên server." },
      { status: 500 },
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
  }

  let conversationId: string;
  let history: Awaited<ReturnType<typeof getConversationMessages>>;
  try {
    conversationId = await getOrCreateConversationId();
    await appendMessage(conversationId, "user", message);
    history = await getConversationMessages(conversationId);
  } catch (error) {
    console.error("Chat store error:", error);
    return Response.json(
      { error: "Không lưu được hội thoại, bạn thử lại sau nhé." },
      { status: 502 },
    );
  }

  const contents = history.slice(-MAX_HISTORY_MESSAGES).map((m) => ({
    role: m.from === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.text }],
  }));

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: MODEL,
      contents,
      config: {
        systemInstruction: chatbotSystemInstruction,
      },
    });

    const reply = response.text?.trim();
    if (!reply) {
      return Response.json(
        { error: "Chatbot chưa có câu trả lời, bạn thử lại nhé." },
        { status: 502 },
      );
    }

    await appendMessage(conversationId, "bot", reply);

    return Response.json({ reply });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return Response.json(
      { error: "Có lỗi khi gọi chatbot, bạn thử lại sau nhé." },
      { status: 502 },
    );
  }
}
