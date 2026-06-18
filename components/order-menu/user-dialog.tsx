"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "./locale-context";
import { formatPhoneNumber } from "./utils";

type UserDialogProps = {
  isClosing: boolean;
  onClose: () => void;
  phone: string;
};

export function UserDialog({ isClosing, onClose, phone }: UserDialogProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const hasChanges = name !== initialName || email !== initialEmail;

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        const userName = user.user_metadata?.full_name ?? "";
        const userEmail = user.email ?? "";
        setName(userName);
        setEmail(userEmail);
        setInitialName(userName);
        setInitialEmail(userEmail);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    const { error } = await supabase.auth.updateUser({
      email: email || undefined,
      data: { full_name: name },
    });

    setIsSaving(false);

    if (error) {
      setSaveError(error.message);
    }
  }

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
          {t("user.title")}
        </h2>
        <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
          <Phone className="size-4" aria-hidden="true" />
          {formatPhoneNumber(phone)}
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSave}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("user.name")}
            </label>
            <input
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground"
              onChange={(e) => setName(e.target.value)}
              placeholder={t("user.name_placeholder")}
              type="text"
              value={name}
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("user.email")}
            </label>
            <input
              className="h-12 w-full rounded-md border border-input bg-background px-3 text-base font-semibold outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 placeholder:text-muted-foreground"
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("user.email_placeholder")}
              type="email"
              value={email}
            />
          </div>
          {saveError ? <p className="text-sm font-semibold text-destructive">{saveError}</p> : null}
          {hasChanges ? (
            <Button
              className="h-12 w-full rounded-md text-base font-bold"
              disabled={isSaving}
              type="submit"
            >
              {isSaving ? <LoaderCircle className="size-5 animate-spin" /> : t("common.save")}
            </Button>
          ) : null}
        </form>
      </div>
    </Modal>
  );
}
