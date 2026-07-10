import Image from "next/image";
import { ArrowUpRight, Bookmark, BookmarkCheck, MapPin, ShieldCheck, Star } from "lucide-react";

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

type ServiceCardProps = {
  title: string;
  description: string;
  price: string;
  region: string;
  review: string;
  rating?: string;
  source?: string;
  imageSrc?: string | null;
  tags?: string[];
  saved?: boolean;
  onSave?: () => void;
  onOpen?: () => void;
  className?: string;
};

export function ServiceCard({
  title,
  description,
  price,
  region,
  review,
  rating,
  source,
  imageSrc,
  tags = [],
  saved = false,
  onSave,
  onOpen,
  className,
}: ServiceCardProps) {
  return (
    <Card
      className={cn(
        "border-binu-line bg-[linear-gradient(135deg,#FFFFFF_0%,#F5FAFE_58%,#FFF7F0_100%)] shadow-[0_16px_42px_rgba(46,75,102,0.08)]",
        className,
      )}
    >
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="relative grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-white text-binu-navy ring-1 ring-binu-line">
            {imageSrc ? (
              <Image src={imageSrc} alt="" fill sizes="56px" className="object-cover" />
            ) : (
              <ShieldCheck className="size-5" />
            )}
          </div>
          <div>
            <StatusBadge tone="service">필요할 땐 연결</StatusBadge>
            <CardTitle className="mt-2 text-[17px] font-extrabold text-binu-ink">
              {title}
            </CardTitle>
          </div>
        </div>
        <CardAction>
          <span className="rounded-full bg-white px-2.5 py-1 text-xs font-extrabold text-binu-navy ring-1 ring-binu-line">
            {price}
          </span>
        </CardAction>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-binu-text">{description}</p>
        <div className="grid gap-2 text-xs font-bold text-binu-muted">
          <span className="inline-flex items-center gap-2">
            <MapPin className="size-3.5 text-binu-navy" />
            {region}
          </span>
          <span>이용 후기: {review}</span>
          {rating ? (
            <span className="inline-flex items-center gap-1 text-binu-navy">
              <Star className="size-3.5 fill-[#F2C35E] text-[#F2C35E]" aria-hidden="true" />
              {rating}{source ? ` · ${source}` : ""}
            </span>
          ) : null}
        </div>
        {tags.length ? (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span key={tag} className="rounded-full border border-binu-line bg-white px-2.5 py-1 text-xs font-semibold text-binu-muted">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
        {onSave ? (
          <div className="grid grid-cols-2 gap-2">
            <Button variant={saved ? "binu-soft" : "quiet"} className="w-full" onClick={onSave}>
              {saved ? <BookmarkCheck className="size-4" aria-hidden="true" /> : <Bookmark className="size-4" aria-hidden="true" />}
              {saved ? "저장됨" : "저장"}
            </Button>
            <Button variant="binu" className="w-full" onClick={onOpen}>
              서비스 보기
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button variant="binu" className="w-full" onClick={onOpen}>
            서비스 보기
            <ArrowUpRight className="size-4" aria-hidden="true" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
