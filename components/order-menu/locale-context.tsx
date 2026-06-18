"use client";

import { createContext, useContext, useCallback, type ReactNode } from "react";

type Messages = Record<string, string | Record<string, unknown>>;

type LocaleContextValue = {
  locale: string;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

function getNestedValue(obj: Messages, path: string): string | Record<string, unknown> | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return current as string | Record<string, unknown> | undefined;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] !== undefined ? String(params[key]) : `{${key}}`,
  );
}

export function TranslationProvider({
  children,
  locale,
  messages,
}: {
  children: ReactNode;
  locale: string;
  messages: Messages;
}) {
  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const value = getNestedValue(messages, key);
      if (typeof value === "string") {
        return interpolate(value, params);
      }
      return key;
    },
    [messages],
  );

  return <LocaleContext.Provider value={{ locale, t }}>{children}</LocaleContext.Provider>;
}

export function useTranslations() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useTranslations must be used within a TranslationProvider");
  }
  return ctx.t;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a TranslationProvider");
  }
  return ctx.locale;
}
