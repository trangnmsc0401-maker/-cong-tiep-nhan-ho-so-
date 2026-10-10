import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConversationButton } from "@/components/admin/delete-conversation-button";
import { ExtractLeadButton } from "@/components/admin/extract-lead-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getLead, type LeadQuality } from "@/lib/leads";
import { deleteConversationAndRedirectAction, extractLeadAction } from "../actions";

const leadQualityMeta: Record<LeadQuality, { label: string; variant: "default" | "secondary" | "destructive" }> = {
  good: { label: "Good", variant: "default" },
  ok: { label: "Ok", variant: "secondary" },
  spam: { label: "Spam", variant: "destructive" },
};

function leadField(label: string, value: string | null | undefined) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium">{value?.trim() ? value : "—"}</p>
    </div>
  );
}

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminConversationDetailPage(
  props: PageProps<"/admin/conversations/[id]">,
) {
  const { id } = await props.params;
  const supabase = getSupabaseAdmin();

  const { data: conversation, error: conversationError } = await supabase
    .from("chat_conversations")
    .select("id, channel, created_at")
    .eq("id", id)
    .maybeSingle();

  if (conversationError) {
    console.error("Admin conversation detail error:", conversationError);
  }
  if (!conversation) {
    notFound();
  }

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    console.error("Admin conversation messages error:", messagesError);
  }

  const lead = await getLead(id);

  return (
    <>
      <AdminPageHeader
        title={`Hội thoại #${(conversation.id as string).slice(0, 8)}`}
        description={`Kênh ${conversation.channel} · bắt đầu lúc ${formatDateTime(conversation.created_at as string)}`}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              nativeButton={false}
              render={
                <Link href="/admin/conversations">
                  <ArrowLeft />
                  Quay lại
                </Link>
              }
            />
            <DeleteConversationButton
              id={conversation.id as string}
              action={deleteConversationAndRedirectAction}
              label
            />
          </div>
        }
      />

      <Card className="mb-4 p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium">Thông tin lead</h2>
            {lead && (
              <Badge variant={leadQualityMeta[lead.quality].variant}>
                {leadQualityMeta[lead.quality].label}
              </Badge>
            )}
          </div>
          <ExtractLeadButton id={id} action={extractLeadAction} hasLead={!!lead} />
        </div>

        {lead ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {leadField("Họ tên", lead.fullName)}
              {leadField("Email", lead.email)}
              {leadField("Số điện thoại", lead.phone)}
              {leadField("Nước du học", lead.destinationCountry)}
              {leadField("Bậc học", lead.educationLevel)}
              {leadField("Ngành", lead.major)}
              {leadField("Availability", lead.availability)}
              {leadField(
                "Đặt lịch tư vấn",
                lead.wantsConsultation === null
                  ? null
                  : lead.wantsConsultation
                    ? "Có"
                    : "Không",
              )}
            </div>
            {lead.note && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground">Ghi chú</p>
                <p className="text-sm">{lead.note}</p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Trích xuất lúc {formatDateTime(lead.updatedAt)}
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Chưa trích xuất thông tin lead cho hội thoại này.
          </p>
        )}
      </Card>

      <Card className="p-4">
        <div className="flex flex-col gap-3">
          {(messages ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Chưa có tin nhắn nào trong hội thoại này.
            </p>
          ) : (
            (messages ?? []).map((m) => (
              <div
                key={m.id as number}
                className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-3.5 py-2 text-sm",
                    m.role === "user"
                      ? "rounded-br-sm bg-primary text-primary-foreground"
                      : "rounded-bl-sm bg-muted text-foreground",
                  )}
                >
                  <p className="whitespace-pre-wrap">{m.content as string}</p>
                  <p className="mt-1 text-[0.7rem] opacity-70">
                    {formatDateTime(m.created_at as string)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </>
  );
}
