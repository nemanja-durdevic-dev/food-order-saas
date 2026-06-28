import { CircleMinus, CirclePlus, Eye, PencilLine, RotateCcw } from "lucide-react";

import type { MenuChange } from "@/lib/admin/menu-diff";
import { discardUnpublishedChanges, publishMenuChanges } from "@/app/admin/actions";
import { FormAction, PendingSubmitButton } from "./pending-submit-button";

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

export function MenuChanges({ changes }: { changes: MenuChange[] }) {
  return (
    <div className="mt-3 space-y-2">
      <ul className="space-y-1">
        {changes.map((change, i) => (
          <ChangeRow change={change} key={i} />
        ))}
      </ul>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <a
          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-amber-300 bg-white px-3 text-sm font-medium text-amber-900 hover:bg-amber-50"
          href="/admin/menu-preview"
          target="_blank"
        >
          <Eye className="size-4" />
          Preview
        </a>
        <FormAction action={publishMenuChanges}>
          <PendingSubmitButton className="h-9 rounded-md bg-neutral-900 px-4 text-sm font-medium text-white hover:bg-neutral-800">
            Publish changes
          </PendingSubmitButton>
        </FormAction>
        <FormAction action={discardUnpublishedChanges}>
          <PendingSubmitButton className="inline-flex h-9 items-center gap-1.5 rounded-md border border-red-200 bg-white px-3 text-sm font-medium text-red-700 hover:bg-red-50">
            <RotateCcw className="size-4" />
            Discard changes
          </PendingSubmitButton>
        </FormAction>
      </div>
    </div>
  );
}
