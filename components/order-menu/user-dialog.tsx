"use client";

import { useEffect, useRef, useState } from "react";
import { LoaderCircle, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "./locale-context";

type UserDialogProps = {
  isClosing: boolean;
  onClose: () => void;
};

export function UserDialog({ isClosing, onClose }: UserDialogProps) {
  const t = useTranslations();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [initialName, setInitialName] = useState("");
  const [initialEmail, setInitialEmail] = useState("");
  const [initialPhone, setInitialPhone] = useState("");
  const [isNameEditing, setIsNameEditing] = useState(false);
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [isPhoneEditing, setIsPhoneEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);

  const hasChanges = name !== initialName || email !== initialEmail || phone !== initialPhone;

  function enableNameEditing() {
    setIsNameEditing(true);
    requestAnimationFrame(() => nameInputRef.current?.focus());
  }

  function enableEmailEditing() {
    setIsEmailEditing(true);
    requestAnimationFrame(() => emailInputRef.current?.focus());
  }

  function enablePhoneEditing() {
    setIsPhoneEditing(true);
    requestAnimationFrame(() => phoneInputRef.current?.focus());
  }

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;
      if (user) {
        const userName = user.user_metadata?.full_name ?? "";
        const userEmail = user.email ?? "";
        const userPhone = user.user_metadata?.phone ?? "";
        setName(userName);
        setEmail(userEmail);
        setPhone(userPhone);
        setInitialName(userName);
        setInitialEmail(userEmail);
        setInitialPhone(userPhone);
      }
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setIsSaving(true);

    const updates: Parameters<typeof supabase.auth.updateUser>[0] = {
      data: { full_name: name, phone },
    };

    if (email !== initialEmail) {
      updates.email = email || undefined;
    }

    const { error } = await supabase.auth.updateUser(updates);

    setIsSaving(false);

    if (error) {
      setSaveError(error.message);
      return;
    }

    setInitialName(name);
    setInitialEmail(email);
    setInitialPhone(phone);
    setIsNameEditing(false);
    setIsEmailEditing(false);
    setIsPhoneEditing(false);
  }

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
          {t("user.title")}
        </h2>
        <form className="mt-6 space-y-4" onSubmit={handleSave}>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("user.name")}
            </label>
            <div className="flex h-12 w-full rounded-md border border-input bg-background text-base font-semibold transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <input
                className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
                disabled={!isNameEditing}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("user.name_placeholder")}
                ref={nameInputRef}
                type="text"
                value={name}
              />
              <button
                aria-label={t("common.edit")}
                className="grid size-12 shrink-0 cursor-pointer place-items-center text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isNameEditing}
                onClick={enableNameEditing}
                type="button"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("user.email")}
            </label>
            <div className="flex h-12 w-full rounded-md border border-input bg-background text-base font-semibold transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <input
                className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
                disabled={!isEmailEditing}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("user.email_placeholder")}
                ref={emailInputRef}
                type="email"
                value={email}
              />
              <button
                aria-label={t("common.edit")}
                className="grid size-12 shrink-0 cursor-pointer place-items-center text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isEmailEditing}
                onClick={enableEmailEditing}
                type="button"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-foreground">
              {t("user.phone")}
            </label>
            <div className="flex h-12 w-full rounded-md border border-input bg-background text-base font-semibold transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
              <input
                className="min-w-0 flex-1 rounded-md bg-transparent px-3 text-base font-semibold outline-none placeholder:text-muted-foreground disabled:text-muted-foreground"
                disabled={!isPhoneEditing}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t("user.phone_placeholder")}
                ref={phoneInputRef}
                type="tel"
                value={phone}
              />
              <button
                aria-label={t("common.edit")}
                className="grid size-12 shrink-0 cursor-pointer place-items-center text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isPhoneEditing}
                onClick={enablePhoneEditing}
                type="button"
              >
                <Pencil className="size-4" aria-hidden="true" />
              </button>
            </div>
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
