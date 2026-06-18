import { Flame } from "lucide-react";

import { BRAND_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  variant?: "hero" | "badge" | "inline";
};

export function Logo({ className, variant = "inline" }: LogoProps) {
  if (variant === "hero") {
    return (
      <div className={cn("flex flex-col items-center gap-4 text-center", className)}>
        <div className="flex size-24 rotate-[-8deg] items-center justify-center rounded-[2rem] bg-foreground text-background shadow-xl shadow-orange-950/15">
          <Flame className="size-12 fill-current" aria-hidden="true" />
        </div>
        <div>
          <p className="text-4xl font-black tracking-[-0.06em] text-foreground sm:text-5xl">
            {BRAND_NAME}
          </p>
          <p className="mt-2 text-sm font-bold uppercase tracking-[0.22em] text-primary">
            Pickup kitchen
          </p>
        </div>
      </div>
    );
  }

  if (variant === "badge") {
    return (
      <div
        className={cn(
          "flex size-16 flex-col items-center justify-center gap-0.5 rounded-md bg-white text-foreground shadow-sm",
          className,
        )}
      >
        <Flame className="size-6 fill-current" aria-hidden="true" />
        <span className="max-w-full truncate px-1 text-xs font-black tracking-[-0.06em]">
          {BRAND_NAME}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="grid size-9 place-items-center rounded-md bg-primary text-primary-foreground">
        <Flame className="size-5 fill-current" aria-hidden="true" />
      </span>
      <span className="text-base font-black tracking-[-0.04em]">{BRAND_NAME}</span>
    </div>
  );
}
