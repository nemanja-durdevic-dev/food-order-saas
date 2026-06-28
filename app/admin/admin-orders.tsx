"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

type OrderItem = {
  id: string;
  item_name: string;
  quantity: number;
};

type Order = {
  id: string;
  order_code: string | null;
  status: string;
  created_at: string;
  customer_notes: string | null;
  total: number;
  location_id: string;
  locations: { name: string } | null;
  order_items: OrderItem[];
};

type Location = {
  id: string;
  name: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700",
  unpaid: "bg-gray-100 text-gray-700",
  confirmed: "bg-red-100 text-red-700",
  preparing: "bg-indigo-100 text-indigo-700",
  ready_for_pickup: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  cancelled: "bg-gray-100 text-gray-500",
  failed: "bg-red-100 text-red-700",
};

export default function AdminOrders({
  initialOrders,
  locations,
}: {
  initialOrders: Order[];
  locations: Location[];
}) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [locationFilter, setLocationFilter] = useState("all");
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setOrders((prev) => [payload.new as Order, ...prev]);
        } else if (payload.eventType === "UPDATE") {
          setOrders((prev) =>
            prev.map((o) => (o.id === payload.new.id ? (payload.new as Order) : o)),
          );
        } else if (payload.eventType === "DELETE") {
          setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const filtered =
    locationFilter === "all" ? orders : orders.filter((o) => o.location_id === locationFilter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Orders</h1>
        <div className="flex gap-2">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-xl border border-input bg-background px-4 py-2 text-sm"
          >
            <option value="all">All locations</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => router.refresh()}
            className="rounded-xl border border-input bg-background px-4 py-2 text-sm hover:bg-muted"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-card border-b border-border">
              <th className="text-left px-4 py-3 font-semibold">Code</th>
              <th className="text-left px-4 py-3 font-semibold">Location</th>
              <th className="text-left px-4 py-3 font-semibold">Items</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Total</th>
              <th className="text-left px-4 py-3 font-semibold">Time</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((order) => (
              <tr key={order.id} className="border-b border-border last:border-0 hover:bg-card/50">
                <td className="px-4 py-3 font-bold">
                  <Link
                    href={`/admin/orders/${encodeURIComponent(order.id)}`}
                    className="underline underline-offset-4 hover:text-muted-foreground"
                  >
                    {order.order_code}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{order.locations?.name}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {order.order_items?.slice(0, 3).map((item) => (
                      <span
                        key={item.id}
                        className="inline-block rounded-md bg-muted px-2 py-0.5 text-xs"
                      >
                        {item.quantity}x {item.item_name}
                      </span>
                    ))}
                    {(order.order_items?.length ?? 0) > 3 && (
                      <span className="text-xs text-muted-foreground">
                        +{order.order_items.length - 3} more
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700"}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums">${Number(order.total).toFixed(2)}</td>
                <td className="px-4 py-3 text-muted-foreground tabular-nums text-xs">
                  {new Date(order.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <p className="text-center text-muted-foreground py-12">No orders found</p>
        )}
      </div>
    </div>
  );
}
