import type { ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ModalProps = {
  children: ReactNode;
  closeLabel?: string;
  isClosing: boolean;
  onClose: () => void;
  className?: string;
};

export function Modal({
  children,
  closeLabel = "Close",
  isClosing,
  onClose,
  className,
}: ModalProps) {
  return (
    <div
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-[60] flex items-end bg-foreground/40 backdrop-blur-sm sm:items-center sm:justify-center sm:p-6",
        isClosing ? "animate-out fade-out-0 duration-300" : "animate-in fade-in-0 duration-300",
      )}
      role="dialog"
    >
      <div
        className={cn(
          "relative flex h-full max-h-[86dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl duration-300 sm:max-w-md sm:rounded-3xl",
          isClosing ? "animate-out slide-out-to-bottom-8" : "animate-in slide-in-from-bottom-8",
          className,
        )}
      >
        <Button
          aria-label={closeLabel}
          className="absolute right-4 top-4 z-10 size-10 rounded-full bg-white/85 shadow-lg backdrop-blur hover:bg-white"
          onClick={onClose}
          size="icon"
          type="button"
          variant="ghost"
        >
          <X className="size-5" aria-hidden="true" />
        </Button>
        {children}
      </div>
    </div>
  );
}
