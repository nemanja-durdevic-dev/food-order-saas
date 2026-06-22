"use client";

import { useState } from "react";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "./locale-context";

type AuthDialogProps = {
  isClosing: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export function AuthDialog({ isClosing, onClose }: AuthDialogProps) {
  const t = useTranslations();
  const [email, setEmail] = useState("");
  const [sentEmail, setSentEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedEmail = email.trim();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setError(t("auth.invalid_email"));
      return;
    }

    setIsLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(
      window.location.pathname,
    )}`;
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: trimmedEmail,
      options: { emailRedirectTo: redirectTo },
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSentEmail(trimmedEmail);
  }

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        {sentEmail ? (
          <div className="flex flex-1 flex-col">
            <CheckCircle2 className="size-12 text-foreground" aria-hidden="true" />
            <h2 className="mt-5 text-2xl font-black tracking-[-0.04em] text-foreground">
              {t("auth.check_email")}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
              {t("auth.magic_link_sent", { email: sentEmail })}
            </p>
            <Button
              className="mt-auto h-12 w-full rounded-md text-base font-bold"
              onClick={onClose}
            >
              {t("common.close")}
            </Button>
          </div>
        ) : (
          <form className="flex flex-1 flex-col" onSubmit={handleSubmit}>
            <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
              {t("auth.log_in")}
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-muted-foreground">
              {t("auth.magic_link_description")}
            </p>
            <div className="mt-6">
              <label className="mb-2 block text-sm font-semibold text-foreground" htmlFor="email">
                {t("auth.email")}
              </label>
              <div className="flex h-12 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-base font-semibold transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
                <Mail className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                <input
                  autoComplete="email"
                  className="min-w-0 flex-1 bg-transparent text-base font-semibold outline-none placeholder:text-muted-foreground"
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                  type="email"
                  value={email}
                />
              </div>
            </div>
            {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
            <Button
              className="mt-auto h-12 w-full rounded-md text-base font-bold"
              disabled={isLoading || !trimmedEmail}
              type="submit"
            >
              {isLoading ? (
                <LoaderCircle className="size-5 animate-spin" />
              ) : (
                t("auth.send_magic_link")
              )}
            </Button>
          </form>
        )}
      </div>
    </Modal>
  );
}
