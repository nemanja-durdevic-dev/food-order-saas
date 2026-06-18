import { type NextRequest, NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-admin";

type VippsWebhookPayload = {
  msn: string;
  reference: string;
  pspReference: string;
  name: string;
  amount: { currency: string; value: number };
  timestamp: string;
  idempotencyKey?: string;
  success: boolean;
};

export async function POST(request: NextRequest) {
  let body: VippsWebhookPayload;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.reference || !body.name) {
    return NextResponse.json({ error: "Missing reference or name" }, { status: 400 });
  }

  const reference = body.reference;

  if (body.name === "AUTHORIZED" && body.success) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "paid", status: "confirmed" })
      .eq("id", reference);
  } else if (
    (body.name === "ABORTED" || body.name === "EXPIRED" || body.name === "CANCELLED") &&
    body.success
  ) {
    await supabaseAdmin
      .from("orders")
      .update({ payment_status: "failed", status: "cancelled" })
      .eq("id", reference);
  }

  return NextResponse.json({ received: true });
}
