import { type NextRequest, NextResponse } from "next/server";

import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 });
  }

  const body = await request.text();

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "paid",
            status: "confirmed",
          })
          .eq("id", orderId);

        if (error) throw error;
      }

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object;
      const orderId = session.metadata?.order_id;

      if (orderId) {
        const { error } = await supabaseAdmin
          .from("orders")
          .update({
            payment_status: "failed",
            status: "cancelled",
          })
          .eq("id", orderId);

        if (error) throw error;
      }

      break;
    }
  }

  return NextResponse.json({ received: true });
}
