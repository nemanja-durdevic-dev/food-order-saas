import type { HoursOverride, OpeningHour } from "./types";

const dayNames = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export function getTodayHours(
  openingHours: OpeningHour[] | null | undefined,
): { open: string; close: string } | null {
  if (!openingHours || openingHours.length === 0) return null;

  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;

  const hours = openingHours.find((h) => h.day === adjustedDay);
  if (!hours || hours.closed) return null;

  if (!hours.open || !hours.close) return null;

  return { open: hours.open, close: hours.close };
}

export function getTodayClosingTime(openingHours: OpeningHour[] | null | undefined): string | null {
  return getTodayHours(openingHours)?.close ?? null;
}

export function isCurrentlyOpen(openingHours: OpeningHour[] | null | undefined): boolean | null {
  if (!openingHours || openingHours.length === 0) return null;

  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;

  const hours = openingHours.find((h) => h.day === adjustedDay);

  if (!hours || hours.closed) return false;
  if (!hours.open || !hours.close) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const [openHour, openMin] = hours.open.split(":").map(Number);
  const [closeHour, closeMin] = hours.close.split(":").map(Number);
  const openMinutes = openHour * 60 + openMin;
  const closeMinutes = closeHour * 60 + closeMin;

  return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
}

export function getMergedHoursForDate(
  dateStr: string,
  weeklyHours: OpeningHour[] | null | undefined,
  overrides: HoursOverride[] | null | undefined,
): { closed: boolean; open?: string; close?: string } {
  const override = overrides?.find((o) => o.date === dateStr);

  if (override) {
    if (override.is_closed) return { closed: true };
    if (override.open_time && override.close_time) {
      return {
        closed: false,
        open: override.open_time.slice(0, 5),
        close: override.close_time.slice(0, 5),
      };
    }
  }

  if (!weeklyHours) return { closed: true };

  const date = new Date(`${dateStr}T00:00:00`);
  const jsDay = date.getDay();
  const ourDay = jsDay === 0 ? 6 : jsDay - 1;
  const hours = weeklyHours.find((h) => h.day === ourDay);

  if (!hours || hours.closed) return { closed: true };
  if (!hours.open || !hours.close) return { closed: true };

  return { closed: false, open: hours.open, close: hours.close };
}

export function getScheduleForDisplay(
  openingHours: OpeningHour[] | null | undefined,
): Array<{ day: string; dayKey: string; hours: string }> {
  if (!openingHours || openingHours.length === 0) {
    return [];
  }

  return openingHours
    .sort((a, b) => a.day - b.day)
    .map((h) => ({
      day: dayNames[h.day] ?? `Day ${h.day}`,
      dayKey: dayNames[h.day]?.toLowerCase() ?? `day-${h.day}`,
      hours: h.closed ? "Closed" : `${h.open} - ${h.close}`,
    }));
}
