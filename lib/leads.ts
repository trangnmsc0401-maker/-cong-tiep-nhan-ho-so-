import "server-only";
import { GoogleGenAI, Type, type Schema } from "@google/genai";
import { getConversationMessages } from "@/lib/chat-store";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Dùng một model Gemini riêng, rẻ/nhanh hơn, chỉ cho tác vụ trích xuất dữ liệu có cấu trúc
// (khác với model đang trò chuyện với khách trong app/api/chat/route.ts).
const EXTRACTION_MODEL = "gemini-3.1-flash-lite";

export type LeadQuality = "good" | "ok" | "spam";

export interface ExtractedLead {
  fullName: string | null;
  email: string | null;
  phone: string | null;
  destinationCountry: string | null;
  educationLevel: string | null;
  major: string | null;
  availability: string | null;
  wantsConsultation: boolean | null;
  note: string | null;
  quality: LeadQuality;
}

export interface LeadRecord extends ExtractedLead {
  updatedAt: string;
}

const leadSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    fullName: { type: Type.STRING, nullable: true, description: "Họ tên khách nếu đã cung cấp, null nếu chưa có" },
    email: { type: Type.STRING, nullable: true, description: "Email khách nếu đã cung cấp" },
    phone: { type: Type.STRING, nullable: true, description: "Số điện thoại khách nếu đã cung cấp" },
    destinationCountry: { type: Type.STRING, nullable: true, description: "Quốc gia khách muốn du học" },
    educationLevel: { type: Type.STRING, nullable: true, description: "Bậc học khách quan tâm, ví dụ THPT, Đại học, Thạc sĩ" },
    major: { type: Type.STRING, nullable: true, description: "Ngành học khách quan tâm" },
    availability: { type: Type.STRING, nullable: true, description: "Thời gian khách rảnh để được tư vấn, nếu khách có nhắc tới" },
    wantsConsultation: { type: Type.BOOLEAN, nullable: true, description: "Khách có đồng ý đặt lịch tư vấn miễn phí hay không, null nếu chưa rõ" },
    note: { type: Type.STRING, nullable: true, description: "Tóm tắt ngắn gọn (1-2 câu) các thông tin, nhu cầu hoặc khó khăn đáng chú ý khác của khách" },
    quality: {
      type: Type.STRING,
      enum: ["good", "ok", "spam"],
      description:
        "Đánh giá chất lượng lead: good = nhu cầu du học rõ ràng kèm ít nhất email hoặc số điện thoại; ok = có tiềm năng nhưng thiếu thông tin liên hệ hoặc nhu cầu chưa rõ; spam = quấy rối, test, hoặc không liên quan đến du học",
    },
  },
  required: ["quality"],
};

// Đọc toàn bộ tin nhắn của một hội thoại, nhờ Gemini đọc và trích xuất thông tin lead theo schema cố định.
export async function extractLeadFromConversation(conversationId: string): Promise<ExtractedLead> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Thiếu GEMINI_API_KEY trên server.");
  }

  const messages = await getConversationMessages(conversationId);
  if (messages.length === 0) {
    throw new Error("Hội thoại chưa có tin nhắn nào để trích xuất.");
  }

  const transcript = messages
    .map((m) => `${m.from === "user" ? "Khách" : "Trợ lý"}: ${m.text}`)
    .join("\n");

  const ai = new GoogleGenAI({ apiKey });
  const response = await ai.models.generateContent({
    model: EXTRACTION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Đọc đoạn hội thoại tư vấn du học dưới đây giữa "Khách" và "Trợ lý", rồi trích xuất thông tin lead theo đúng schema JSON được yêu cầu. Nếu một trường không được khách đề cập, để giá trị null (riêng "quality" luôn phải có giá trị).\n\n--- HỘI THOẠI ---\n${transcript}`,
          },
        ],
      },
    ],
    config: {
      responseMimeType: "application/json",
      responseSchema: leadSchema,
    },
  });

  const text = response.text?.trim();
  if (!text) {
    throw new Error("Gemini không trả về kết quả trích xuất.");
  }

  return JSON.parse(text) as ExtractedLead;
}

// Lưu/ghi đè kết quả trích xuất lead của một hội thoại (mỗi hội thoại chỉ có 1 lead).
export async function upsertLead(conversationId: string, lead: ExtractedLead): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("chat_leads").upsert(
    {
      conversation_id: conversationId,
      full_name: lead.fullName,
      email: lead.email,
      phone: lead.phone,
      destination_country: lead.destinationCountry,
      education_level: lead.educationLevel,
      major: lead.major,
      availability: lead.availability,
      wants_consultation: lead.wantsConsultation,
      note: lead.note,
      quality: lead.quality,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "conversation_id" },
  );
  if (error) throw error;
}

export async function getLead(conversationId: string): Promise<LeadRecord | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_leads")
    .select(
      "full_name, email, phone, destination_country, education_level, major, availability, wants_consultation, note, quality, updated_at",
    )
    .eq("conversation_id", conversationId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    fullName: data.full_name,
    email: data.email,
    phone: data.phone,
    destinationCountry: data.destination_country,
    educationLevel: data.education_level,
    major: data.major,
    availability: data.availability,
    wantsConsultation: data.wants_consultation,
    note: data.note,
    quality: data.quality as LeadQuality,
    updatedAt: data.updated_at as string,
  };
}
