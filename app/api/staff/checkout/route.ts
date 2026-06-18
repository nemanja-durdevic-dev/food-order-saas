import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type StaffCartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  removedIngredients?: string[];
  addOns?: Array<{ id: string; name: string; price: number }>;
  drinks?: Array<{ id: string; name: string; price: number }>;
};

type StaffCheckoutBody = {
  cartItems: StaffCartItem[];
  locationId: string;
  subtotal: number;
};

export async function POST(request: NextRequest) {
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
    .select("location_id, role")
    .eq("user_id", user.id)
    .single();

  if (!staff || staff.role !== "staff") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  let body: StaffCheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.cartItems?.length || !body.locationId || body.subtotal <= 0) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  if (body.locationId !== staff.location_id) {
    return NextResponse.json({ error: "Location mismatch" }, { status: 403 });
  }

  try {
    const { data: numberData, error: numberError } =
      await supabaseAdmin.rpc("increment_order_number");

    if (numberError || !numberData) {
      return NextResponse.json({ error: "Failed to generate order number" }, { status: 500 });
    }

    const orderCode = `Z-${numberData}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: user.id,
        location_id: body.locationId,
        status: "confirmed",
        payment_status: "paid",
        subtotal: body.subtotal,
        total: body.subtotal,
        order_code: orderCode,
      })
      .select("id, order_code")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderItems = body.cartItems.map((item) => ({
      order_id: order.id,
      menu_item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      customizations: {
        removedIngredients: item.removedIngredients ?? [],
        addOns: item.addOns ?? [],
        drinks: item.drinks ?? [],
      },
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    return NextResponse.json({ success: true, order_code: orderCode });
  } catch (err) {
    console.error("Staff checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
