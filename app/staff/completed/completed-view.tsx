"use client";

import { useMemo, useState } from "react";
import { CheckCheck, Loader2, PackageOpen, XCircle } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

type OrderItemCustomizations = {
  removedIngredients?: string[];
  addOns?: Array<{ id: string; name: string; price: number }>;
  drinks?: Array<{ id: string; name: string; price: number }>;
};

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
  customizations?: OrderItemCustomizations;
};

type CompletedOrder = {
  id: string;
  order_code: string | null;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  customer_notes: string | null;
  order_items: OrderItem[];
};

const STATUS_BADGE: Record<string, { label: string; className: string }> = {
  completed: { label: "Completed", className: "bg-green-100 text-green-800" },
  picked_up: { label: "Picked Up", className: "bg-blue-100 text-blue-800" },
  cancelled: { label: "Cancelled", className: "bg-red-100 text-red-800" },
};

function formatPrice(n: number) {
  return `${Number(n).toFixed(2)} kr`;
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("nb-NO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CompletedView({
  locationId,
  orders: initialOrders,
}: {
  locationId: string;
  orders: CompletedOrder[];
}) {
  const [orders, setOrders] = useState<CompletedOrder[]>(initialOrders);
  const [loading, setLoading] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const completed = orders.filter((o) => o.status === "completed" || o.status === "picked_up");
  const cancelled = orders.filter((o) => o.status === "cancelled");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function loadMore() {
    const last = orders[orders.length - 1];
    if (!last) return;

    setLoading(true);

    const { data } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .eq("location_id", locationId)
      .in("status", ["completed", "cancelled"])
      .lt("updated_at", last.updated_at)
      .order("updated_at", { ascending: false })
      .limit(50);

    if (data) {
      setOrders((prev) => [...prev, ...(data as unknown as CompletedOrder[])]);
    }

    setLoading(false);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Completed Orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 pt-16 text-muted-foreground">
          <PackageOpen className="size-12" />
          <p className="text-sm">No completed orders yet</p>
        </div>
      ) : (
        <>
          <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCheck className="size-4" />
            <span>{completed.length} completed</span>
            <span className="mx-1">&middot;</span>
            <XCircle className="size-4" />
            <span>{cancelled.length} cancelled</span>
          </div>

          <div className="space-y-2">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? {
                label: order.status,
                className: "bg-gray-100 text-gray-800",
              };
              const isExpanded = expandedId === order.id;

              return (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-card shadow-sm overflow-hidden"
                >
                  <button
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 flex-wrap"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                    type="button"
                  >
                    <span className="text-lg font-black min-w-[4rem]">{order.order_code}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.className}`}
                    >
                      {badge.label}
                    </span>
                    <span className="text-xs text-muted-foreground lg:text-sm ml-0 lg:ml-0 w-full lg:w-auto order-last lg:order-none mt-0.5 lg:mt-0">
                      {formatDate(order.updated_at)}
                    </span>
                    <span className="ml-auto text-sm font-semibold">
                      {formatPrice(order.total)}
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-border px-4 py-3 space-y-2">
                      <ul className="space-y-1">
                        {order.order_items?.map((item) => (
                          <li key={item.id} className="text-sm">
                            <span className="font-medium">{item.quantity}x</span> {item.item_name}
                            {item.customizations && (
                              <div className="ml-4 text-xs text-muted-foreground space-y-0.5 mt-0.5">
                                {item.customizations.removedIngredients?.length ? (
                                  <p>No {item.customizations.removedIngredients.join(", ")}</p>
                                ) : null}
                                {item.customizations.addOns?.length ? (
                                  <p>
                                    + {item.customizations.addOns.map((a) => a.name).join(", ")}
                                  </p>
                                ) : null}
                                {item.customizations.drinks?.length ? (
                                  <p>
                                    Drink:{" "}
                                    {item.customizations.drinks.map((d) => d.name).join(", ")}
                                  </p>
                                ) : null}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>

                      {order.customer_notes && (
                        <p className="text-sm text-muted-foreground italic">
                          &ldquo;{order.customer_notes}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex justify-center pt-6 pb-4">
            <button
              className="flex items-center gap-2 rounded-lg border border-border px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
              disabled={loading}
              onClick={loadMore}
              type="button"
            >
              {loading ? <Loader2 className="size-4 animate-spin" /> : null}
              Load more
            </button>
          </div>
        </>
      )}
    </div>
  );
}
