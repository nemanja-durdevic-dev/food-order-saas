import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";
import { AdminShell } from "../../_components/admin-shell";

type OrderItem = {
  id: string;
  menu_item_id: string | null;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  customizations: Record<string, unknown>;
  created_at: string;
};

type Props = {
  params: Promise<{ id: string }>;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-gray-100 text-gray-700 border-gray-200",
  confirmed: "bg-red-50 text-red-700 border-red-200",
  preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready_for_pickup: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  cancelled: "bg-gray-100 text-gray-500 border-gray-200",
};

const PAYMENT_BADGE: Record<string, string> = {
  unpaid: "bg-gray-100 text-gray-700 border-gray-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-amber-50 text-amber-700 border-amber-200",
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatCurrency(value: number) {
  return `${Number(value).toFixed(2)} kr`;
}

function Customizations({ data }: { data: Record<string, unknown> }) {
  if (!data || Object.keys(data).length === 0) return null;

  const parts: string[] = [];

  if (Array.isArray(data.removedIngredients)) {
    for (const ingredient of data.removedIngredients) {
      parts.push(`No ${ingredient}`);
    }
  }

  if (Array.isArray(data.addOns)) {
    for (const addOn of data.addOns) {
      const name =
        typeof addOn === "string" ? addOn : ((addOn as Record<string, unknown>).name ?? "");
      const price =
        typeof addOn === "string" ? null : ((addOn as Record<string, unknown>).price ?? null);
      parts.push(price ? `+ ${name} (${formatCurrency(Number(price))})` : `+ ${name}`);
    }
  }

  if (Array.isArray(data.drinks)) {
    for (const drink of data.drinks) {
      const name =
        typeof drink === "string" ? drink : ((drink as Record<string, unknown>).name ?? "");
      const price =
        typeof drink === "string" ? null : ((drink as Record<string, unknown>).price ?? null);
      parts.push(price ? `+ ${name} (${formatCurrency(Number(price))})` : `+ ${name}`);
    }
  }

  if (typeof data.variant === "string") {
    parts.push(`Variant: ${data.variant}`);
  }

  if (typeof data.size === "string") {
    parts.push(`Size: ${data.size}`);
  }

  if (parts.length === 0) return null;

  return (
    <div className="mt-1 space-y-0.5">
      {parts.map((part, i) => (
        <p key={i} className="text-xs text-muted-foreground">
          {part}
        </p>
      ))}
    </div>
  );
}

export default async function OrderDetailPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/");
  }

  const { data: restaurant } = await supabaseAdmin
    .from("restaurants")
    .select("name")
    .eq("id", membership.restaurant_id)
    .maybeSingle();

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("restaurant_id", membership.restaurant_id)
    .maybeSingle();

  if (!order) {
    notFound();
  }

  const [itemsResult, locationResult, userResult] = await Promise.all([
    supabaseAdmin
      .from("order_items")
      .select("*")
      .eq("order_id", id)
      .order("created_at", { ascending: true }),
    order.location_id
      ? supabaseAdmin.from("locations").select("name").eq("id", order.location_id).maybeSingle()
      : Promise.resolve(null),
    supabaseAdmin.auth.admin.getUserById(order.user_id),
  ]);

  const items = (itemsResult.data ?? []) as unknown as OrderItem[];
  const location = locationResult?.data as { name: string } | null;
  const customer = userResult.data?.user ?? null;

  return (
    <AdminShell
      activeSlug="orders"
      breadcrumbItems={[
        { href: "/admin", label: "Admin" },
        { href: "/admin/orders", label: "Orders" },
        { label: order.order_code ?? "Order" },
      ]}
      restaurantName={restaurant?.name}
    >
      <div className="max-w-3xl">
        <Link
          className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          href="/admin/orders"
        >
          <ArrowLeft className="size-4" />
          Back to orders
        </Link>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Order</p>
              <h2 className="mt-1 text-3xl font-semibold tracking-tight">
                {order.order_code ?? "Untitled"}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${STATUS_BADGE[order.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {order.status.replace(/_/g, " ")}
              </span>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${PAYMENT_BADGE[order.payment_status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
              >
                {order.payment_status.replace(/_/g, " ")}
              </span>
            </div>
          </div>

          <div className="space-y-8 p-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Details
                </h3>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Created</dt>
                    <dd className="font-medium tabular-nums">{formatDateTime(order.created_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Updated</dt>
                    <dd className="font-medium tabular-nums">{formatDateTime(order.updated_at)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Location</dt>
                    <dd className="font-medium">{location?.name ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Order timing</dt>
                    <dd className="font-medium capitalize">
                      {order.order_timing === "preorder" ? "Pre-order" : "ASAP"}
                    </dd>
                  </div>
                  {order.order_timing === "preorder" && (
                    <>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Pre-order date</dt>
                        <dd className="font-medium">{order.preorder_date ?? "-"}</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-muted-foreground">Pre-order time</dt>
                        <dd className="font-medium">{order.preorder_time ?? "-"}</dd>
                      </div>
                    </>
                  )}
                  {order.expected_ready_at && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Expected ready</dt>
                      <dd className="font-medium tabular-nums">
                        {formatDateTime(order.expected_ready_at)}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer
                </h3>
                {customer ? (
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd className="font-medium">{customer.phone ?? "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="font-medium">{customer.email ?? "-"}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">User ID</dt>
                      <dd className="max-w-[160px] truncate font-mono text-xs text-muted-foreground">
                        {customer.id}
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No customer data</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Items
              </h3>
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 text-left font-semibold">Item</th>
                      <th className="px-4 py-2.5 text-center font-semibold">Qty</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Price</th>
                      <th className="px-4 py-2.5 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-border last:border-b-0">
                        <td className="px-4 py-3">
                          <span className="font-medium">{item.item_name}</span>
                          <Customizations data={item.customizations} />
                        </td>
                        <td className="px-4 py-3 text-center tabular-nums">{item.quantity}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {formatCurrency(item.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium">
                          {formatCurrency(item.total)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="border-t border-border bg-muted/30">
                    <tr>
                      <td className="px-4 py-3 text-sm font-medium" colSpan={3}>
                        Subtotal
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium">
                        {formatCurrency(order.subtotal)}
                      </td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-4 py-3 text-sm font-semibold" colSpan={3}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-semibold">
                        {formatCurrency(order.total)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {order.customer_notes && (
              <div>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Customer notes
                </h3>
                <p className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
                  {order.customer_notes}
                </p>
              </div>
            )}

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Payment
              </h3>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <dt className="text-xs text-muted-foreground">Payment status</dt>
                  <dd className="mt-1 font-medium capitalize">
                    {order.payment_status.replace(/_/g, " ")}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-border p-6">
            <Link
              className="inline-flex h-9 items-center gap-1.5 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted"
              href={`/admin/orders/edit?id=${encodeURIComponent(id)}`}
            >
              Edit status
              <ExternalLink className="size-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
