"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/admin");
}

export async function updateStripeSettings(formData: FormData) {
  const restaurantId = String(formData.get("restaurantId") ?? "");
  const stripeAccountId = String(formData.get("stripeAccountId") ?? "").trim() || null;
  const paymentsEnabled = formData.get("paymentsEnabled") === "true";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin");
  }

  const { data: membership } = await supabaseAdmin
    .from("restaurant_members")
    .select("id")
    .eq("restaurant_id", restaurantId)
    .eq("user_id", user.id)
    .eq("role", "owner")
    .maybeSingle();

  if (!membership) {
    throw new Error("You do not have access to update this restaurant.");
  }

  const { error } = await supabaseAdmin
    .from("restaurants")
    .update({
      payments_enabled: paymentsEnabled,
      stripe_account_id: stripeAccountId,
    })
    .eq("id", restaurantId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin");
  redirect("/admin?updated=1");
}
