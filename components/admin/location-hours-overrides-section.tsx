"use client";

import { startTransition, useRef, useState } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";

type Override = {
  id: string;
  date: string;
  is_closed: boolean;
  open_time: string | null;
  close_time: string | null;
  reason: string | null;
};

type ActionState = { error?: string; success?: boolean } | null;

type LocationHoursOverridesSectionProps = {
  addAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  deleteAction: (state: ActionState, formData: FormData) => Promise<ActionState>;
  locationId: string;
  overrides: Override[];
};

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(d);
}

function formatTime(time: string | null | undefined) {
  if (!time) return "-";
  return time.length >= 5 ? time.slice(0, 5) : time;
}

export function LocationHoursOverridesSection({
  addAction,
  deleteAction,
  locationId,
  overrides,
}: LocationHoursOverridesSectionProps) {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  function handleAdd(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    if (!formRef.current) return;

    const formData = new FormData();
    const inputs = formRef.current.querySelectorAll<HTMLInputElement>("input, select");

    for (const input of inputs) {
      if (input.type === "checkbox") {
        if (input.checked) {
          formData.set(input.name, "on");
        }
      } else if (input.name) {
        formData.set(input.name, input.value);
      }
    }

    formData.set("locationId", locationId);
    setAdding(true);
    setAddError(null);

    startTransition(async () => {
      const result = await addAction(null, formData);
      if (result?.error) {
        setAddError(result.error);
        setAdding(false);
      } else {
        router.refresh();
      }
    });
  }

  function handleDelete(overrideId: string) {
    const formData = new FormData();
    formData.set("overrideId", overrideId);
    formData.set("locationId", locationId);

    startTransition(async () => {
      const result = await deleteAction(null, formData);
      if (result?.error) {
        toast.error(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-semibold">Hours Overrides</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Override regular hours for specific dates (holidays, closures, events).
        </p>
      </div>

      {overrides.length > 0 ? (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-semibold">Date</th>
                <th className="px-4 py-2.5 text-center font-semibold">Day</th>
                <th className="px-4 py-2.5 text-center font-semibold">Status</th>
                <th className="px-4 py-2.5 text-center font-semibold">Hours</th>
                <th className="px-4 py-2.5 text-left font-semibold">Reason</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {overrides.map((override) => {
                const d = new Date(override.date + "T00:00:00");

                return (
                  <tr
                    className="border-b border-border last:border-b-0 hover:bg-muted/30"
                    key={override.id}
                  >
                    <td className="px-4 py-3 font-medium tabular-nums">
                      {formatDate(override.date)}
                    </td>
                    <td className="px-4 py-3 text-center text-muted-foreground">
                      {DAY_NAMES[d.getDay()]}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {override.is_closed ? (
                        <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                          Closed
                        </span>
                      ) : (
                        <span className="rounded-full border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                          Open
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-muted-foreground">
                      {override.is_closed
                        ? "-"
                        : `${formatTime(override.open_time)} - ${formatTime(override.close_time)}`}
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
                      {override.reason ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        aria-label="Delete override"
                        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(override.id)}
                        type="button"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No overrides set for this location.</p>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h4 className="mb-3 text-sm font-semibold">Add override</h4>

        <div className="space-y-4" ref={formRef}>
          {addError && <p className="text-sm text-destructive">{addError}</p>}

          <div className="flex flex-wrap items-end gap-3">
            <label className="block text-sm">
              <span className="font-medium">Date</span>
              <input
                className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                name="date"
                required
                type="date"
              />
            </label>

            <label className="flex items-center gap-1.5 pb-2 text-sm">
              <input defaultChecked name="is_closed" type="checkbox" />
              Closed
            </label>

            <label className="block text-sm">
              <span className="font-medium">Open</span>
              <input
                className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                name="open_time"
                type="time"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium">Close</span>
              <input
                className="mt-1 block h-10 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                name="close_time"
                type="time"
              />
            </label>

            <label className="block flex-1 text-sm">
              <span className="font-medium">Reason</span>
              <input
                className="mt-1 block h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                name="reason"
                placeholder="e.g. Public holiday"
                type="text"
              />
            </label>

            <Button disabled={adding} onClick={handleAdd} size="sm" type="button">
              {adding && <LoaderCircle className="mr-2 size-4 animate-spin" aria-hidden="true" />}
              Add
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
