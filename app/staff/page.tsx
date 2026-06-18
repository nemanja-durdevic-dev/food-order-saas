import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, History, PlusCircle, ArrowRight } from "lucide-react";
import { BRAND_NAME } from "@/lib/brand";

export const metadata = {
  title: `Dashboard — ${BRAND_NAME} Staff`,
};

export default async function StaffHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/staff/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("location_id, role")
    .eq("user_id", user.id)
    .single();

  if (!staff || staff.role !== "staff" || !staff.location_id) {
    return (
      <p className="text-muted-foreground">
        No location assigned. Ask an admin to add you to the staff table.
      </p>
    );
  }

  const { data: location } = await supabase
    .from("locations")
    .select("name")
    .eq("id", staff.location_id)
    .single();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: counts } = await supabase
    .from("orders")
    .select("status")
    .eq("location_id", staff.location_id)
    .gte("created_at", today.toISOString());

  const pending =
    counts?.filter((o) => o.status === "confirmed" || o.status === "preparing").length ?? 0;
  const ready = counts?.filter((o) => o.status === "ready_for_pickup").length ?? 0;
  const completed =
    counts?.filter((o) => o.status === "picked_up" || o.status === "completed").length ?? 0;

  const { data: recentOrders } = await supabase
    .from("orders")
    .select("order_code, status, created_at, payment_status")
    .eq("location_id", staff.location_id)
    .order("updated_at", { ascending: false })
    .limit(5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">{location?.name ?? "Unknown location"}</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-black">{pending}</p>
          <p className="text-xs text-muted-foreground">In progress</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-black text-green-600">{ready}</p>
          <p className="text-xs text-muted-foreground">Ready for pickup</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-3xl font-black">{completed}</p>
          <p className="text-xs text-muted-foreground">Completed today</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Link
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          href="/staff/orders"
        >
          <div className="flex items-center gap-3">
            <ClipboardList className="size-5 text-primary" />
            <span className="text-sm font-semibold">Orders</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          href="/staff/order"
        >
          <div className="flex items-center gap-3">
            <PlusCircle className="size-5 text-primary" />
            <span className="text-sm font-semibold">New Order</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
        <Link
          className="flex items-center justify-between rounded-xl border border-border bg-card p-4 transition-colors hover:bg-muted"
          href="/staff/completed"
        >
          <div className="flex items-center gap-3">
            <History className="size-5 text-primary" />
            <span className="text-sm font-semibold">Completed</span>
          </div>
          <ArrowRight className="size-4 text-muted-foreground" />
        </Link>
      </div>

      {recentOrders && recentOrders.length > 0 && (
        <div>
          <h2 className="mb-3 text-sm font-bold tracking-tight">Recent activity</h2>
          <div className="space-y-2">
            {recentOrders.map((order) => (
              <Link
                key={order.order_code}
                href="/staff/orders"
                className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm transition-colors hover:bg-muted"
              >
                <span className="font-medium">#{order.order_code}</span>
                <span className="text-xs text-muted-foreground capitalize">
                  {order.status.replace(/_/g, " ")}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
