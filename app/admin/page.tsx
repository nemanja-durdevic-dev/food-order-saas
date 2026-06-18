import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import AdminOrders from "./admin-orders";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/staff/login");

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!staff || staff.role !== "admin") redirect("/staff/login");

  const { data: orders } = await supabase
    .from("orders")
    .select("*, locations(name), order_items(*)")
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: locations } = await supabase.from("locations").select("id, name");

  return <AdminOrders initialOrders={orders ?? []} locations={locations ?? []} />;
}
