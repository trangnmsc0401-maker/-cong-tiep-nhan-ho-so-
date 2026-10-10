"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { deleteConversation } from "@/lib/chat-store";
import { extractLeadFromConversation, upsertLead } from "@/lib/leads";

export async function deleteConversationAction(id: string) {
  await deleteConversation(id);
  revalidatePath("/admin/conversations");
}

export async function deleteConversationAndRedirectAction(id: string) {
  await deleteConversation(id);
  revalidatePath("/admin/conversations");
  redirect("/admin/conversations");
}

export async function extractLeadAction(conversationId: string) {
  const lead = await extractLeadFromConversation(conversationId);
  await upsertLead(conversationId, lead);
  revalidatePath(`/admin/conversations/${conversationId}`);
}
