import type { HTMLAttributes, Ref } from "react";

import { cn } from "@/lib/utils";

type DivProps = HTMLAttributes<HTMLDivElement> & { ref?: Ref<HTMLDivElement> };

export function Card({ className, ref, ...props }: DivProps) {
  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ref, ...props }: DivProps) {
  return <div ref={ref} className={cn("p-5 pb-3", className)} {...props} />;
}

export function CardTitle({
  className,
  ref,
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { ref?: Ref<HTMLHeadingElement> }) {
  return <h3 ref={ref} className={cn("text-lg font-bold tracking-tight", className)} {...props} />;
}

export function CardContent({ className, ref, ...props }: DivProps) {
  return <div ref={ref} className={cn("p-5 pt-0", className)} {...props} />;
}
