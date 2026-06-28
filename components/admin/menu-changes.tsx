"use client";

import { useEffect, useState } from "react";
import { CircleMinus, CirclePlus, PencilLine } from "lucide-react";
import { toast } from "sonner";

import type { MenuChange } from "@/lib/admin/menu-diff";
import { getMenuChanges } from "@/app/admin/actions";
import { publishMenuChanges } from "@/app/admin/actions";

const CHANGE_ICON: Record<MenuChange["type"], typeof CirclePlus> = {
  category_added: CirclePlus,
  category_removed: CircleMinus,
  category_renamed: PencilLine,
  item_added: CirclePlus,
  item_removed: CircleMinus,
  item_price_changed: PencilLine,
  item_made_available: CirclePlus,
  item_made_unavailable: CircleMinus,
};

function ChangeRow({ change }: { change: MenuChange }) {
  const Icon = CHANGE_ICON[change.type];

  const iconColor =
    change.type === "item_added" ||
    change.type === "category_added" ||
    change.type === "item_made_available"
      ? "text-green-600"
      : change.type === "item_removed" ||
          change.type === "category_removed" ||
          change.type === "item_made_unavailable"
        ? "text-red-600"
        : "text-amber-600";

  return (
    <li className="flex items-center gap-1.5 text-sm">
      <Icon className={`size-4 shrink-0 ${iconColor}`} aria-hidden="true" />
      <span>{change.summary}</span>
    </li>
  );
}

export function MenuChanges() {
  const [changes, setChanges] = useState<MenuChange[] | null>(null);

  useEffect(() => {
    getMenuChanges().then(setChanges);
  }, []);

  return (
    <div className="mt-3 space-y-2">
      {changes === null ? (
        <p className="text-sm text-amber-800">Checking changes…</p>
      ) : changes.length > 0 ? (
        <ul className="space-y-1">
          {changes.map((change, i) => (
            <ChangeRow change={change} key={i} />
          ))}
        </ul>
      ) : (
        <p className="text-sm text-amber-800">
          Menu data changed (re-publish to refresh published menu).
        </p>
      )}
      <form
        action={async () => {
          await publishMenuChanges();
          toast.success("Menu published");
        }}
      >
        <button
          className="mt-2 h-9 rounded-md bg-amber-950 px-3 text-sm font-medium text-white"
          type="submit"
        >
          Publish changes
        </button>
      </form>
    </div>
  );
}
