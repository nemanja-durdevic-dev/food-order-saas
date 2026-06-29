"use client";

import { useId, useMemo, useState, type KeyboardEvent } from "react";
import { BadgePercent, ChevronDown, LogIn, Minus, Plus, ShoppingBasket, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useLocale, useTranslations } from "./locale-context";
import { localeToDateTimeFormat } from "./constants";
import { getMergedHoursForDate } from "./opening-hours";

import type { CartItem, HoursOverride, OpeningHour } from "./types";
import { formatPrice, getCartCustomizationLabels, getPriceValue } from "./utils";

type OrderTiming = "asap" | "preorder";

function getOrderTimingOptions(t: ReturnType<typeof useTranslations>) {
  return [
    {
      value: "asap" as OrderTiming,
      title: t("cart.asap"),
      description: t("cart.asap_time"),
    },
    {
      value: "preorder" as OrderTiming,
      title: t("cart.schedule"),
      description: t("cart.choose_datetime"),
    },
  ];
}

type CartPanelProps = {
  cartItems: CartItem[];
  cartSubtotal: number;
  currency: string;
  decrementCartItem: (itemId: string) => void;
  incrementCartItem: (itemId: string) => void;
  isLocationClosed: boolean;
  locationId: string;
  locationName: string;
  onClose?: () => void;
  onEditCartItem: (item: CartItem) => void;
  onOpenAuth: () => void;
  openingHours: OpeningHour[] | null;
  overrides: HoursOverride[] | null;
  titleId?: string;
  userEmail: string | null;
};

export function CartPanel({
  cartItems,
  cartSubtotal,
  currency,
  decrementCartItem,
  incrementCartItem,
  isLocationClosed,
  locationId,
  locationName,
  onClose,
  onEditCartItem,
  onOpenAuth,
  openingHours,
  overrides,
  titleId,
  userEmail,
}: CartPanelProps) {
  const t = useTranslations();
  const locale = useLocale();
  const orderTimingTitleId = useId();
  const preorderDialogTitleId = useId();
  const preorderTimeId = useId();
  const cartItemsSectionId = useId();
  const orderCommentId = useId();
  const promoCodeId = useId();
  const [orderTiming, setOrderTiming] = useState<OrderTiming>("asap");
  const [isPreorderOpen, setIsPreorderOpen] = useState(false);
  const [isPreorderClosing, setIsPreorderClosing] = useState(false);
  const [areCartItemsOpen, setAreCartItemsOpen] = useState(true);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isPromoCodeOpen, setIsPromoCodeOpen] = useState(false);
  const [orderComment, setOrderComment] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [preorderDate, setPreorderDate] = useState("");
  const [preorderTime, setPreorderTime] = useState("");

  const availableDays = useMemo(() => {
    const today = new Date(new Date().toDateString());
    const days: { dateValue: string; dayName: string; dayNumber: number }[] = [];
    for (let i = 0; i < 10; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateValue = date.toISOString().slice(0, 10);
      const { closed } = getMergedHoursForDate(dateValue, openingHours, overrides);
      if (closed) continue;
      days.push({
        dateValue,
        dayName: new Intl.DateTimeFormat("en", { weekday: "short" }).format(date),
        dayNumber: date.getDate(),
      });
    }
    return days;
  }, [openingHours, overrides]);

  const selectedDayHours = useMemo(() => {
    if (!preorderDate) return null;
    const { closed, open, close } = getMergedHoursForDate(preorderDate, openingHours, overrides);
    if (closed) return null;
    if (!open || !close) return null;
    return { open, close };
  }, [preorderDate, openingHours, overrides]);

  const preorderDescription =
    preorderDate && preorderTime
      ? `${formatDateLabel(preorderDate, locale)} ${preorderTime}`
      : t("cart.choose_datetime");
  const trimmedOrderComment = orderComment.trim();
  const trimmedPromoCode = promoCode.trim();

  function openPreorderDialog() {
    setIsPreorderOpen(true);
    setIsPreorderClosing(false);
    if (
      availableDays.length > 0 &&
      (!preorderDate || !availableDays.some((d) => d.dateValue === preorderDate))
    ) {
      setPreorderDate(availableDays[0].dateValue);
    }
  }

  function closePreorderDialog() {
    setIsPreorderClosing(true);
    setTimeout(() => {
      setIsPreorderOpen(false);
      setIsPreorderClosing(false);
    }, 300);
  }

  function selectOrderTiming(value: OrderTiming) {
    setOrderTiming(value);

    if (value === "preorder") {
      openPreorderDialog();
    }
  }

  function handleCheckout() {
    if (!userEmail) {
      onOpenAuth();
      return;
    }

    const orderItems = cartItems.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: item.quantity,
      unitPrice: getPriceValue(item.price),
      total: getPriceValue(item.price) * item.quantity,
      selectedOptions: item.selectedOptions,
    }));

    fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cartItems: orderItems,
        locationId,
        subtotal: cartSubtotal,
        orderTiming,
        preorderDate: preorderDate || undefined,
        preorderTime: preorderTime || undefined,
        customerNotes: trimmedOrderComment || undefined,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Checkout error:", data.error);
          return;
        }
        window.location.href = `/order/${data.order_id}/status`;
      })
      .catch((err) => {
        console.error("Checkout error:", err);
      });
  }

  function openCartItemFromKeyboard(event: KeyboardEvent<HTMLDivElement>, item: CartItem) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    onEditCartItem(item);
  }

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-white">
      {onClose ? (
        <div className="absolute inset-x-0 top-0 z-10 flex h-16 items-center justify-between bg-white px-4">
          <h2 className="text-lg font-bold tracking-tight" id={titleId}>
            {locationName}
          </h2>
          <Button
            aria-label={t("common.close")}
            className="size-10 rounded-full bg-white/85 backdrop-blur hover:bg-white"
            onClick={onClose}
            size="icon"
            type="button"
            variant="ghost"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <h2 className="px-3.5 pt-4 text-lg font-bold tracking-tight" id={titleId}>
          {locationName}
        </h2>
      )}
      <div
        className={`no-scrollbar relative flex-1 overflow-y-auto pb-4 ${onClose ? "pt-16" : "pt-4"}`}
      >
        {isLocationClosed ? <div className="absolute inset-0 z-10 bg-white/85" /> : null}
        <section className="px-3.5 pb-3" aria-labelledby={orderTimingTitleId}>
          <h3 className="mb-2 text-sm font-semibold tracking-tight" id={orderTimingTitleId}>
            {t("cart.when_question")}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {getOrderTimingOptions(t).map((option) => {
              const isSelected = option.value === orderTiming;

              return (
                <button
                  aria-pressed={isSelected}
                  className={`rounded-md border p-3 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    isSelected
                      ? "border-foreground bg-secondary shadow-sm"
                      : "border-border bg-white hover:border-foreground/40"
                  }`}
                  key={option.value}
                  onClick={() => selectOrderTiming(option.value)}
                  type="button"
                >
                  <span className="block text-xs font-semibold tracking-tight text-foreground">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                    {option.value === "preorder" ? preorderDescription : option.description}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
        <div className="space-y-4 px-3.5">
          {cartItems.length > 0 ? (
            <div className="overflow-hidden rounded-md border border-border bg-card">
              <button
                aria-controls={cartItemsSectionId}
                aria-expanded={areCartItemsOpen}
                className="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setAreCartItemsOpen((isOpen) => !isOpen)}
                type="button"
              >
                <span className="min-w-0">
                  <span className="block text-sm font-semibold tracking-tight">
                    {t("cart.your_order")}
                  </span>
                  <span className="mt-0.5 block text-xs font-medium text-muted-foreground">
                    {cartItems.length}{" "}
                    {cartItems.length === 1 ? t("common.item") : t("common.items")} ·{" "}
                    {formatPrice(cartSubtotal, currency)}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    areCartItemsOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {areCartItemsOpen ? (
                <div
                  className="space-y-3 border-t border-border bg-white py-2"
                  id={cartItemsSectionId}
                >
                  {cartItems.map((item) => {
                    const customizationLabels = getCartCustomizationLabels(item, t, currency);

                    return (
                      <div
                        aria-label={`Edit ${item.name}`}
                        className="cursor-pointer border-b border-border py-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 last:border-b-0"
                        key={item.cartKey}
                        onClick={() => onEditCartItem(item)}
                        onKeyDown={(event) => openCartItemFromKeyboard(event, item)}
                        role="button"
                        tabIndex={0}
                      >
                        <div className="px-4">
                          <div className="flex items-start gap-3">
                            <div className="min-w-0 flex-1">
                              <h3 className="truncate text-sm font-bold tracking-tight">
                                {item.name}
                              </h3>
                              {customizationLabels.length > 0 ? (
                                <ul className="mt-1 space-y-0.5 text-xs font-medium leading-4 text-muted-foreground">
                                  {customizationLabels.map((label) => (
                                    <li key={label}>{label}</li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                            {item.image_url ? (
                              <div className="relative size-12 shrink-0 overflow-hidden rounded-md bg-muted">
                                <Image
                                  alt=""
                                  className="object-cover"
                                  fill
                                  sizes="48px"
                                  src={item.image_url}
                                />
                              </div>
                            ) : (
                              <div className="grid size-12 shrink-0 place-items-center rounded-md bg-secondary px-1 text-center text-[7px] font-black uppercase leading-3 tracking-[0.08em] text-secondary-foreground/70">
                                Image
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 px-4">
                          <p className="text-sm font-bold">
                            {formatPrice(getPriceValue(item.price) * item.quantity, currency)}
                          </p>
                          <div
                            className="flex items-center rounded-md border border-border bg-white"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <Button
                              aria-label={`Decrease ${item.name} quantity`}
                              className="size-7 rounded-md"
                              onClick={(event) => {
                                event.stopPropagation();
                                decrementCartItem(item.cartKey);
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Minus className="size-4" aria-hidden="true" />
                            </Button>
                            <span className="min-w-5 text-center text-xs font-bold">
                              {item.quantity}
                            </span>
                            <Button
                              aria-label={`Increase ${item.name} quantity`}
                              className="size-7 rounded-md"
                              onClick={(event) => {
                                event.stopPropagation();
                                incrementCartItem(item.cartKey);
                              }}
                              size="icon"
                              type="button"
                              variant="ghost"
                            >
                              <Plus className="size-4" aria-hidden="true" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="p-6 text-center">
              <ShoppingBasket
                className="mx-auto size-10 text-muted-foreground"
                aria-hidden="true"
              />
              <p className="mt-4 text-lg font-black">{t("cart.empty")}</p>
            </div>
          )}

          <section
            className="overflow-hidden rounded-md border border-border bg-card"
            aria-labelledby="order-comment-title"
          >
            <button
              aria-controls={orderCommentId}
              aria-expanded={isCommentOpen}
              className="flex w-full cursor-pointer items-center justify-between gap-4 p-3 text-left transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              onClick={() => setIsCommentOpen((isOpen) => !isOpen)}
              type="button"
            >
              <span className="min-w-0">
                <span
                  className="block text-sm font-semibold tracking-tight"
                  id="order-comment-title"
                >
                  {t("cart.comment")}
                </span>
                {!isCommentOpen && trimmedOrderComment ? (
                  <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
                    {trimmedOrderComment}
                  </span>
                ) : null}
              </span>
              <ChevronDown
                className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                  isCommentOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            {isCommentOpen ? (
              <textarea
                className="min-h-24 w-full resize-none border-t border-border bg-white px-3 py-2 text-sm font-medium outline-none placeholder:text-muted-foreground"
                id={orderCommentId}
                onChange={(event) => setOrderComment(event.target.value)}
                placeholder={t("cart.comment_placeholder")}
                value={orderComment}
              />
            ) : null}
          </section>
          <section aria-labelledby="order-summary-title">
            <h3 className="text-sm font-semibold tracking-tight" id="order-summary-title">
              {t("cart.summary")}
            </h3>
            <div className="mt-3 border-t border-border pt-3">
              <div className="flex items-center justify-between gap-4 text-base font-semibold">
                <span>{t("common.total")}</span>
                <span>{formatPrice(cartSubtotal, currency)}</span>
              </div>
            </div>
            <div className="mt-3 overflow-hidden rounded-md border border-border bg-card">
              <button
                aria-controls={promoCodeId}
                aria-expanded={isPromoCodeOpen}
                className="flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 text-left transition-all hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => setIsPromoCodeOpen((isOpen) => !isOpen)}
                type="button"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <BadgePercent className="size-5 shrink-0 text-foreground" aria-hidden="true" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold tracking-tight">
                      {t("cart.add_promo")}
                    </span>
                    {!isPromoCodeOpen && trimmedPromoCode ? (
                      <span className="mt-0.5 block truncate text-xs font-medium text-muted-foreground">
                        {trimmedPromoCode}
                      </span>
                    ) : null}
                  </span>
                </span>
                <ChevronDown
                  className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                    isPromoCodeOpen ? "rotate-180" : ""
                  }`}
                  aria-hidden="true"
                />
              </button>
              {isPromoCodeOpen ? (
                <input
                  className="h-12 w-full border-t border-border bg-white px-4 text-sm font-medium uppercase outline-none placeholder:normal-case placeholder:text-muted-foreground"
                  id={promoCodeId}
                  onChange={(event) => setPromoCode(event.target.value)}
                  placeholder={t("cart.promo_placeholder")}
                  type="text"
                  value={promoCode}
                />
              ) : null}
            </div>
            <p className="mt-5 text-center text-sm font-medium text-foreground">
              {t("cart.by_continuing")}{" "}
              <Link
                className="font-semibold underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                href="/terms"
                target="_blank"
              >
                {t("cart.terms")}
              </Link>
            </p>
          </section>
        </div>
      </div>
      <div className="shrink-0 bg-white px-4 py-4 sm:px-6">
        {isLocationClosed ? (
          <p className="rounded-md bg-destructive/10 px-4 py-3 text-center text-sm font-semibold text-destructive">
            {t("location.closed")} — orders cannot be placed right now.
          </p>
        ) : userEmail ? (
          <Button
            className="h-14 w-full overflow-hidden rounded-md px-6 text-base font-semibold backdrop-blur-2xl"
            disabled={cartItems.length === 0}
            onClick={handleCheckout}
            type="button"
          >
            <span>{t("common.checkout")}</span>
            <span aria-hidden="true" className="h-5 w-px bg-primary-foreground" />
            <span>{formatPrice(cartSubtotal, currency)}</span>
          </Button>
        ) : (
          <Button
            className="h-14 w-full overflow-hidden rounded-md px-6 text-base font-semibold backdrop-blur-2xl"
            disabled={cartItems.length === 0}
            onClick={onOpenAuth}
            type="button"
          >
            <LogIn className="size-5" aria-hidden="true" />
            <span>{t("cart.log_in_to_order")}</span>
            <span aria-hidden="true" className="h-5 w-px bg-primary-foreground" />
            <span>{formatPrice(cartSubtotal, currency)}</span>
          </Button>
        )}
      </div>
      {isPreorderOpen ? (
        <Modal isClosing={isPreorderClosing} onClose={closePreorderDialog}>
          <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
            <h3
              className="pr-12 text-2xl font-black tracking-[-0.04em] text-foreground"
              id={preorderDialogTitleId}
            >
              {t("cart.choose_datetime")}
            </h3>
            <div className="mt-6 min-w-0 space-y-4">
              <label className="block text-sm font-semibold tracking-tight">{t("cart.date")}</label>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
                {availableDays.map(({ dateValue, dayName, dayNumber }) => {
                  const isSelected = preorderDate === dateValue;
                  return (
                    <button
                      key={dateValue}
                      className={`flex h-20 w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-xl text-sm font-semibold transition-colors ${
                        isSelected
                          ? "bg-foreground text-background"
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                      onClick={() => setPreorderDate(dateValue)}
                      type="button"
                    >
                      <span className="text-xs uppercase tracking-tight">{dayName}</span>
                      <span className="text-base">{dayNumber}</span>
                    </button>
                  );
                })}
              </div>
              <label
                className="block text-sm font-semibold tracking-tight"
                htmlFor={preorderTimeId}
              >
                {t("cart.time")}
              </label>
              <input
                className="box-border block h-12 w-full max-w-full min-w-0 appearance-none rounded-md border border-border bg-white px-3 text-sm font-medium leading-[3rem] outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&::-webkit-calendar-picker-indicator]:m-0 [&::-webkit-calendar-picker-indicator]:p-0"
                id={preorderTimeId}
                max={selectedDayHours?.close ?? ""}
                min={selectedDayHours?.open ?? ""}
                onChange={(event) => setPreorderTime(event.target.value)}
                type="time"
                value={preorderTime}
              />
            </div>
            <div className="mt-auto pt-6">
              <Button
                className="h-12 w-full rounded-md"
                disabled={!preorderDate || !preorderTime}
                onClick={closePreorderDialog}
                type="button"
              >
                {t("common.save")}
              </Button>
            </div>
          </div>
        </Modal>
      ) : null}
    </div>
  );
}

function formatDateLabel(dateValue: string, locale: string) {
  const date = new Date(`${dateValue}T00:00:00`);

  return new Intl.DateTimeFormat(localeToDateTimeFormat[locale] ?? "nb-NO", {
    day: "numeric",
    month: "short",
  }).format(date);
}
