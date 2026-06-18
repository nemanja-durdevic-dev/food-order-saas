import { createClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import { MenuItemsList } from "./menu-items-list";

type MenuItemRow = {
  id: string;
  name: string;
  is_available: boolean;
  category_name: string | null;
};

export default async function StaffMenuItemsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/staff/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!staff || (staff.role !== "staff" && staff.role !== "admin")) {
    redirect("/staff/login");
  }

  const { data: items } = await supabase
    .from("menu_items")
    .select("id, name, is_available, category_id")
    .order("name");

  const categoryIds = [...new Set(items?.map((i) => i.category_id).filter(Boolean) as string[])];

  const { data: categories } = categoryIds.length
    ? await supabase.from("categories").select("id, name").in("id", categoryIds)
    : { data: [] };

  const catMap = new Map(categories?.map((c) => [c.id, c.name]));

  const rows: MenuItemRow[] = (items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    is_available: item.is_available,
    category_name: item.category_id ? (catMap.get(item.category_id) ?? null) : null,
  }));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <h1 className="mb-6 text-2xl font-black tracking-tight">Menu Items</h1>
      <MenuItemsList items={rows} />
    </div>
  );
}
