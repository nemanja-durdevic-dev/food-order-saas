"use client";

import { Check } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { useLocale, useTranslations } from "./locale-context";

const languages = [
  { code: "no", flag: "🇳🇴" },
  { code: "sv", flag: "🇸🇪" },
  { code: "en", flag: "🇬🇧" },
  { code: "da", flag: "🇩🇰" },
];

type LanguageDialogProps = {
  isClosing: boolean;
  onClose: () => void;
};

export function LanguageDialog({ isClosing, onClose }: LanguageDialogProps) {
  const locale = useLocale();
  const t = useTranslations();

  function handleLanguageSelect(code: string) {
    document.cookie = `NEXT_LOCALE=${code};path=/;max-age=31536000;SameSite=Lax`; // eslint-disable-line react-hooks/immutability
    window.location.reload();
  }

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
          {t("language.title")}
        </h2>
        <div className="mt-6 space-y-2">
          {languages.map((lang) => {
            const isActive = lang.code === locale;
            return (
              <button
                key={lang.code}
                className="flex h-12 w-full items-center rounded-md border bg-white px-4 text-left text-base font-semibold transition-colors hover:border-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 data-[active=true]:border-primary data-[active=true]:bg-primary/5"
                data-active={isActive || undefined}
                onClick={() => handleLanguageSelect(lang.code)}
                type="button"
              >
                <span className="flex-1">
                  {lang.flag} {t(`language.${lang.code}`)}
                </span>
                {isActive && <Check className="size-5 text-primary" aria-hidden="true" />}
              </button>
            );
          })}
        </div>
      </div>
    </Modal>
  );
}
