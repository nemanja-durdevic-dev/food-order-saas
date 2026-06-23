import { type NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getPayment } from "@/lib/nets";
import { getPaymentStatus } from "@/lib/vipps";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select(
      "payment_status, restaurant_id, stripe_session_id, vipps_payment_reference, nets_payment_id",
    )
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status !== "unpaid") {
    return NextResponse.json({ paid: true });
  }

  // Stripe payment verification
  if (order.stripe_session_id) {
    try {
      const { data: restaurant, error: restaurantError } = await supabaseAdmin
        .from("restaurants")
        .select("stripe_account_id")
        .eq("id", order.restaurant_id)
        .single();

      if (restaurantError || !restaurant?.stripe_account_id) {
        return NextResponse.json({ error: "Stripe account not configured" }, { status: 500 });
      }

      const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
        stripeAccount: restaurant.stripe_account_id,
      });

      const isPaid = session.payment_status === "paid" || session.status === "complete";

      if (isPaid) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("id", id);

        return NextResponse.json({ paid: true });
      }

      return NextResponse.json({ paid: false });
    } catch {
      return NextResponse.json({ error: "Failed to verify payment" }, { status: 500 });
    }
  }

  // NETS payment verification
  if (order.nets_payment_id) {
    try {
      const payment = await getPayment(order.nets_payment_id);

      const isPaid = payment.state === "Reserved" || payment.state === "Charged";

      if (isPaid) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("id", id);

        return NextResponse.json({ paid: true });
      }

      return NextResponse.json({ paid: false });
    } catch {
      return NextResponse.json({ error: "Failed to verify NETS payment" }, { status: 500 });
    }
  }

  // Vipps payment verification
  if (order.vipps_payment_reference) {
    try {
      const payment = await getPaymentStatus(order.vipps_payment_reference);

      const isPaid = payment.state === "AUTHORIZED" || payment.state === "CAPTURED";

      if (isPaid) {
        await supabaseAdmin
          .from("orders")
          .update({ payment_status: "paid", status: "confirmed" })
          .eq("id", id);

        return NextResponse.json({ paid: true });
      }

      return NextResponse.json({ paid: false });
    } catch {
      return NextResponse.json({ error: "Failed to verify Vipps payment" }, { status: 500 });
    }
  }

  return NextResponse.json({ paid: false });
}
