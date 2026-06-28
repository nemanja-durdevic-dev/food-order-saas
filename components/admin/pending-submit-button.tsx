"use client";

import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function PendingSubmitButton({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button {...props} disabled={pending || props.disabled} type="submit">
      {pending ? <Loader2 className="size-4 animate-spin" /> : children}
    </button>
  );
}

export function FormAction({
  action,
  children,
}: {
  action: () => Promise<void>;
  children: ReactNode;
}) {
  const router = useRouter();

  return (
    <form
      action={async () => {
        await action();
        router.refresh();
      }}
    >
      {children}
    </form>
  );
}
