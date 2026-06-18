"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslations } from "@/components/order-menu/locale-context";

export default function OrderError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations();

  useEffect(() => {
    console.error("Order page error:", error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-black tracking-tight">{t("error.unexpected")}</h1>
        <p className="mb-8 text-sm font-semibold leading-6 text-muted-foreground">
          {t("error.load_menu")}
        </p>
        <Button onClick={reset} type="button" className="h-12 px-8 text-base font-semibold">
          {t("error.try_again")}
        </Button>
      </div>
    </div>
  );
}
