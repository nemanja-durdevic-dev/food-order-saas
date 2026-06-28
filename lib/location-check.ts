type OpeningHour = {
  day: number;
  closed?: true;
  open?: string;
  close?: string;
};

type HoursOverride = {
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
};

type LocationHoursRow = {
  day: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

type LocationRow = {
  is_open: boolean;
  restaurant_id: string;
  location_hours: LocationHoursRow[] | null;
};

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function isCurrentlyOpenForSchedule(hours: OpeningHour[]): boolean {
  const today = new Date().getDay();
  const adjustedDay = today === 0 ? 6 : today - 1;
  const dayHours = hours.find((h) => h.day === adjustedDay);

  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) return false;

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    currentMinutes >= parseMinutes(dayHours.open) && currentMinutes < parseMinutes(dayHours.close)
  );
}

function isOpenAtPreorderTime(
  dateStr: string,
  timeStr: string,
  weeklyHours: OpeningHour[],
  overrides: HoursOverride[],
): boolean {
  const override = overrides.find((o) => o.date === dateStr);

  if (override) {
    if (override.is_closed) return false;
    if (override.open_time && override.close_time) {
      const orderMin = parseMinutes(timeStr);
      return (
        orderMin >= parseMinutes(override.open_time) && orderMin < parseMinutes(override.close_time)
      );
    }
  }

  const date = new Date(`${dateStr}T00:00:00`);
  const jsDay = date.getDay();
  const ourDay = jsDay === 0 ? 6 : jsDay - 1;
  const dayHours = weeklyHours.find((h) => h.day === ourDay);

  if (!dayHours || dayHours.closed || !dayHours.open || !dayHours.close) return false;

  const orderMin = parseMinutes(timeStr);
  return orderMin >= parseMinutes(dayHours.open) && orderMin < parseMinutes(dayHours.close);
}

export async function assertLocationOpen(params: {
  locationId: string;
  orderTiming: "asap" | "preorder";
  preorderDate?: string;
  preorderTime?: string;
  supabaseAdmin: {
    from: (table: string) => {
      select: (columns: string) => {
        eq: (
          column: string,
          value: string,
        ) => {
          maybeSingle: () => Promise<{ data: unknown; error: unknown }>;
          gte: (
            column: string,
            value: string,
          ) => {
            lte: (
              column: string,
              value: string,
            ) => {
              select: (columns: string) => {
                eq: (column: string, value: string) => Promise<{ data: unknown; error: unknown }>;
              };
            };
          };
        };
      };
    };
  };
}): Promise<{ allowed: false; error: string } | { allowed: true; restaurantId: string }> {
  const { data: rawLocation } = await params.supabaseAdmin
    .from("locations")
    .select(
      `is_open, restaurant_id,
       location_hours (day, open_time, close_time, is_closed)`,
    )
    .eq("id", params.locationId)
    .maybeSingle();

  const location = rawLocation as LocationRow | null;

  if (!location) {
    return { allowed: false, error: "Invalid location" };
  }

  if (location.is_open === false) {
    return { allowed: false, error: "This location is currently closed" };
  }

  const locationHours: OpeningHour[] =
    location.location_hours?.map((h) => ({
      day: h.day,
      open: h.open_time?.slice(0, 5),
      close: h.close_time?.slice(0, 5),
      closed: h.is_closed || undefined,
    })) ?? [];

  if (locationHours.length === 0) {
    return { allowed: false, error: "Location has no configured opening hours" };
  }

  if (params.orderTiming === "asap") {
    if (!isCurrentlyOpenForSchedule(locationHours)) {
      return { allowed: false, error: "This location is currently closed" };
    }
    return { allowed: true, restaurantId: location.restaurant_id };
  }

  if (!params.preorderDate || !params.preorderTime) {
    return { allowed: false, error: "Preorder date and time are required" };
  }

  const { data: rawOverrides } = await params.supabaseAdmin
    .from("location_hours_overrides")
    .select("date, is_closed, open_time, close_time")
    .eq("location_id", params.locationId)
    .gte("date", params.preorderDate)
    .lte("date", params.preorderDate);

  const overrides = (rawOverrides as HoursOverride[] | null) ?? [];

  if (!isOpenAtPreorderTime(params.preorderDate, params.preorderTime, locationHours, overrides)) {
    return { allowed: false, error: "This location is closed at the selected time" };
  }

  return { allowed: true, restaurantId: location.restaurant_id };
}
