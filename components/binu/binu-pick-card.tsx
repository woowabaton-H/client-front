import Image from "next/image";
import { Bookmark, BookmarkCheck, ChevronRight, Star } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { StatusBadge } from "./status-badge";

type BinuPickCardProps = {
  title: string;
  description: string;
  price: string;
  rating: string;
  source: string;
  imageSrc?: string;
  tags: string[];
  saved?: boolean;
  saveLabel?: string;
  openLabel?: string;
  onSave?: () => void;
  onOpen?: () => void;
  className?: string;
};

export function BinuPickCard({
  title,
  description,
  price,
  rating,
  source,
  imageSrc,
  tags,
  saved = false,
  saveLabel = "비누 노트에 저장",
  openLabel,
  onSave,
  onOpen,
  className,
}: BinuPickCardProps) {
  return (
    <Card
      className={cn(
        "border-binu-line bg-white shadow-[0_16px_42px_rgba(46,75,102,0.07)]",
        className,
      )}
    >
      <CardHeader className="grid grid-cols-[96px_1fr] gap-4">
        <div className="relative h-28 overflow-hidden rounded-lg bg-binu-cream">
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_35%_25%,#ffffff_0,#ffffff_28%,#A7D4F3_70%)]" />
          )}
        </div>
        <div className="min-w-0">
          <StatusBadge tone="note">{source}</StatusBadge>
          <CardTitle className="mt-2 text-[16px] font-extrabold leading-snug text-binu-ink">
            {title}
          </CardTitle>
          <p className="mt-1 text-sm leading-6 text-binu-text">{description}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg bg-binu-sky-soft px-3 py-2">
          <strong className="text-sm text-binu-navy">{price}</strong>
          <span className="inline-flex items-center gap-1 text-xs font-bold text-binu-navy">
            <Star className="size-3.5 fill-[#F2C35E] text-[#F2C35E]" />
            {rating}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-binu-line bg-white px-2.5 py-1 text-xs font-semibold text-binu-muted"
            >
              {tag}
            </span>
          ))}
        </div>
        <div className={cn("grid gap-2", openLabel && "grid-cols-2")}>
          <Button variant={saved || !onSave ? "binu-soft" : "quiet"} className="w-full" onClick={onSave}>
            {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
            {saved ? "저장됨" : saveLabel}
          </Button>
          {openLabel ? (
            <Button variant="binu" className="w-full" onClick={onOpen}>
              {openLabel}
              <ChevronRight className="size-4" aria-hidden="true" />
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
