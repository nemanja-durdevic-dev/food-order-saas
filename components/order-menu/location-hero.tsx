"use client";

import {
  ArrowLeft,
  ChevronDown,
  ClipboardList,
  Clock,
  Info,
  LogIn,
  LogOut,
  Menu,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Popover, PopoverClose, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { supabase } from "@/lib/supabase";
import { useLocale, useTranslations } from "./locale-context";
import { preparationTime } from "./constants";

type LocationHeroProps = {
  closingTime: string | null;
  isLoading: boolean;
  isAuthLoading: boolean;
  isOpenNow: boolean | null;
  onOpenLocation: () => void;
  onOpenInfo: () => void;
  onOpenAuth: () => void;
  onOpenLanguage: () => void;
  selectedLocationImageUrl: string | null;
  selectedLocationName: string | null;
  userPhone: string | null;
};

export function LocationHero({
  closingTime,
  isLoading,
  isAuthLoading,
  isOpenNow,
  onOpenLocation,
  onOpenInfo,
  onOpenAuth,
  onOpenLanguage,
  selectedLocationImageUrl,
  selectedLocationName,
  userPhone,
}: LocationHeroProps) {
  const locale = useLocale();
  const t = useTranslations();

  const flagByLocale: Record<string, string> = {
    no: "🇳🇴",
    sv: "🇸🇪",
    en: "🇬🇧",
    da: "🇩🇰",
  };

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <>
      <div className="lg:mx-auto lg:w-full lg:max-w-7xl lg:px-8">
        <div className="relative flex h-44 w-full items-center justify-center overflow-hidden bg-secondary/60 text-sm font-bold text-muted-foreground sm:h-64">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                aria-label={t("general.open_menu")}
                className="absolute left-4 top-4 z-20 size-10 rounded-md bg-white text-foreground shadow-sm hover:bg-white/90 sm:left-6 sm:top-6"
                size="icon"
                type="button"
                variant="ghost"
              >
                <Menu className="size-5" aria-hidden="true" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-64" sideOffset={8}>
              <div className="space-y-1">
                <PopoverClose asChild>
                  <Link
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    href="/"
                  >
                    <ArrowLeft className="size-5 text-muted-foreground" aria-hidden="true" />
                    <span>{t("location.go_back")}</span>
                  </Link>
                </PopoverClose>

                <div className="my-1 h-px bg-border" />

                {selectedLocationName ? (
                  <PopoverClose asChild>
                    <button
                      className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      onClick={onOpenInfo}
                      type="button"
                    >
                      <Info className="size-5 text-muted-foreground" aria-hidden="true" />
                      <span>Info</span>
                    </button>
                  </PopoverClose>
                ) : null}

                <PopoverClose asChild>
                  <button
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    onClick={onOpenLanguage}
                    type="button"
                  >
                    <span
                      className="w-5 text-center text-base leading-none"
                      role="img"
                      aria-hidden="true"
                    >
                      {flagByLocale[locale] ?? "🌐"}
                    </span>
                    <span className="flex flex-1 items-center justify-between gap-3">
                      <span>{t("language.title")}</span>
                    </span>
                  </button>
                </PopoverClose>

                <div className="my-1 h-px bg-border" />

                {isAuthLoading ? (
                  <div className="h-11 animate-pulse rounded-lg bg-gray-100" />
                ) : (
                  <>
                    <PopoverClose asChild>
                      <button
                        className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={onOpenAuth}
                        type="button"
                      >
                        {userPhone ? (
                          <User className="size-5 text-muted-foreground" aria-hidden="true" />
                        ) : (
                          <LogIn className="size-5 text-muted-foreground" aria-hidden="true" />
                        )}
                        <span>{userPhone ? t("user.title") : t("auth.log_in")}</span>
                      </button>
                    </PopoverClose>

                    {userPhone ? (
                      <>
                        <PopoverClose asChild>
                          <Link
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            href="/orders"
                          >
                            <ClipboardList
                              className="size-5 text-muted-foreground"
                              aria-hidden="true"
                            />
                            <span>{t("user.my_orders")}</span>
                          </Link>
                        </PopoverClose>

                        <PopoverClose asChild>
                          <button
                            className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            onClick={handleLogout}
                            type="button"
                          >
                            <LogOut className="size-5 text-muted-foreground" aria-hidden="true" />
                            <span>{t("user.log_out")}</span>
                          </button>
                        </PopoverClose>
                      </>
                    ) : null}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
          <div className="absolute bottom-2.5 left-1/2 z-30 -translate-x-1/2 text-center sm:bottom-6">
            <Logo variant="badge" />
          </div>
          {selectedLocationImageUrl ? (
            <Image
              alt=""
              className="object-cover"
              fill
              priority
              sizes="(min-width: 1280px) 1216px, (min-width: 1024px) calc(100vw - 4rem), 100vw"
              src={selectedLocationImageUrl}
            />
          ) : (
            <span aria-hidden="true" className="relative z-10 h-full w-full bg-gray-200" />
          )}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-10 bg-black/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 left-1/2 z-20 h-20 w-[120%] -translate-x-1/2 rounded-[100%] bg-white sm:-bottom-14 sm:h-28"
          />
        </div>
      </div>
      <div className="space-y-2 bg-white pb-4">
        {isLoading ? (
          <div className="mx-auto h-7 w-44 animate-pulse rounded-md bg-gray-200" />
        ) : (
          <button
            className="mx-auto flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-1 text-center text-base font-semibold text-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onOpenLocation}
            type="button"
          >
            {selectedLocationName ?? t("location.choose")}
            <ChevronDown className="size-4" aria-hidden="true" />
          </button>
        )}
        {selectedLocationName ? (
          <>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`text-center text-sm ${isOpenNow ? "text-green-400" : "text-red-400"}`}
              >
                {isOpenNow ? t("location.open") : t("location.closed")}
              </span>
              {closingTime ? (
                <>
                  <span className="text-sm text-gray-500">|</span>
                  <span className="text-sm text-gray-500">
                    {t("location.closes_at", { time: closingTime })}
                  </span>
                </>
              ) : null}
            </div>
            <div className="flex items-center justify-center gap-2">
              <Clock className="size-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {t("location.preparation_time", { time: preparationTime })}
              </span>
            </div>
          </>
        ) : null}
      </div>
    </>
  );
}
