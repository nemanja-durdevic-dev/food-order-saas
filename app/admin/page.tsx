import { createClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase-admin";

import { AdminLoginForm } from "./admin-login-form";
import { signOut, toggleLocationStatus, updateStripeSettings } from "./actions";

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

  const [{ data: restaurant, error: restaurantError }, { data: locations }] = await Promise.all([
    supabaseAdmin
      .from("restaurants")
      .select("id, name, slug, stripe_account_id, payments_enabled")
      .eq("id", membership.restaurant_id)
      .maybeSingle(),
    supabaseAdmin
      .from("locations")
      .select("id, name, is_open")
      .eq("restaurant_id", membership.restaurant_id)
      .order("name", { ascending: true }),
  ]);

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

        <section className="mb-12">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Locations</h2>
          </div>
          <div className="space-y-3">
            {(locations ?? []).map((location) => (
              <form
                key={location.id}
                action={toggleLocationStatus}
                className="flex items-center justify-between rounded-md border border-border p-4"
              >
                <div>
                  <p className="text-sm font-medium">{location.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {location.is_open ? "Open for orders" : "Closed"}
                  </p>
                </div>
                <input name="locationId" type="hidden" value={location.id} />
                <input name="restaurantId" type="hidden" value={restaurant.id} />
                <button
                  className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors ${
                    location.is_open ? "bg-green-600" : "bg-gray-300"
                  }`}
                  name="is_open"
                  type="submit"
                  value={location.is_open ? "false" : "true"}
                >
                  <span
                    className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                      location.is_open ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </form>
            ))}
          </div>
        </section>

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
