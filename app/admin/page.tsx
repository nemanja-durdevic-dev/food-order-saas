import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

import { AdminLoginForm } from "./admin-login-form";
import { signOut, updateStripeSettings } from "./actions";

type Props = {
  searchParams?: Promise<{ updated?: string }>;
};

export const dynamic = "force-dynamic";

export default async function AdminPage({ searchParams }: Props) {
  const [resolvedSearchParams, supabase] = await Promise.all([
    searchParams ?? Promise.resolve<{ updated?: string }>({}),
    createClient(),
  ]);
  const { updated } = resolvedSearchParams;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <AdminLoginForm />;
  }

  const { data: membership, error: membershipError } = await supabase
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .eq("role", "owner")
    .limit(1)
    .maybeSingle();

  if (!membership) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">No restaurant access</h1>
          <p className="text-sm text-muted-foreground">Add this user to restaurant_members.</p>
          <div className="space-y-1 border-l border-border pl-4 text-xs text-muted-foreground">
            <p>Signed-in email: {user.email ?? "No email"}</p>
            <p className="break-all">Signed-in user ID: {user.id}</p>
            {membershipError ? (
              <p className="mt-2 text-destructive">Lookup error: {membershipError.message}</p>
            ) : null}
          </div>
          <form action={signOut}>
            <button className="border border-border px-4 py-2 text-sm font-medium" type="submit">
              Sign out
            </button>
          </form>
        </section>
      </main>
    );
  }

  const { data: restaurant, error: restaurantError } = await supabaseAdmin
    .from("restaurants")
    .select("id, name, slug, stripe_account_id, payments_enabled")
    .eq("id", membership.restaurant_id)
    .maybeSingle();

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-xl px-6 py-12">
        <section className="space-y-4">
          <h1 className="text-2xl font-semibold">Restaurant not found</h1>
          <p className="text-sm text-muted-foreground">
            The linked restaurant could not be loaded.
          </p>
          <div className="space-y-1 border-l border-border pl-4 text-xs text-muted-foreground">
            <p className="break-all">Membership restaurant ID: {membership.restaurant_id}</p>
            {restaurantError ? (
              <p className="mt-2 text-destructive">Lookup error: {restaurantError.message}</p>
            ) : null}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <div>
        <header className="mb-10 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">{restaurant.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">/{restaurant.slug}/order</p>
          </div>
          <form action={signOut}>
            <button className="border border-border px-4 py-2 text-sm font-medium" type="submit">
              Sign out
            </button>
          </form>
        </header>

        {updated ? (
          <p className="mb-6 border-l border-green-700 pl-4 text-sm text-green-700">
            Stripe payment settings saved.
          </p>
        ) : null}

        <section>
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Stripe Connect</h2>
          </div>

          <form action={updateStripeSettings} className="space-y-5">
            <input name="restaurantId" type="hidden" value={restaurant.id} />
            <div>
              <label className="text-sm font-medium" htmlFor="stripeAccountId">
                Stripe connected account ID
              </label>
              <input
                className="mt-2 h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                defaultValue={restaurant.stripe_account_id ?? ""}
                id="stripeAccountId"
                name="stripeAccountId"
                placeholder="acct_..."
                type="text"
              />
            </div>

            <label className="flex items-start gap-3 border border-border p-4">
              <input
                className="mt-1 size-4"
                defaultChecked={restaurant.payments_enabled}
                name="paymentsEnabled"
                type="checkbox"
                value="true"
              />
              <span>
                <span className="block text-sm font-medium">Enable online payments</span>
              </span>
            </label>

            <button
              className="h-11 bg-foreground px-5 text-sm font-medium text-background"
              type="submit"
            >
              Save payment settings
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
