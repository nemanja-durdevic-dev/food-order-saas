import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { CompletedView } from "./completed-view";

type CompletedOrder = {
  id: string;
  order_code: string | null;
  status: string;
  total: number;
  created_at: string;
  updated_at: string;
  customer_notes: string | null;
  order_items: Array<{
    id: string;
    item_name: string;
    quantity: number;
    customizations?: {
      removedIngredients?: string[];
      addOns?: Array<{ id: string; name: string; price: number }>;
      drinks?: Array<{ id: string; name: string; price: number }>;
    };
  }>;
};

export default async function CompletedPage() {
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
    .in("status", ["completed", "cancelled"])
    .order("updated_at", { ascending: false })
    .limit(50);

  return (
    <CompletedView
      locationId={staff.location_id}
      orders={(orders ?? []) as unknown as CompletedOrder[]}
    />
  );
}
