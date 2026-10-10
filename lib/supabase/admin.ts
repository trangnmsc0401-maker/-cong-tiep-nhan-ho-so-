import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Client admin dùng SUPABASE_SECRET_KEY — bỏ qua RLS, chỉ được import từ code chạy trên server
// (route handler, server component). Gói "server-only" sẽ làm build lỗi nếu lỡ import vào client component.

let cached: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secretKey) {
    throw new Error("Thiếu SUPABASE_URL hoặc SUPABASE_SECRET_KEY trên server.");
  }

  cached = createClient(url, secretKey, {
    auth: { persistSession: false },
  });
  return cached;
}
