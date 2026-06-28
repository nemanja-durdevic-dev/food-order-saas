"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import { toggleRecordField } from "@/app/admin/actions";

type RecordToggleProps = {
  collection: string;
  recordId: string;
  checked: boolean;
};

function ToggleSwitch({ checked }: { checked: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-input"
      }`}
      disabled={pending}
      role="switch"
      type="submit"
      aria-checked={checked}
    >
      <span
        className={`pointer-events-none inline-block size-3.5 rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out ${
          checked ? "translate-x-3.5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function RecordToggle({ collection, recordId, checked }: RecordToggleProps) {
  const [, action] = useActionState(toggleRecordField, null);

  return (
    <form action={action}>
      <input name="collection" type="hidden" value={collection} />
      <input name="id" type="hidden" value={recordId} />
      <ToggleSwitch checked={checked} />
    </form>
  );
}
