"use client";

import { useTransition } from "react";

import { toggleRecordField } from "@/app/admin/actions";

type RecordToggleProps = {
  collection: string;
  recordId: string;
  checked: boolean;
};

export function RecordToggle({ collection, recordId, checked }: RecordToggleProps) {
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    const formData = new FormData();
    formData.set("collection", collection);
    formData.set("id", recordId);
    startTransition(() => {
      toggleRecordField(null, formData);
    });
  }

  return (
    <button
      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? "bg-green-500" : "bg-input"
      }`}
      disabled={pending}
      onClick={handleToggle}
      role="switch"
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
