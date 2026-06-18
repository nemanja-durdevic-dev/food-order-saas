import { type NextRequest, NextResponse } from "next/server";

import { createPayment, isVippsConfigured } from "@/lib/vipps";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

type CartItemInput = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
  total: number;
  customizations?: {
    removedIngredients?: string[];
    addOns?: Array<{ id: string; name: string; price: number }>;
    drinks?: Array<{ id: string; name: string; price: number }>;
  };
};

type CheckoutBody = {
  cartItems: CartItemInput[];
  locationId: string;
  orderComment: string;
  orderTiming: "asap" | "preorder";
  preorderDate: string;
  preorderTime: string;
  subtotal: number;
};

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Missing authorization header" }, { status: 401 });
  }

  if (!isVippsConfigured) {
    return NextResponse.json({ error: "Vipps not configured" }, { status: 500 });
  }

  const token = authHeader.slice(7);
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CheckoutBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.cartItems?.length || !body.locationId || body.subtotal <= 0) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
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
        status: "pending",
        payment_status: "unpaid",
        subtotal: body.subtotal,
        total: body.subtotal,
        customer_notes: body.orderComment || null,
        order_code: orderCode,
        order_timing: body.orderTiming,
        preorder_date: body.orderTiming === "preorder" ? body.preorderDate : null,
        preorder_time: body.orderTiming === "preorder" ? body.preorderTime : null,
      })
      .select("id, order_code")
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: "Failed to create order" }, { status: 500 });
    }

    const orderItems = body.cartItems.map((item: CartItemInput) => ({
      order_id: order.id,
      menu_item_id: item.id,
      item_name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total: item.total,
      customizations: item.customizations ?? {},
    }));

    const { error: itemsError } = await supabaseAdmin.from("order_items").insert(orderItems);

    if (itemsError) {
      await supabaseAdmin.from("orders").delete().eq("id", order.id);

      return NextResponse.json({ error: "Failed to create order items" }, { status: 500 });
    }

    const origin = request.headers.get("origin") ?? "http://localhost:3000";

    const phoneNumber = user.phone ?? undefined;

    const vippsPayment = await createPayment({
      amount: body.subtotal,
      reference: order.id,
      returnUrl: `${origin}/order/${order.id}`,
      phoneNumber,
    });

    await supabaseAdmin
      .from("orders")
      .update({ vipps_payment_reference: vippsPayment.reference })
      .eq("id", order.id);

    return NextResponse.json({ url: vippsPayment.redirectUrl, orderId: order.id });
  } catch (err) {
    console.error("Vipps checkout error:", err);
    return NextResponse.json({ error: "Vipps checkout failed" }, { status: 500 });
  }
}
