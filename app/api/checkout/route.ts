import { type NextRequest, NextResponse } from "next/server";

import { assertLocationOpen } from "@/lib/location-check";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";
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
    const locationCheck = await assertLocationOpen({
      locationId: body.locationId,
      orderTiming: body.orderTiming,
      preorderDate: body.preorderDate,
      preorderTime: body.preorderTime,
      supabaseAdmin,
    });

    if (!locationCheck.allowed) {
      return NextResponse.json({ error: locationCheck.error }, { status: 400 });
    }

    const restaurantId = locationCheck.restaurantId;

    const { data: restaurant, error: restaurantError } = await supabaseAdmin
      .from("restaurants")
      .select("stripe_account_id, payments_enabled")
      .eq("id", restaurantId)
      .maybeSingle();

    if (restaurantError) {
      console.error("Checkout restaurant lookup error:", restaurantError);

      return NextResponse.json({ error: "Failed to read restaurant" }, { status: 500 });
    }

    if (!restaurant) {
      return NextResponse.json({ error: "Invalid restaurant" }, { status: 400 });
    }

    if (!restaurant.payments_enabled || !restaurant.stripe_account_id) {
      return NextResponse.json({ error: "Stripe payments are not configured" }, { status: 400 });
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
        restaurant_id: restaurantId,
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

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        payment_method_types: ["card"] as Stripe.Checkout.SessionCreateParams.PaymentMethodType[],
        metadata: {
          order_id: order.id,
        },
        line_items: body.cartItems.map((item: CartItemInput) => ({
          price_data: {
            currency: "nok",
            product_data: {
              name: item.name,
            },
            unit_amount: Math.round(item.unitPrice * 100),
          },
          quantity: item.quantity,
        })),
        success_url: `${origin}/order/${order.id}`,
        cancel_url: `${origin}/order`,
      },
      {
        stripeAccount: restaurant.stripe_account_id,
      },
    );

    await supabaseAdmin.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

    return NextResponse.json({ url: session.url, orderId: order.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
