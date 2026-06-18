<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:anchored-summary -->

# Session Summary: Adding Menu Item Images

## Goal

Map direct Unsplash CDN image URLs to all 24 menu items in the Supabase database and update `seed.sql` so items show appetizing photos in the food app.

## Progress

### Done

- Found project structure: Next.js 14 app with Supabase, i18n (no/sv/en/da), component-based order menu.
- Identified the 24 actual DB menu items from `seed.sql` (Burgers: 4, Chicken: 3, Bowls: 3, Sides: 4, Drinks: 4, Desserts: 3, Kids: 3).
- Discovered previous session used different drink names (Coca‑Cola, Sprite, Fanta Orange, Still Water) that don't match the DB (Cola, Cola Zero, House Lemonade, Sparkling Water).
- Verified 19 of the original Unsplash photo IDs via CDN fetch (200 status).
- Found that 3 original IDs returned 404 (Sprite/`1596803244618-715b0c50a7d7`, Green Falafel Bowl/`1596797038530-2c107a2aa672`, Mozzarella Sticks/`1531749668029-2db88e4276d1`).
- Found replacements for 404 IDs and missing items:
  - Green Falafel Bowl → `1490645935967-10de6ba17061`
  - Mozzarella Sticks → `1565299624946-b28f40a0ae38`
  - House Lemonade → `1513558003720-343f3a99d97b` (extracted via download redirect)
  - Vanilla Milkshake → `1653122025451-ec76a73f8a08` (from search result)
  - Cola Zero → reuses `1554866585-cd94860890b7` (same as Cola)
- Updated all 24 `image_url` values in `supabase/seed.sql` with verified Working Unsplash CDN URLs.
- Standardised on `https://images.unsplash.com/photo-{ID}?w=600&h=600&fit=crop` format.

### Image URL Mapping (all verified 200 OK)

| Item                   | Photo ID                     |
| ---------------------- | ---------------------------- |
| Classic Burger         | `1568901346375-23c9450c58cd` |
| Smash Double           | `1551782450-a2132b4ba21d`    |
| BBQ Bacon Burger       | `1594212699903-ec8a3eca50f5` |
| Veggie Halloumi Burger | `1586816001966-79b736744398` |
| Crispy Chicken Burger  | `1603064752734-4c48eff53d05` |
| Hot Honey Chicken      | `1562967914-608f82629710`    |
| Chicken Tenders        | `1562967916-eb82221dfb92`    |
| Loaded Beef Bowl       | `1546069901-ba9599a7e63c`    |
| Crispy Chicken Bowl    | `1512621776951-a57141f2eefd` |
| Green Falafel Bowl     | `1490645935967-10de6ba17061` |
| Fries                  | `1573080496219-bb080dd4f877` |
| Sweet Potato Fries     | `1543352634-a1c51d9f1fa7`    |
| Onion Rings            | `1639024471283-03518883512d` |
| Mozzarella Sticks      | `1565299624946-b28f40a0ae38` |
| Cola                   | `1554866585-cd94860890b7`    |
| Cola Zero              | `1554866585-cd94860890b7`    |
| House Lemonade         | `1513558003720-343f3a99d97b` |
| Sparkling Water        | `1523362628745-0c100150b504` |
| Chocolate Brownie      | `1606313564200-e75d5e30476c` |
| Cinnamon Churros       | `1509365465985-25d11c17e812` |
| Vanilla Milkshake      | `1653122025451-ec76a73f8a08` |
| Kids Burger Meal       | `1572802419224-296b0aeee0d9` |
| Kids Tenders Meal      | `1615361200141-f45040f367be` |
| Kids Fries             | `1586190848861-99aa4a171e90` |

<!-- END:anchored-summary -->

<!-- BEGIN:anchored-summary -->

# Session Summary: Refactor Monolithic `order-menu.tsx`

## Goal

Break down the 1429-line `order-menu.tsx` component into manageable pieces — extract custom hooks for concerns, add `"use client"` to leaf components, and add a `loading.tsx` for the `/order` route.

## Changes

### Extracted Hooks

- **`useLocation`** (`components/order-menu/use-location.ts`) — location selection, localStorage hydration/persistence, category filtering by location availability.
- **`useAuth`** (`components/order-menu/use-auth.ts`) — Supabase auth subscription, `userPhone`/`isAuthLoading` state.
- **`useCart`** (`components/order-menu/use-cart.ts`) — cart CRUD (add/update/decrement/increment/clear), localStorage persistence with versioned schema, item detail customization state (`selectedItem`, `selectedDrinkIds`, `selectedExtraIds`, etc.), computed prices, drink options derivation from categories.

### Refactored `order-menu.tsx`

- Reduced from 1429 → ~905 lines.
- Dialog state (open/close + animation) kept in the main component since it's tightly coupled to UI rendering.
- Search state (`searchQuery`, `searchResults`, `filteredCategories`) kept in the main component.
- Scroll spy (IntersectionObserver) and category nav scroll logic kept in the main component.
- `handleSelectLocation` orchestrates both `useLocation.selectLocation()` and `useCart.clearCart()` + dialog closes.

### Added `"use client"` Directives

- `auth-dialog.tsx` — was missing directive, uses hooks.
- `user-dialog.tsx` — was missing directive, uses hooks.
- `search-dialog.tsx` — was missing directive, uses hooks via `useTranslations`.
- `item-details-dialog.tsx` — was missing directive, uses hooks.

### Added `loading.tsx`

- `app/order/loading.tsx` — skeleton UI matching the existing `OrderContentSkeleton` style, shown while the 7 Supabase queries resolve on the server.

### Removed Unused Import

- `useCallback` from `use-cart.ts` (ESLint warning fix).

### File sizes after refactor

| File              | Lines |
| ----------------- | ----- |
| `order-menu.tsx`  | ~905  |
| `use-cart.ts`     | ~310  |
| `use-location.ts` | ~150  |
| `use-auth.ts`     | ~35   |
| `loading.tsx`     | ~70   |

<!-- END:anchored-summary -->

<!-- BEGIN:anchored-summary -->

# Session Summary: Staff Platform + Payment + SMS + Vipps

## Goal

- Staff platform (kitchen dashboard + admin viewer) with real-time order updates.
- Customer order flow with daily sequential order codes (`Z-{n}`), Vipps + Stripe payment, Twilio SMS notifications, SSR-optimized pages.
- Staff and admin users created only via Supabase dashboard (no app sign-up).
- Staff scoped to a single location; admin read-only multi-location view.
- Customer authentication via phone OTP.

## Progress

### Done

- `proxy.ts` (Next.js 16 middleware) guards `/staff`, `/admin`, `/login`, `/order/:path*`.
- Login page (`/login`) as server component + client `login-form.tsx`.
- Staff layout + kitchen dashboard with Realtime subscription, status buttons, 30s timer tick, loading spinners on status advance.
- Admin layout + read-only order table with location filter + Realtime.
- Migrations 012–015: Realtime enablement, `staff` table, `daily_order_counters`, `vipps_payment_reference` column.
- Migrated from `lib/supabase.ts` → `lib/supabase-server.ts` + `lib/supabase-browser.ts`; SSR-first architecture.
- Staff page reads `location_id` from `staff` table (not JWT claims).
- `/orders` and `/order/{id}/status` are SSR-first (server auth + data, client Realtime only).
- Order status page: server-side auth, Realtime merge (not replace) preserving SSR `locations`.
- Cart panel: no default payment method; error scroll + red border; 15s fetch timeout.
- Checkout route uses `increment_order_number()` RPC for `Z-{n}` codes.
- Unpaid order timeout: 30s → verify with Stripe/Vipps → confirm or delete.
- Twilio SMS: `lib/twilio.ts`, `POST /api/orders/[id]/notify` — brand name, order code, status link.
- Brand config: `lib/brand.ts` exports `BRAND_NAME` from `NEXT_PUBLIC_BRAND_NAME` (default "FireBite").
- **Vipps direct payment**: `lib/vipps.ts` (ePayment API + `getPaymentStatus` + `forceApprovePayment` for testing), `POST /api/checkout-vipps`, `POST /api/webhook/vipps`.
- **Vipps fixes**: base URL `https://apitest.vipps.no` (was `test.api.vipps.no`), token path `/accessToken/get` (camelCase), auth via headers (not Basic auth), `paymentMethod.type: "WALLET"` (not `"Vipps"`), added `userFlow`, `paymentDescription`, `customer.phoneNumber`, system headers.
- **Verify-payment** handles both Stripe and Vipps (`vipps_payment_reference`).
- Vipps webhook registered via API (ID: `c35334e3-...`), listening for `authorized`/`aborted`/`expired` events.
- `.env.example` cleaned up — single set of Vipps vars.

### Current State

- Vipps payment flow tested and working (token + create payment + webhook).
- During local dev, `verify-payment` polling serves as fallback until webhook arrives.
- Vipps `forceApprovePayment` helper available for testing without Vipps app.

### Key Decisions

- `public.staff` table over JWT claims for RLS — `auth.jwt()` not fully supported by Realtime RLS evaluator.
- Same-domain routes: `/staff`, `/admin`, `/login`, `/order`.
- Daily atomic counter via Postgres upsert — human-readable `Z-{n}`, no race conditions.
- Vipps as direct payment provider (separate from Stripe).
- Webhook registered via API (Vipps has no web UI for webhooks).

### Relevant Files

- `proxy.ts`, `lib/supabase-server.ts`, `lib/supabase-browser.ts`, `lib/supabase.ts`
- `lib/stripe.ts`, `lib/twilio.ts`, `lib/vipps.ts`, `lib/brand.ts`
- `app/api/checkout/route.ts`, `app/api/checkout-vipps/route.ts`
- `app/api/webhook/stripe/route.ts`, `app/api/webhook/vipps/route.ts`
- `app/api/orders/[id]/verify-payment/route.ts`, `app/api/orders/[id]/notify/route.ts`
- `app/staff/page.tsx` + `kitchen-dashboard.tsx`
- `app/order/[id]/status/page.tsx` + `components/order/order-status.tsx`
- `components/order-menu/cart-panel.tsx`
- `supabase/migrations/012–015`

<!-- END:anchored-summary -->
