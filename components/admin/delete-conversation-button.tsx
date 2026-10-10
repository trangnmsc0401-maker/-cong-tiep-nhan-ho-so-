"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteConversationButton({
  id,
  action,
  label = false,
}: {
  id: string;
  action: (id: string) => Promise<void>;
  label?: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (!confirm("Xoá hội thoại này? Toàn bộ tin nhắn bên trong sẽ bị xoá vĩnh viễn.")) return;
    startTransition(() => {
      action(id);
    });
  }

  return (
    <Button
      variant="outline"
      size={label ? "sm" : "icon-sm"}
      aria-label="Xoá hội thoại"
      disabled={isPending}
      onClick={handleClick}
      className="text-destructive hover:bg-destructive/10"
    >
      <Trash2 className="size-3.5" />
      {label && (isPending ? "Đang xoá..." : "Xoá hội thoại")}
    </Button>
  );
}
