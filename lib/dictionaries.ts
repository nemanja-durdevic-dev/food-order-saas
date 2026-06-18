import "server-only";

import { cookies } from "next/headers";

const dictionaries = {
  no: () => import("@/messages/no.json").then((module) => module.default),
  sv: () => import("@/messages/sv.json").then((module) => module.default),
  en: () => import("@/messages/en.json").then((module) => module.default),
  da: () => import("@/messages/da.json").then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;

export const locales = ["no", "sv", "en", "da"] as const;

export const defaultLocale = "no";

export const hasLocale = (locale: string): locale is Locale => locale in dictionaries;

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const localeValue = cookieStore.get("NEXT_LOCALE")?.value ?? "";
  return hasLocale(localeValue) ? localeValue : defaultLocale;
}

export const getDictionary = async (locale: Locale) => dictionaries[locale]();

type Messages = Awaited<ReturnType<typeof getDictionary>>;

export type { Messages };
