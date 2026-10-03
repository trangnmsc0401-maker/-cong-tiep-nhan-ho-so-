import { GoogleGenAI } from "@google/genai";
import { chatbotSystemInstruction } from "@/lib/chatbot-faq";

export const dynamic = "force-dynamic";

interface ChatMessage {
  from: "bot" | "user";
  text: string;
}

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

  let body: { message?: string; history?: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Body không hợp lệ." }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return Response.json({ error: "Thiếu nội dung câu hỏi." }, { status: 400 });
  }

  const history = Array.isArray(body.history) ? body.history.slice(-MAX_HISTORY_MESSAGES) : [];

  const contents = [
    ...history.map((m) => ({
      role: m.from === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.text }],
    })),
    { role: "user" as const, parts: [{ text: message }] },
  ];

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

    return Response.json({ reply });
  } catch (error) {
    console.error("Gemini chat error:", error);
    return Response.json(
      { error: "Có lỗi khi gọi chatbot, bạn thử lại sau nhé." },
      { status: 502 },
    );
  }
}
