import { type NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

type NetsWebhookEvent = {
  event: string;
  paymentId: string;
  timestamp: string;
  data?: Record<string, unknown>;
};

export async function POST(request: NextRequest) {
  let event: NetsWebhookEvent;

  try {
    event = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentId = event.paymentId ?? event.data?.paymentId;

  if (!paymentId) {
    return NextResponse.json({ error: "Missing paymentId" }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("id, payment_status")
    .eq("nets_payment_id", paymentId)
    .maybeSingle();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.payment_status === "paid") {
    return NextResponse.json({ received: true });
  }

  const eventName = event.event ?? "";

  const isSuccessful =
    eventName.includes("reservation.created") || eventName.includes("charge.created");

  const isFailed = eventName.includes("reservation.failed") || eventName.includes("charge.failed");

  if (isSuccessful) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", order.id);
  } else if (isFailed) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", order.id);
  }

  return NextResponse.json({ received: true });
}
