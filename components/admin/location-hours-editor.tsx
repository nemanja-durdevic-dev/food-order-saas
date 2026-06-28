"use client";

import { saveLocationHours } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type HourRow = {
  day: number;
  open_time: string | null;
  close_time: string | null;
  is_closed: boolean;
};

type LocationHoursEditorProps = {
  hours: HourRow[];
  locationId: string;
};

const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function formatTime(time: string | null) {
  if (!time) return "";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function LocationHoursEditor({ hours, locationId }: LocationHoursEditorProps) {
  const hoursByDay = new Map(hours.map((h) => [h.day, h]));
  const [closedByDay, setClosedByDay] = useState<Record<number, boolean>>(() => {
    const closed: Record<number, boolean> = {};
    for (const h of hours) {
      closed[h.day] = h.is_closed;
    }
    return closed;
  });
  const action = saveLocationHours.bind(null, locationId);
  const hasHours = hours.length > 0;

  return (
    <form action={action} className="max-w-xl space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Opening Hours</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Set the regular weekly opening hours for this location.
        </p>
      </div>

      <div className="space-y-2">
        {DAY_LABELS.map((label, day) => {
          const existing = hoursByDay.get(day);
          const isClosed = closedByDay[day] ?? existing?.is_closed ?? false;

          return (
            <div
              className="flex items-center gap-3 rounded-md border border-border bg-card px-4 py-3"
              key={day}
            >
              <span className="w-28 text-sm font-medium">{label}</span>

              <div className={`flex items-center gap-2 ${isClosed ? "opacity-40" : ""}`}>
                <input
                  className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isClosed}
                  name={`day_${day}_open`}
                  defaultValue={formatTime(existing?.open_time ?? null)}
                  type="time"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <input
                  className="h-9 w-24 rounded-md border border-input bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-40"
                  disabled={isClosed}
                  name={`day_${day}_close`}
                  defaultValue={formatTime(existing?.close_time ?? null)}
                  type="time"
                />
              </div>

              <label className="flex items-center gap-1.5 text-sm">
                <input
                  checked={isClosed}
                  name={`day_${day}_closed`}
                  onChange={(e) => {
                    setClosedByDay((prev) => ({ ...prev, [day]: e.target.checked }));
                  }}
                  type="checkbox"
                />
                Closed
              </label>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <Button size="sm" type="submit">
          Save Hours
        </Button>
        {!hasHours ? (
          <span className="text-xs text-muted-foreground">
            No hours set yet — fill in the times above and save.
          </span>
        ) : null}
      </div>
    </form>
  );
}
