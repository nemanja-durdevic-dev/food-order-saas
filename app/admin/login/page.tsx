import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase-server";
import { AdminLoginForm } from "../admin-login-form";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AdminLoginForm />;
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("id")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/");
  }

  redirect("/admin");
}
