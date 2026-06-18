import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function Home() {
  const { data: restaurants, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, description, logo_url")
    .eq("status", "active")
    .order("name", { ascending: true });

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_center,#fed7aa_0,#fff8ef_42%,#fff8ef_100%)] px-6 py-10 sm:py-16">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10">
        <Logo variant="hero" />
        <section className="w-full rounded-[2rem] border border-orange-200/70 bg-white/80 p-5 shadow-2xl shadow-orange-950/10 backdrop-blur sm:p-8">
          <div className="mb-6 text-center">
            <h1 className="text-3xl font-black tracking-[-0.04em] text-foreground sm:text-5xl">
              Choose a restaurant
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-6 text-muted-foreground sm:text-base">
              Pick an active restaurant to browse the menu and place your pickup order.
            </p>
          </div>

          {error ? (
            <p className="rounded-2xl bg-destructive/10 p-4 text-center text-sm font-semibold text-destructive">
              We could not load restaurants right now.
            </p>
          ) : null}

          {!error && restaurants?.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {restaurants.map((restaurant) => (
                <Link
                  className="group flex min-h-44 flex-col justify-between rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-orange-950/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
                  href={`/${restaurant.slug}/order`}
                  key={restaurant.id}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary text-2xl font-black text-primary-foreground shadow-lg shadow-orange-950/15">
                      {restaurant.logo_url ? (
                        <Image
                          alt=""
                          className="size-full object-cover"
                          height={56}
                          src={restaurant.logo_url}
                          width={56}
                        />
                      ) : (
                        restaurant.name.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-xl font-black tracking-[-0.03em] text-foreground">
                        {restaurant.name}
                      </h2>
                      <p className="mt-2 line-clamp-3 text-sm font-semibold leading-6 text-muted-foreground">
                        {restaurant.description ?? "Order fresh pickup favorites."}
                      </p>
                    </div>
                  </div>
                  <span className="mt-6 text-sm font-black text-primary transition group-hover:translate-x-1">
                    View menu
                  </span>
                </Link>
              ))}
            </div>
          ) : null}

          {!error && !restaurants?.length ? (
            <p className="rounded-2xl bg-orange-50 p-6 text-center text-sm font-semibold text-muted-foreground">
              No restaurants are accepting orders yet.
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}
