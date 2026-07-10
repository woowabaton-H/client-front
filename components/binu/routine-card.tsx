import { CalendarCheck2, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

type RoutineCardProps = {
  title: string;
  description: string;
  schedule: string;
  progress: number;
  status: "due" | "soon" | "good" | "done";
  statusLabel: string;
  actionLabel?: string;
  className?: string;
};

export function RoutineCard({
  title,
  description,
  schedule,
  progress,
  status,
  statusLabel,
  actionLabel = "루틴 확인하기",
  className,
}: RoutineCardProps) {
  return (
    <Card
      className={cn(
        "border-binu-line bg-white shadow-[0_18px_50px_rgba(46,75,102,0.08)]",
        className,
      )}
    >
      <CardHeader className="gap-3">
        <div className="flex items-start gap-3">
          <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-binu-sky-soft text-binu-navy">
            <CalendarCheck2 className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-[17px] font-extrabold text-binu-ink">
              {title}
            </CardTitle>
            <p className="mt-1 text-sm leading-6 text-binu-text">
              {description}
            </p>
          </div>
        </div>
        <CardAction>
          <StatusBadge tone={status}>{statusLabel}</StatusBadge>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-binu-muted">
            <span>{schedule}</span>
            <span>{progress}%</span>
          </div>
          <Progress
            value={progress}
            className="h-2 bg-binu-sky-soft [&_[data-slot=progress-indicator]]:bg-binu-sky"
          />
        </div>
        <Button variant="binu" className="w-full justify-between" size="lg">
          {actionLabel}
          <ChevronRight className="size-4" />
        </Button>
      </CardContent>
    </Card>
  );
}
