"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarClock, Loader2, X } from "lucide-react";
import { createClient } from "@/lib/supabase-browser";

const TICK_INTERVAL = 30_000;

function playNewOrderSound() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.setValueAtTime(660, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {
    // Audio not available
  }
}

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

type Order = {
  id: string;
  order_code: string | null;
  status: string;
  created_at: string;
  customer_notes: string | null;
  order_timing: string;
  preorder_date: string | null;
  preorder_time: string | null;
  order_items: OrderItem[];
};

const STATUS_FLOW: Record<string, string> = {
  confirmed: "preparing",
  preparing: "ready_for_pickup",
  ready_for_pickup: "completed",
};

const ACTION_LABEL: Record<string, string> = {
  confirmed: "Start Preparing",
  preparing: "Mark Ready",
  ready_for_pickup: "Mark Completed",
};

const STATUS_LABEL: Record<string, string> = {
  confirmed: "New",
  preparing: "Preparing",
  ready_for_pickup: "Ready",
};

const BORDER_COLOR: Record<string, string> = {
  confirmed: "border-l-red-500",
  preparing: "border-l-indigo-500",
  ready_for_pickup: "border-l-green-500",
};

export default function KitchenDashboard({
  locationId,
  initialOrders,
}: {
  locationId: string;
  initialOrders: Order[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [now, setNow] = useState(() => Date.now());
  const [loadingOrders, setLoadingOrders] = useState<Set<string>>(new Set());
  const [showScheduled, setShowScheduled] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const channel = supabase
      .channel("kitchen-orders")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders",
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            if (["confirmed", "preparing", "ready_for_pickup"].includes(payload.new.status)) {
              playNewOrderSound();
              supabase
                .from("orders")
                .select("*, order_items(*)")
                .eq("id", payload.new.id)
                .single()
                .then(({ data }) => {
                  if (data) {
                    setOrders((prev) => [...prev, data as unknown as Order]);
                  }
                });
            }
          } else if (payload.eventType === "UPDATE") {
            setOrders((prev) => {
              const updated = payload.new as Order;
              if (["picked_up", "completed", "cancelled"].includes(updated.status)) {
                return prev.filter((o) => o.id !== updated.id);
              }
              if (["confirmed", "preparing", "ready_for_pickup"].includes(updated.status)) {
                if (prev.some((o) => o.id === updated.id)) {
                  return prev.map((o) =>
                    o.id === updated.id ? { ...o, ...updated, order_items: o.order_items } : o,
                  );
                }
                supabase
                  .from("orders")
                  .select("*, order_items(*)")
                  .eq("id", updated.id)
                  .single()
                  .then(({ data }) => {
                    if (data) {
                      setOrders((prev) => {
                        if (prev.some((o) => o.id === data.id)) {
                          return prev.map((o) =>
                            o.id === data.id ? (data as unknown as Order) : o,
                          );
                        }
                        return [...prev, data as unknown as Order];
                      });
                    }
                  });
                return prev;
              }
              if (updated.status === "pending") {
                return prev.filter((o) => o.id !== updated.id);
              }
              return prev;
            });
          } else if (payload.eventType === "DELETE") {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [locationId, supabase]);

  // Re-render every 30s so elapsed times stay current
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), TICK_INTERVAL);
    return () => clearInterval(id);
  }, []);

  async function advanceStatus(orderId: string, currentStatus: string) {
    const next = STATUS_FLOW[currentStatus];
    if (!next) return;

    setLoadingOrders((prev) => new Set(prev).add(orderId));

    try {
      await supabase
        .from("orders")
        .update({ status: next, updated_at: new Date().toISOString() })
        .eq("id", orderId);
    } finally {
      setLoadingOrders((prev) => {
        const nextSet = new Set(prev);
        nextSet.delete(orderId);
        return nextSet;
      });
    }
  }

  function isPreorderDue(order: Order) {
    if (order.order_timing !== "preorder" || !order.preorder_date || !order.preorder_time)
      return true;
    const [h, m] = order.preorder_time.split(":").map(Number);
    const scheduled = new Date(order.preorder_date);
    scheduled.setHours(h, m, 0, 0);
    return scheduled <= new Date(now);
  }

  const grouped: Record<string, Order[]> = {
    confirmed: orders.filter((o) => o.status === "confirmed" && isPreorderDue(o)),
    preparing: orders.filter((o) => o.status === "preparing" && isPreorderDue(o)),
    ready_for_pickup: orders.filter((o) => o.status === "ready_for_pickup" && isPreorderDue(o)),
  };

  const scheduledOrders = orders.filter(
    (o) => ["confirmed", "preparing", "ready_for_pickup"].includes(o.status) && !isPreorderDue(o),
  );

  function timeSince(date: string) {
    const minutes = Math.floor((now - new Date(date).getTime()) / 1000 / 60);
    if (minutes < 1) return "now";
    return `${minutes}m`;
  }

  const COLUMNS = ["confirmed", "preparing", "ready_for_pickup"] as const;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        {scheduledOrders.length > 0 && (
          <button
            onClick={() => setShowScheduled(true)}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            type="button"
          >
            <CalendarClock className="size-3.5" />
            {scheduledOrders.length} scheduled
          </button>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:flex-1 lg:min-h-0">
        {COLUMNS.map((status) => {
          const statusOrders = grouped[status] ?? [];

          return (
            <div
              key={status}
              className="w-full lg:flex-1 min-w-0 flex flex-col bg-muted/30 rounded-xl mb-4 lg:mb-0"
            >
              <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-b border-border">
                <div
                  className={`size-2.5 rounded-full ${status === "confirmed" ? "bg-red-500" : status === "preparing" ? "bg-indigo-500" : "bg-green-500"}`}
                />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {STATUS_LABEL[status]}
                </h2>
                <span className="ml-auto text-xs font-bold text-muted-foreground/60 tabular-nums">
                  {statusOrders.length}
                </span>
              </div>

              <div className="lg:flex-1 lg:overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden">
                {statusOrders.length === 0 && (
                  <p className="text-xs text-muted-foreground/50 text-center pt-8">No orders</p>
                )}
                {statusOrders.map((order) => (
                  <div
                    key={order.id}
                    className={`rounded-xl bg-card border border-border border-l-4 ${BORDER_COLOR[status]} p-3 lg:p-4 shadow-sm flex flex-col`}
                  >
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black">{order.order_code}</span>
                          {order.order_timing === "preorder" && order.preorder_time && (
                            <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
                              {order.preorder_date && (
                                <>
                                  {new Date(order.preorder_date).toLocaleDateString("nb-NO", {
                                    day: "numeric",
                                    month: "short",
                                  })}{" "}
                                </>
                              )}
                              {order.preorder_time.slice(0, 5)}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {timeSince(order.created_at)}
                        </span>
                      </div>

                      <ul className="space-y-1 mb-3">
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
                        <p className="text-sm text-muted-foreground italic mb-3">
                          &ldquo;{order.customer_notes}&rdquo;
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => advanceStatus(order.id, status)}
                      disabled={loadingOrders.has(order.id)}
                      className="w-full rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground active:scale-[0.98] transition-transform disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-auto"
                    >
                      {loadingOrders.has(order.id) ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : null}
                      {ACTION_LABEL[status]}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {orders.length === 0 && (
        <p className="text-muted-foreground text-center py-12">No active orders</p>
      )}

      {showScheduled && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="mx-4 w-full max-w-lg rounded-2xl bg-card shadow-xl border border-border max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 shrink-0">
              <h2 className="font-bold text-lg">Scheduled Orders</h2>
              <button
                onClick={() => setShowScheduled(false)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted transition-colors"
                type="button"
              >
                <X className="size-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 space-y-3">
              {scheduledOrders.map((order) => (
                <div
                  key={order.id}
                  className={`rounded-xl bg-card border border-border border-l-4 ${BORDER_COLOR[order.status]} p-4 shadow-sm`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-black">{order.order_code}</span>
                      <span className="shrink-0 rounded-md bg-secondary px-2 py-0.5 text-xs font-semibold text-foreground">
                        {order.preorder_date && (
                          <>
                            {new Date(order.preorder_date).toLocaleDateString("nb-NO", {
                              day: "numeric",
                              month: "short",
                            })}{" "}
                          </>
                        )}
                        {order.preorder_time?.slice(0, 5)}
                      </span>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        order.status === "confirmed"
                          ? "bg-red-100 text-red-800"
                          : order.status === "preparing"
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {STATUS_LABEL[order.status]}
                    </span>
                  </div>
                  <ul className="space-y-0.5">
                    {order.order_items?.map((item) => (
                      <li key={item.id} className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{item.quantity}x</span>{" "}
                        {item.item_name}
                      </li>
                    ))}
                  </ul>
                  {order.customer_notes && (
                    <p className="text-sm text-muted-foreground italic mt-2">
                      &ldquo;{order.customer_notes}&rdquo;
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
