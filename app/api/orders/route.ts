import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

type OrderCartItem = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedOptions: Array<{
    groupId: string;
    groupName: string;
    choiceId: string;
    choiceName: string;
    priceModifierType: string;
    priceModifier: number;
  }>;
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

  let body: {
    cartItems: OrderCartItem[];
    locationId: string;
    subtotal: number;
    orderTiming: "asap" | "preorder";
    preorderDate?: string;
    preorderTime?: string;
    customerNotes?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.cartItems?.length || !body.locationId || body.subtotal <= 0) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  try {
    const { data: location, error: locationError } = await supabaseAdmin
      .from("locations")
      .select("restaurant_id")
      .eq("id", body.locationId)
      .single();

    if (locationError || !location) {
      return NextResponse.json({ error: "Invalid location" }, { status: 400 });
    }

    const { data: numberData, error: numberError } =
      await supabaseAdmin.rpc("increment_order_number");

    if (numberError || !numberData) {
      return NextResponse.json({ error: "Failed to generate order number" }, { status: 500 });
    }

    const orderCode = `Z-${numberData}`;

    const { data: order, error: orderError } = await supabaseAdmin
      .from("orders")
      .insert({
        restaurant_id: location.restaurant_id,
        user_id: user.id,
        location_id: body.locationId,
        status: "confirmed",
        payment_status: "unpaid",
        subtotal: body.subtotal,
        total: body.subtotal,
        order_code: orderCode,
        order_timing: body.orderTiming,
        preorder_date: body.preorderDate ?? null,
        preorder_time: body.preorderTime ?? null,
        customer_notes: body.customerNotes ?? null,
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
        selectedOptions: item.selectedOptions,
      },
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    return NextResponse.json({ success: true, order_id: order.id, order_code: orderCode });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
