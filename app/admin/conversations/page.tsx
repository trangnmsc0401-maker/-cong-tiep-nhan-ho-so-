import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/page-header";
import { DeleteConversationButton } from "@/components/admin/delete-conversation-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { deleteConversationAction } from "./actions";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminConversationsPage() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id, channel, created_at, chat_messages(count)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Admin conversations error:", error);
  }

  const conversations = (data ?? []).map((row) => ({
    id: row.id as string,
    channel: row.channel as string,
    messageCount:
      (row.chat_messages as { count: number }[] | null)?.[0]?.count ?? 0,
    startedAt: formatDateTime(row.created_at as string),
  }));

  return (
    <>
      <AdminPageHeader
        title="Hội thoại"
        description="Lịch sử hội thoại của khách với chatbot hỏi đáp trên trang chủ."
      />

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Kênh</TableHead>
              <TableHead>Số tin nhắn</TableHead>
              <TableHead>Thời gian bắt đầu</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conversations.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  Chưa có hội thoại nào.
                </TableCell>
              </TableRow>
            ) : (
              conversations.map((conv) => (
                <TableRow key={conv.id}>
                  <TableCell className="font-medium">{conv.channel}</TableCell>
                  <TableCell>{conv.messageCount} tin nhắn</TableCell>
                  <TableCell className="text-muted-foreground">{conv.startedAt}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        nativeButton={false}
                        render={<Link href={`/admin/conversations/${conv.id}`}>Xem chi tiết</Link>}
                      />
                      <DeleteConversationButton id={conv.id} action={deleteConversationAction} />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
