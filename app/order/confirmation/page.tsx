import Link from "next/link";
import { getLocale, getDictionary } from "@/lib/dictionaries";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Order Received — ${BRAND_NAME}`,
};

export default async function OrderConfirmationPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="size-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
            />
          </svg>
        </div>
        <h1 className="text-2xl font-black tracking-tight">
          {t.order.confirmation_title as string}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {t.order.confirmation_text as string}
        </p>
        <p className="mt-4 text-xs text-muted-foreground/60">
          {t.order.confirmation_note as string}
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <Link
            className="inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90"
            href="/order"
          >
            {t.order.back_to_menu as string}
          </Link>
        </div>
      </div>
    </main>
  );
}
