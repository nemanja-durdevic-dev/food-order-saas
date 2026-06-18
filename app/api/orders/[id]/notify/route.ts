import { type NextRequest, NextResponse } from "next/server";
import { twilioClient, twilioPhoneNumber } from "@/lib/twilio";
import { BRAND_NAME } from "@/lib/brand";
import { supabase } from "@/lib/supabase";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

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

  const { data: order, error: orderError } = await supabaseAdmin
    .from("orders")
    .select("user_id, order_code, location_id")
    .eq("id", id)
    .single();

  if (orderError || !order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const { data: location } = await supabaseAdmin
    .from("locations")
    .select("name")
    .eq("id", order.location_id)
    .single();

  const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(
    order.user_id,
  );

  if (userError || !userData?.user?.phone) {
    return NextResponse.json({ error: "User phone not found" }, { status: 400 });
  }

  if (!twilioClient) {
    return NextResponse.json({ error: "Twilio not configured" }, { status: 500 });
  }

  const { origin } = await request.json().catch(() => ({ origin: "" }));
  const locationName = location?.name ?? BRAND_NAME;
  const statusUrl = origin ? `${origin}/order/${id}` : "";
  const message = `${BRAND_NAME}: Bestillingen din ${order.order_code} er klar for henting hos ${locationName}!${statusUrl ? `\n\nSe status: ${statusUrl}` : ""}`;

  let toPhone = userData.user.phone;
  if (!toPhone.startsWith("+")) {
    toPhone = `+${toPhone}`;
  }

  try {
    await twilioClient.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: toPhone,
    });

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("Twilio error:", err);
    return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 });
  }
}
