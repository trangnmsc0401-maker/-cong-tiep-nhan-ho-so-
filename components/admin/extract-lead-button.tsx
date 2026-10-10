"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ExtractLeadButton({
  id,
  action,
  hasLead,
}: {
  id: string;
  action: (id: string) => Promise<void>;
  hasLead: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => action(id))}
    >
      <Sparkles className="size-3.5" />
      {isPending ? "Đang trích xuất..." : hasLead ? "Trích xuất lại" : "Trích xuất thông tin lead"}
    </Button>
  );
}
