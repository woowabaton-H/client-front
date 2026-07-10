import Image from "next/image";

import { cn } from "@/lib/utils";

type BrandEntryLoaderProps = {
  className?: string;
};

export function BrandEntryLoader({
  className,
}: BrandEntryLoaderProps) {
  return (
    <section
      className={cn(
        "absolute inset-0 z-70 grid place-items-center overflow-hidden bg-[linear-gradient(155deg,#F7FBFE_0%,#FFFFFF_48%,#FFF7F0_100%)] px-8 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label="비누 서비스 준비 중"
    >
      <div className="absolute inset-x-0 top-0 h-28 border-b border-white/80 bg-[linear-gradient(180deg,#E7F1FB_0%,rgba(231,241,251,0)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-36 border-t border-white/80 bg-[linear-gradient(0deg,#E7F1FB_0%,rgba(231,241,251,0)_100%)]" />

      <div className="relative z-10 flex w-full max-w-[310px] flex-col items-center">
        <div className="binu-entry-icon relative grid size-33 place-items-center rounded-[30px] bg-white/55 shadow-[0_24px_70px_rgba(46,75,102,0.16)] ring-1 ring-white/90">
          <Image
            className="size-28 rounded-[26px] shadow-[0_18px_45px_rgba(46,75,102,0.18)]"
            src="/binu/app-icon-main.png"
            alt="비누"
            width={112}
            height={112}
            priority
          />
        </div>

        <h1 className="mt-9 text-[30px] font-black leading-tight tracking-normal text-binu-ink">
          비우는 루틴,
          <br />
          누리는 하루.
        </h1>
      </div>
    </section>
  );
}
