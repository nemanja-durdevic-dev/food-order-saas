import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import KitchenDashboard from "../kitchen-dashboard";

export default async function KitchenPage() {
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

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("location_id", staff.location_id)
    .in("status", ["confirmed", "preparing", "ready_for_pickup"])
    .order("created_at", { ascending: true });

  return <KitchenDashboard locationId={staff.location_id} initialOrders={orders ?? []} />;
}
