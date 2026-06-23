# Security TODO

## HIGH — Price verification missing in checkout

**Files:** `app/api/checkout/route.ts`, `app/api/checkout-vipps/route.ts`, `app/api/staff/checkout/route.ts`

Client-sent `unitPrice`, `total`, and `subtotal` are used without DB lookup. A user can pay 1 kr for a 149 kr item.

**Fix:** Look up menu items from DB by `item.id`, verify `unitPrice` matches, verify `total === unitPrice * quantity`, verify `subtotal` matches sum of totals.

## HIGH — supabaseAdmin fallback exposes all orders

**File:** `app/order/[id]/page.tsx:22-36`

RLS query fails for non-owner → falls back to `supabaseAdmin` which bypasses RLS. Any authenticated user can view any order by UUID.

**Fix:** Remove the `supabaseAdmin` fallback. Return 404 when the user doesn't own the order.

## HIGH — Verify-payment endpoint has no auth

**File:** `app/api/orders/[id]/verify-payment/route.ts`

Unauthenticated GET. Anyone with an order UUID can poll payment status and trigger Stripe/Vipps API calls.

**Fix:** Add auth (bearer token) and verify the requesting user owns the order, or rate-limit.

## HIGH — Vipps webhook has no signature verification

**File:** `app/api/webhook/vipps/route.ts`

Unlike Stripe's webhook (which validates signatures), Vipps accepts any POST. Attacker who knows the URL can fake `AUTHORIZED` events.

**Fix:** Implement Vipps webhook HMAC/signature verification, or IP-allowlist Vipps ranges.

## LOW — No UPDATE RLS policy for menu_items

**File:** `supabase/migrations/001_initial_saas_schema.sql`

Missing UPDATE policy on `menu_items`. Toggle availability route may fail at runtime depending on RLS mode.
