"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  CircleCheckBig,
  Clock,
  CookingPot,
  Download,
  LoaderCircle,
  Package,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { writeStoredCart } from "@/components/order-menu/storage";
import { supabase } from "@/lib/supabase";
import { BRAND_NAME } from "@/lib/brand";
import { TranslationProvider, useTranslations } from "@/components/order-menu/locale-context";
import type { Messages } from "@/lib/dictionaries";

const UNPAID_TIMEOUT_MS = 30_000;

export type OrderData = {
  id: string;
  order_code: string;
  status: string;
  payment_status: string;
  subtotal: number;
  customer_notes: string | null;
  created_at: string;
  location_id: string | null;
  locations: { name: string } | null;
};

export type OrderItemData = {
  id: string;
  menu_item_id: string;
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
  customizations?: {
    removedIngredients?: string[];
    addOns?: Array<{ id: string; name: string; price: number }>;
    drinks?: Array<{ id: string; name: string; price: number }>;
  };
};

const statusSteps = ["pending", "confirmed", "preparing", "ready_for_pickup", "picked_up"] as const;

const statusIcons: Record<string, typeof CheckCircle2> = {
  pending: Clock,
  confirmed: CheckCircle2,
  preparing: CookingPot,
  ready_for_pickup: Package,
  picked_up: CircleCheckBig,
  completed: CircleCheckBig,
  cancelled: XCircle,
};

function OrderStatusInner({
  orderId,
  initialOrder,
  initialItems,
}: {
  orderId: string;
  initialOrder: OrderData;
  initialItems: OrderItemData[];
}) {
  const t = useTranslations();
  const [order, setOrder] = useState<OrderData>(initialOrder);
  const [paymentTimedOut, setPaymentTimedOut] = useState(false);
  const hasClearedCart = useRef(false);
  const unpaidTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const clearUnpaidTimer = useCallback(() => {
    if (unpaidTimer.current) {
      clearTimeout(unpaidTimer.current);
      unpaidTimer.current = null;
    }
  }, []);

  const verifyPayment = useCallback(async () => {
    try {
      const res = await fetch(`/api/orders/${orderId}/verify-payment`);
      const data = await res.json();
      return data as { paid: boolean };
    } catch {
      return { paid: false };
    }
  }, [orderId]);

  useEffect(() => {
    if (
      !hasClearedCart.current &&
      ["confirmed", "preparing", "ready_for_pickup", "picked_up", "completed"].includes(
        initialOrder.status,
      )
    ) {
      writeStoredCart([]);
      hasClearedCart.current = true;
    }

    if (initialOrder.payment_status === "unpaid") {
      unpaidTimer.current = setTimeout(async () => {
        if (!isMounted.current) return;

        const { paid } = await verifyPayment();

        if (!isMounted.current) return;

        if (paid) {
          clearUnpaidTimer();
          setOrder((prev) => ({
            ...prev,
            payment_status: "paid",
            status: "confirmed",
          }));
          writeStoredCart([]);
          hasClearedCart.current = true;
        } else {
          setPaymentTimedOut(true);
        }
      }, UNPAID_TIMEOUT_MS);
    }

    return () => {
      isMounted.current = false;
      clearUnpaidTimer();
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("order-status")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const updated = payload.new as OrderData;
          setOrder((prev) => ({ ...prev, ...updated }));

          if (updated.payment_status !== "unpaid") {
            clearUnpaidTimer();
          }

          if (
            !hasClearedCart.current &&
            ["confirmed", "preparing", "ready_for_pickup", "picked_up", "completed"].includes(
              updated.status,
            )
          ) {
            writeStoredCart([]);
            hasClearedCart.current = true;
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId, clearUnpaidTimer]);

  const isUnpaidPaying = order.payment_status === "unpaid" && !paymentTimedOut;
  const currentStepIndex = statusSteps.indexOf(order.status as (typeof statusSteps)[number]);
  const isCancelled = order.status === "cancelled";
  const isCompleted = order.status === "completed";
  const StatusIcon = statusIcons[order.status] ?? Clock;

  function handleRepeatOrder() {
    const cartItems = initialItems
      .filter((item) => item.menu_item_id)
      .map((item) => ({
        drinkIds: item.customizations?.drinks?.map((d) => d.id) ?? [],
        extraIds: item.customizations?.addOns?.map((a) => a.id) ?? [],
        itemId: item.menu_item_id,
        quantity: item.quantity,
        removedIngredientNames: item.customizations?.removedIngredients ?? [],
      }));

    try {
      window.localStorage.setItem(
        "food-app:cart:v1",
        JSON.stringify({ items: cartItems, version: 1 }),
      );

      if (order.location_id) {
        window.localStorage.setItem(
          "food-app:selected-location:v1",
          JSON.stringify({ id: order.location_id, version: 1 }),
        );
      }
    } catch {
      // Ignore storage failures
    }

    window.localStorage.setItem("food-app:open-cart", "true");
    window.location.href = "/order";
  }

  function downloadReceipt() {
    const date = new Date(order.created_at);
    const dateStr = new Intl.DateTimeFormat("nb-NO", {
      dateStyle: "long",
      timeStyle: "short",
    }).format(date);

    function itemCustomizations(item: OrderItemData) {
      const parts: string[] = [];
      if (item.customizations?.removedIngredients?.length) {
        parts.push(`No ${item.customizations.removedIngredients.join(", ")}`);
      }
      if (item.customizations?.addOns?.length) {
        parts.push(`+ ${item.customizations.addOns.map((a) => a.name).join(", ")}`);
      }
      if (item.customizations?.drinks?.length) {
        parts.push(`Drink: ${item.customizations.drinks.map((d) => d.name).join(", ")}`);
      }
      return parts.length ? ` — ${parts.join("; ")}` : "";
    }

    const itemRows = initialItems
      .map(
        (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;">
            <span style="color:#6b7280;">${item.quantity}x</span> ${item.item_name}${itemCustomizations(item)}
          </td>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:14px;text-align:right;font-weight:600;">
            ${item.total} kr
          </td>
        </tr>`,
      )
      .join("");

    const html = `<!DOCTYPE html>
<html lang="nb">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt #${order.order_code}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 32px 24px; color: #111; }
    .header { text-align: center; margin-bottom: 32px; }
    .header h1 { font-size: 22px; margin: 0 0 4px; }
    .header p { margin: 0; color: #6b7280; font-size: 14px; }
    .divider { border: none; border-top: 2px solid #111; margin: 24px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row td { padding: 12px 0; font-size: 16px; font-weight: 700; }
    .footer { text-align: center; margin-top: 32px; color: #6b7280; font-size: 13px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${Array.isArray(order.locations) ? order.locations[0]?.name : (order.locations?.name ?? BRAND_NAME)}</h1>
    <p>Receipt</p>
    <p>${dateStr}</p>
    <p style="font-size:12px;color:#9ca3af;margin-top:4px;">#${order.order_code}</p>
  </div>
  <hr class="divider">
  <table>
    <tbody>${itemRows}</tbody>
  </table>
  <hr class="divider">
  <table>
    <tr class="total-row">
      <td>Total</td>
      <td style="text-align:right;">${order.subtotal} kr</td>
    </tr>
  </table>
  <div class="footer">
    <p>Thank you for your order!</p>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${order.order_code}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-lg px-4">
        <Link
          aria-label={t("common.back")}
          className="-ml-2 flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/orders"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Link>
        <h1 className="pt-4 text-xl font-black tracking-tight">{t("order.title")}</h1>

        {paymentTimedOut ? (
          <div className="flex flex-col items-center gap-3 pt-8 text-center">
            <XCircle className="size-10 text-destructive" aria-hidden="true" />
            <div>
              <p className="text-lg font-bold">{t("order.payment_failed")}</p>
              <p className="pt-1 text-sm text-muted-foreground">{t("order.payment_failed_note")}</p>
            </div>
            <Link
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-md bg-primary px-6 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              href="/order"
            >
              {t("order.back_to_menu")}
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 pt-6">
              {isUnpaidPaying ? (
                <LoaderCircle className="size-8 animate-spin text-primary" aria-hidden="true" />
              ) : (
                <StatusIcon
                  className={`size-8 ${
                    isCancelled
                      ? "text-destructive"
                      : isCompleted
                        ? "text-green-600"
                        : "text-primary"
                  }`}
                  aria-hidden="true"
                />
              )}
              <div>
                <p className="text-lg font-bold">
                  {isUnpaidPaying ? t("order.payment_pending") : t(`order.status.${order.status}`)}
                </p>
                {!isUnpaidPaying ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      {(Array.isArray(order.locations) ? order.locations[0] : order.locations)
                        ?.name ?? t("order.unknown_location")}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground/60">
                      #{order.order_code}
                    </p>
                  </>
                ) : null}
              </div>
            </div>

            {isUnpaidPaying ? null : !isCancelled && !isCompleted ? (
              <div className="pt-4">
                {statusSteps.map((step, index) => {
                  const isActive = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = statusIcons[step];

                  return (
                    <div className="flex gap-3" key={step}>
                      <div className="flex flex-col items-center">
                        <div
                          className={`flex size-8 items-center justify-center rounded-full ${
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted text-muted-foreground"
                          } ${isCurrent && step !== "picked_up" ? "animate-pulse ring-2 ring-primary ring-offset-2" : ""}`}
                        >
                          <StepIcon className="size-4" aria-hidden="true" />
                        </div>
                        {index < statusSteps.length - 1 ? (
                          <div
                            className={`mt-0.5 h-8 w-0.5 ${
                              isActive && index < currentStepIndex ? "bg-primary" : "bg-muted"
                            }`}
                          />
                        ) : null}
                      </div>
                      <div className="self-start">
                        <p
                          className={`py-1.5 text-sm font-semibold ${
                            isActive ? "text-foreground" : "text-muted-foreground"
                          }`}
                        >
                          {t(`order.status.${step}`)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : null}

            {isCancelled ? (
              <p className="pt-4 text-sm text-muted-foreground">{t("order.cancelled_note")}</p>
            ) : null}

            {isCompleted ? (
              <p className="pt-4 text-sm text-muted-foreground">{t("order.completed_note")}</p>
            ) : null}

            {!paymentTimedOut && initialItems.length > 0 ? (
              <div className="border-t border-border mt-6 pt-4">
                <h2 className="mb-4 text-sm font-bold tracking-tight">{t("order.items")}</h2>
                <div className="space-y-3">
                  {initialItems.map((item) => (
                    <div className="text-sm" key={item.id}>
                      <div className="flex items-center justify-between gap-4">
                        <span className="min-w-0 truncate font-medium">
                          <span className="text-muted-foreground">{item.quantity}x</span>{" "}
                          {item.item_name}
                        </span>
                        <span className="shrink-0 font-semibold">{item.total} kr</span>
                      </div>
                      {item.customizations && (
                        <div className="ml-5 mt-0.5 space-y-0.5 text-xs text-muted-foreground">
                          {item.customizations.removedIngredients?.length ? (
                            <p>No {item.customizations.removedIngredients.join(", ")}</p>
                          ) : null}
                          {item.customizations.addOns?.length ? (
                            <p>+ {item.customizations.addOns.map((a) => a.name).join(", ")}</p>
                          ) : null}
                          {item.customizations.drinks?.length ? (
                            <p>Drink: {item.customizations.drinks.map((d) => d.name).join(", ")}</p>
                          ) : null}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between gap-4 border-t border-border pt-4 text-sm font-bold">
                  <span>{t("common.total")}</span>
                  <span>{order.subtotal} kr</span>
                </div>
              </div>
            ) : null}

            {!paymentTimedOut ? (
              <div className="flex flex-col items-center gap-4 pb-8 pt-6">
                {isCompleted ? (
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={handleRepeatOrder}
                    type="button"
                  >
                    {t("order.repeat_order")}
                  </button>
                ) : null}
                {!isUnpaidPaying ? (
                  <button
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-md border border-border bg-white text-sm font-bold text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={downloadReceipt}
                    type="button"
                  >
                    <Download className="size-4" aria-hidden="true" />
                    {t("order.download_receipt")}
                  </button>
                ) : null}
                <Link
                  className="text-sm font-medium text-primary underline underline-offset-4"
                  href="/order"
                >
                  {t("order.place_another")}
                </Link>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

export function OrderStatus({
  orderId,
  initialOrder,
  initialItems,
  locale,
  messages,
}: {
  orderId: string;
  initialOrder: OrderData;
  initialItems: OrderItemData[];
  locale: string;
  messages: Messages;
}) {
  return (
    <TranslationProvider locale={locale} messages={messages}>
      <OrderStatusInner orderId={orderId} initialOrder={initialOrder} initialItems={initialItems} />
    </TranslationProvider>
  );
}
