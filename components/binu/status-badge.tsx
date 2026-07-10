import type * as React from "react";
import {
  CheckCircle2,
  Clock3,
  Heart,
  Sparkles,
  TimerReset,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type StatusTone = "due" | "soon" | "good" | "done" | "service" | "note";

const statusStyles: Record<StatusTone, string> = {
  due: "border-[#F1C8C8] bg-[#FFF4F2] text-[#B45B4E]",
  soon: "border-binu-sky/40 bg-binu-sky-soft text-binu-navy",
  good: "border-[#CDE7D7] bg-[#F0FAF3] text-[#2D7B50]",
  done: "border-binu-mist bg-white text-binu-navy",
  service: "border-binu-sky bg-white text-binu-navy",
  note: "border-[#F6DDC5] bg-binu-cream text-binu-navy",
};

const statusIcons: Record<
  StatusTone,
  React.ComponentType<{ className?: string }>
> = {
  due: TimerReset,
  soon: Clock3,
  good: CheckCircle2,
  done: CheckCircle2,
  service: Sparkles,
  note: Heart,
};

type StatusBadgeProps = {
  tone: StatusTone;
  children: React.ReactNode;
  className?: string;
};

export function StatusBadge({ tone, children, className }: StatusBadgeProps) {
  const Icon = statusIcons[tone];

  return (
    <Badge
      variant="outline"
      className={cn(
        "h-6 gap-1 rounded-full px-2.5 text-[11px] font-bold",
        statusStyles[tone],
        className,
      )}
    >
      <Icon className="size-3.5" />
      {children}
    </Badge>
  );
}
