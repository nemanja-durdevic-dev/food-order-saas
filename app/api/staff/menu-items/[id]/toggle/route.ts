import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!staff || (staff.role !== "staff" && staff.role !== "admin")) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { id } = await params;

  const { data: item, error: fetchError } = await supabase
    .from("menu_items")
    .select("id, is_available")
    .eq("id", id)
    .single();

  if (fetchError || !item) {
    return NextResponse.json({ error: "Menu item not found" }, { status: 404 });
  }

  const { data: updated, error: updateError } = await supabase
    .from("menu_items")
    .update({ is_available: !item.is_available })
    .eq("id", id)
    .select("id, is_available")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Failed to toggle availability" }, { status: 500 });
  }

  return NextResponse.json({ id: updated.id, is_available: updated.is_available });
}
