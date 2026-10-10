import "server-only";
import { cookies } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

// Lưu & đọc hội thoại chatbot trong bảng chat_conversations / chat_messages trên Supabase.
// Hai bảng này bật RLS và không có policy nào, nên chỉ truy cập được qua secret key ở đây
// (server) — trình duyệt không bao giờ chạm trực tiếp vào dữ liệu hội thoại.

const COOKIE_NAME = "chat_conversation_id";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 180; // 180 ngày

export interface StoredChatMessage {
  from: "bot" | "user";
  text: string;
}

// Đọc id hội thoại hiện tại từ cookie, không tạo mới nếu chưa có.
export async function peekConversationId(): Promise<string | null> {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

// Lấy id hội thoại từ cookie, hoặc tạo hội thoại mới trên Supabase nếu khách chưa có.
// Cũng tạo mới nếu hội thoại cũ đã bị admin xoá, để khách không bị kẹt khi gửi tiếp tin nhắn.
export async function getOrCreateConversationId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  const supabase = getSupabaseAdmin();

  if (existing) {
    const { data: found } = await supabase
      .from("chat_conversations")
      .select("id")
      .eq("id", existing)
      .maybeSingle();
    if (found) return existing;
  }

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({ channel: "web" })
    .select("id")
    .single();

  if (error || !data) {
    throw error ?? new Error("Không tạo được hội thoại mới.");
  }

  store.set(COOKIE_NAME, data.id as string, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });

  return data.id as string;
}

export async function getConversationMessages(conversationId: string): Promise<StoredChatMessage[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    from: row.role as "bot" | "user",
    text: row.content as string,
  }));
}

export async function appendMessage(
  conversationId: string,
  role: "bot" | "user",
  text: string,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { error: insertError } = await supabase
    .from("chat_messages")
    .insert({ conversation_id: conversationId, role, content: text });
  if (insertError) throw insertError;

  const { error: updateError } = await supabase
    .from("chat_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
  if (updateError) throw updateError;
}

// Xoá hội thoại (tin nhắn bên trong bị xoá theo nhờ "on delete cascade" trên chat_messages).
export async function deleteConversation(conversationId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId);
  if (error) throw error;
}
