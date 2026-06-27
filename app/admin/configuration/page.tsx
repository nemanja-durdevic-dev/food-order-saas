import Link from "next/link";
import { redirect } from "next/navigation";

import { supabaseAdmin } from "@/lib/supabase-admin";
import { createClient } from "@/lib/supabase-server";

type CheckStatus = "complete" | "missing" | "warning";

type ConfigurationCheck = {
  label: string;
  description: string;
  required: boolean;
  status: CheckStatus;
};

type ConfigurationSection = {
  title: string;
  checks: ConfigurationCheck[];
};

function hasValue(value: unknown) {
  return typeof value === "string" ? value.trim().length > 0 : Boolean(value);
}

function requiredCheck(label: string, description: string, complete: boolean): ConfigurationCheck {
  return {
    label,
    description,
    required: true,
    status: complete ? "complete" : "missing",
  };
}

function recommendedCheck(
  label: string,
  description: string,
  complete: boolean,
): ConfigurationCheck {
  return {
    label,
    description,
    required: false,
    status: complete ? "complete" : "warning",
  };
}

function getStatusLabel(status: CheckStatus) {
  if (status === "complete") return "Complete";
  if (status === "missing") return "Missing";
  return "Recommended";
}

function getStatusClass(status: CheckStatus) {
  if (status === "complete") return "border-green-200 bg-green-50 text-green-700";
  if (status === "missing") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default async function AdminConfigurationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: membership } = await supabase
    .from("restaurant_members")
    .select("restaurant_id, role")
    .eq("user_id", user.id)
    .in("role", ["admin", "owner"])
    .limit(1)
    .maybeSingle();

  if (!membership) {
    redirect("/");
  }

  const [restaurantResult, locationsResult, categoriesResult, menuItemsResult, membersResult] =
    await Promise.all([
      supabaseAdmin
        .from("restaurants")
        .select(
          "id, name, slug, description, logo_url, cover_image_url, brand_color, stripe_account_id, payments_enabled, status, contact_email, instagram_url, facebook_url, tiktok_url",
        )
        .eq("id", membership.restaurant_id)
        .maybeSingle(),
      supabaseAdmin
        .from("locations")
        .select("id, name, address, phone, is_open, opening_hours")
        .eq("restaurant_id", membership.restaurant_id),
      supabaseAdmin
        .from("categories")
        .select("id, name")
        .eq("restaurant_id", membership.restaurant_id),
      supabaseAdmin
        .from("menu_items")
        .select("id, name, price, image_url, is_available")
        .eq("restaurant_id", membership.restaurant_id),
      supabaseAdmin
        .from("restaurant_members")
        .select("id, role")
        .eq("restaurant_id", membership.restaurant_id)
        .in("role", ["admin", "owner"]),
    ]);

  const restaurant = restaurantResult.data;
  const restaurantError = restaurantResult.error;

  if (!restaurant) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
          href="/admin"
        >
          Back to admin
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">Restaurant not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The restaurant linked to your membership could not be loaded.
        </p>
        <div className="mt-4 space-y-1 border-l border-border pl-4 text-xs text-muted-foreground">
          <p className="break-all">Membership restaurant ID: {membership.restaurant_id}</p>
          {restaurantError ? (
            <p className="text-destructive">Lookup error: {restaurantError.message}</p>
          ) : null}
        </div>
      </main>
    );
  }

  const locations = locationsResult.data ?? [];
  const categories = categoriesResult.data ?? [];
  const menuItems = menuItemsResult.data ?? [];
  const members = membersResult.data ?? [];
  const locationIds = locations.map((location) => location.id);

  const { data: staff } = locationIds.length
    ? await supabaseAdmin
        .from("staff")
        .select("id, location_id, role")
        .in("location_id", locationIds)
        .eq("role", "staff")
    : { data: [] };

  const hasLocation = locations.length > 0;
  const hasOpenLocation = locations.some((location) => location.is_open);
  const hasLocationWithOpeningHours = locations.some((location) => location.opening_hours);
  const locationsHaveContactDetails =
    hasLocation &&
    locations.every((location) => hasValue(location.address) && hasValue(location.phone));
  const hasAvailableItem = menuItems.some((item) => item.is_available);
  const allItemsHaveImages =
    menuItems.length > 0 && menuItems.every((item) => hasValue(item.image_url));
  const allItemsHaveValidPrices =
    menuItems.length > 0 && menuItems.every((item) => Number(item.price) > 0);
  const hasSocialLink =
    hasValue(restaurant.instagram_url) ||
    hasValue(restaurant.facebook_url) ||
    hasValue(restaurant.tiktok_url);
  const stripeConfigured = restaurant.payments_enabled && hasValue(restaurant.stripe_account_id);
  const vippsConfigured = Boolean(
    process.env.VIPPS_CLIENT_ID &&
    process.env.VIPPS_CLIENT_SECRET &&
    process.env.VIPPS_SUBSCRIPTION_KEY &&
    process.env.VIPPS_MERCHANT_SERIAL,
  );
  const netsConfigured = Boolean(process.env.NETS_SECRET_KEY);
  const paymentProviderConfigured = stripeConfigured || vippsConfigured || netsConfigured;
  const assignedStaff = staff ?? [];

  const sections: ConfigurationSection[] = [
    {
      title: "Restaurant Profile",
      checks: [
        requiredCheck(
          "Restaurant is active",
          "Customers can only order from active restaurants.",
          restaurant.status === "active",
        ),
        requiredCheck(
          "Name is set",
          "The public restaurant name is configured.",
          hasValue(restaurant.name),
        ),
        requiredCheck(
          "Slug is set",
          "The ordering URL needs a restaurant slug.",
          hasValue(restaurant.slug),
        ),
        requiredCheck(
          "Description is set",
          "Customers see this when choosing a restaurant.",
          hasValue(restaurant.description),
        ),
        requiredCheck(
          "Contact email is set",
          "Customers and operators need a primary contact email.",
          hasValue(restaurant.contact_email),
        ),
        recommendedCheck(
          "Brand color is set",
          "A brand color keeps the public ordering flow consistent.",
          hasValue(restaurant.brand_color),
        ),
        recommendedCheck(
          "Logo or cover image is set",
          "Images make the restaurant page easier to recognize.",
          hasValue(restaurant.logo_url) || hasValue(restaurant.cover_image_url),
        ),
        recommendedCheck(
          "At least one social link is set",
          "Social links are useful but should not block ordering.",
          hasSocialLink,
        ),
      ],
    },
    {
      title: "Locations",
      checks: [
        requiredCheck(
          "At least one location exists",
          "Orders need a pickup location.",
          hasLocation,
        ),
        requiredCheck(
          "At least one location is open",
          "Customers need one active pickup option.",
          hasOpenLocation,
        ),
        requiredCheck(
          "Opening hours exist",
          "Ordering availability depends on location hours.",
          hasLocationWithOpeningHours,
        ),
        recommendedCheck(
          "All locations have address and phone",
          "Complete contact details reduce pickup confusion.",
          locationsHaveContactDetails,
        ),
      ],
    },
    {
      title: "Menu",
      checks: [
        requiredCheck(
          "At least one category exists",
          "Menu items should be grouped by category.",
          categories.length > 0,
        ),
        requiredCheck(
          "At least one menu item exists",
          "Customers need something to order.",
          menuItems.length > 0,
        ),
        requiredCheck(
          "At least one item is available",
          "Unavailable menus cannot accept online orders.",
          hasAvailableItem,
        ),
        requiredCheck(
          "Menu items have valid prices",
          "Prices must be greater than zero for checkout.",
          allItemsHaveValidPrices,
        ),
        recommendedCheck(
          "All menu items have images",
          "Images improve conversion but are not required.",
          allItemsHaveImages,
        ),
      ],
    },
    {
      title: "Payments",
      checks: [
        requiredCheck(
          "At least one payment provider is configured",
          "Online checkout needs Stripe, Vipps, or Nets configured.",
          paymentProviderConfigured,
        ),
        recommendedCheck(
          "Stripe Connect is ready",
          "Stripe requires payments to be enabled and an account ID.",
          stripeConfigured,
        ),
        recommendedCheck(
          "Vipps environment is ready",
          "Vipps requires all server-side Vipps credentials.",
          vippsConfigured,
        ),
        recommendedCheck(
          "Nets environment is ready",
          "Nets requires NETS_SECRET_KEY.",
          netsConfigured,
        ),
      ],
    },
    {
      title: "Access",
      checks: [
        requiredCheck(
          "Admin or owner exists",
          "At least one restaurant member can manage this restaurant.",
          members.length > 0,
        ),
        recommendedCheck(
          "Staff user is assigned",
          "Kitchen users should be assigned to pickup locations.",
          assignedStaff.length > 0,
        ),
      ],
    },
  ];

  const allChecks = sections.flatMap((section) => section.checks);
  const requiredChecks = allChecks.filter((check) => check.required);
  const completedChecks = allChecks.filter((check) => check.status === "complete");
  const missingRequiredChecks = requiredChecks.filter((check) => check.status !== "complete");
  const readyForOrders = missingRequiredChecks.length === 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
            href="/admin"
          >
            Back to admin
          </Link>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">Configuration Status</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {restaurant.name} has completed {completedChecks.length} of {allChecks.length} setup
            checks.
          </p>
        </div>
        <div
          className={`rounded-md border px-4 py-3 text-sm font-medium ${getStatusClass(readyForOrders ? "complete" : "missing")}`}
        >
          {readyForOrders ? "Ready for online orders" : "Not ready for online orders"}
        </div>
      </div>

      {!readyForOrders ? (
        <section className="mb-8 rounded-md border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-semibold text-red-900">Required before launch</h2>
          <ul className="mt-3 space-y-2 text-sm text-red-800">
            {missingRequiredChecks.map((check) => (
              <li key={check.label}>{check.label}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="space-y-6">
        {sections.map((section) => {
          const completeCount = section.checks.filter(
            (check) => check.status === "complete",
          ).length;

          return (
            <section className="rounded-md border border-border bg-card p-5" key={section.title}>
              <div className="mb-4 flex items-center justify-between gap-4">
                <h2 className="text-xl font-semibold">{section.title}</h2>
                <span className="text-sm text-muted-foreground">
                  {completeCount}/{section.checks.length} complete
                </span>
              </div>
              <div className="space-y-3">
                {section.checks.map((check) => (
                  <div
                    className="flex flex-col gap-3 rounded-md border border-border p-4 sm:flex-row sm:items-start sm:justify-between"
                    key={check.label}
                  >
                    <div>
                      <p className="text-sm font-medium">{check.label}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{check.description}</p>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${getStatusClass(check.status)}`}
                    >
                      {getStatusLabel(check.status)}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
