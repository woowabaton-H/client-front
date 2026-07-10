import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description: string;
  actionLabel?: string | null;
  onAction?: () => void;
  className?: string;
};

export function EmptyState({
  title,
  description,
  actionLabel = "도움 되는 글 둘러보기",
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-binu-mist bg-white/75 p-6 text-center",
        className,
      )}
    >
      <div className="mx-auto grid size-12 place-items-center rounded-full bg-binu-sky-soft text-binu-navy">
        <Heart className="size-5" />
      </div>
      <h3 className="mt-4 text-base font-extrabold text-binu-ink">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-binu-text">
        {description}
      </p>
      {actionLabel ? (
        <Button variant="quiet" className="mt-4" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
