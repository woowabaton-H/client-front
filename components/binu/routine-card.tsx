import Image from "next/image";
import { CalendarCheck2, Check, ChevronRight, CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

type RoutineCardProps = {
  title: string;
  description?: string;
  cycleLabel: string;
  status: "due" | "soon" | "good" | "done";
  statusLabel: string;
  actionLabel?: string;
  secondaryLabel?: string;
  iconSrc?: string;
  busy?: boolean;
  onAction?: () => void;
  onSecondaryAction?: () => void;
  className?: string;
};

export function RoutineCard({
  title,
  description,
  cycleLabel,
  status,
  statusLabel,
  actionLabel = "루틴 확인하기",
  secondaryLabel,
  iconSrc,
  busy = false,
  onAction,
  onSecondaryAction,
  className,
}: RoutineCardProps) {
  return (
    <Card
      className={cn(
        "gap-3 border-binu-line bg-white shadow-[0_18px_50px_rgba(46,75,102,0.08)]",
        className,
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg bg-binu-sky-soft text-binu-navy ring-1 ring-binu-line">
            {iconSrc ? (
              <Image src={iconSrc} alt="" fill sizes="44px" className="object-cover" />
            ) : (
              <CalendarCheck2 className="size-5" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <CardTitle className="text-[17px] font-extrabold text-binu-ink">
              {title}
            </CardTitle>
          </div>
        </div>
        <CardAction className="flex flex-col items-end gap-1">
          <StatusBadge tone={status}>{statusLabel}</StatusBadge>
          <span className="text-[10px] font-extrabold text-binu-muted">{cycleLabel}</span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-3.5">
        {description ? (
          <p className="rounded-md bg-binu-sky-soft/55 px-3 py-2.5 text-[13px] font-semibold leading-6 text-binu-text">
            {description}
          </p>
        ) : null}
        <div className={cn("grid gap-2", secondaryLabel && "grid-cols-2")}>
          <Button variant="binu" className="w-full" size="lg" disabled={busy} onClick={onAction}>
            {onAction ? <Check className="size-4" aria-hidden="true" /> : <ChevronRight className="size-4" aria-hidden="true" />}
            {busy ? "기록 중" : actionLabel}
          </Button>
          {secondaryLabel ? (
            <Button variant="binu-soft" className="w-full" size="lg" onClick={onSecondaryAction}>
              <CircleHelp className="size-4" aria-hidden="true" />
              {secondaryLabel}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
