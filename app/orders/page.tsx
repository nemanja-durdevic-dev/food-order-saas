import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Clock, ShoppingBag } from "lucide-react";
import { getLocale, getDictionary } from "@/lib/dictionaries";
import { createClient } from "@/lib/supabase-server";
import { formatPrice } from "@/components/order-menu/utils";
import { Button } from "@/components/ui/button";

type OrderRow = {
  id: string;
  order_code: string;
  location_id: string | null;
  status: string;
  subtotal: number;
  total: number;
  created_at: string;
  locations: { name: string }[] | null;
};

const statusColors: Record<string, string> = {
  pending: "text-gray-600 bg-gray-50 border-gray-200",
  confirmed: "text-blue-600 bg-blue-50 border-blue-200",
  preparing: "text-indigo-600 bg-indigo-50 border-indigo-200",
  ready_for_pickup: "text-green-600 bg-green-50 border-green-200",
  completed: "text-gray-500 bg-gray-50 border-gray-200",
  cancelled: "text-red-600 bg-red-50 border-red-200",
};

function formatDate(dateStr: string, locale: string) {
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function OrdersPage() {
  const locale = await getLocale();
  const t = await getDictionary(locale);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/order");
  }

  const { data: orders } = await supabase
    .from("orders")
    .select("id, order_code, location_id, status, subtotal, total, created_at, locations(name)")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="sticky top-0 z-10 border-b border-border bg-white">
        <div className="mx-auto flex h-14 max-w-2xl items-center gap-3 px-4">
          <Link
            aria-label={t.common.back}
            className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            href="/order"
          >
            <ChevronRight className="size-5 rotate-180" aria-hidden="true" />
          </Link>
          <h1 className="text-lg font-bold tracking-tight">{t.user.my_orders}</h1>
        </div>
      </div>
      <div className="mx-auto max-w-2xl px-4 py-6">
        {!orders || orders.length === 0 ? (
          <div className="flex flex-col items-center py-20 text-center">
            <ShoppingBag className="size-12 text-muted-foreground" aria-hidden="true" />
            <p className="mt-4 text-lg font-semibold">{t.order.no_orders}</p>
            <Button asChild className="mt-6">
              <Link href="/order">{t.order.place_first}</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((order: OrderRow) => {
              const colorClass =
                statusColors[order.status] ?? "text-gray-600 bg-gray-50 border-gray-200";
              const dateLabel = formatDate(order.created_at, locale);

              return (
                <li key={order.id}>
                  <Link
                    className="flex items-center gap-4 rounded-xl border border-border bg-white p-4 shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href={`/order/${order.id}`}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-bold">
                          {(Array.isArray(order.locations) ? order.locations[0] : order.locations)
                            ?.name ?? t.order.unknown_location}
                        </span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase leading-none ${colorClass}`}
                        >
                          {t.order.status[order.status as keyof typeof t.order.status] ??
                            order.status}
                        </span>
                      </span>
                      <span className="mt-0.5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Clock className="size-3.5" aria-hidden="true" />
                        {dateLabel}
                        <span aria-hidden="true">·</span>
                        <span>{formatPrice(order.total)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono font-bold">#{order.order_code}</span>
                      </span>
                    </span>
                    <ChevronRight
                      className="size-5 shrink-0 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
