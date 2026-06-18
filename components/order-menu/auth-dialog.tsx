"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { supabase } from "@/lib/supabase";
import { useTranslations } from "./locale-context";
import { countryCodes } from "./constants";

type AuthDialogProps = {
  isClosing: boolean;
  onClose: () => void;
  onLogin: () => void;
};

export function AuthDialog({ isClosing, onClose, onLogin }: AuthDialogProps) {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("");

  return (
    <Modal isClosing={isClosing} onClose={onClose}>
      {step === "code" ? (
        <Button
          aria-label="Back"
          className="absolute left-4 top-4 z-10 size-10 rounded-full bg-white/85 backdrop-blur hover:bg-white"
          onClick={() => setStep("phone")}
          size="icon"
          type="button"
          variant="ghost"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
        </Button>
      ) : null}
      <div className="flex flex-1 flex-col px-5 pb-8 pt-14">
        {step === "phone" ? (
          <PhoneForm
            onSend={(phoneNumber) => {
              setPhone(phoneNumber);
              setStep("code");
            }}
          />
        ) : (
          <CodeForm phone={phone} onLogin={onLogin} />
        )}
      </div>
    </Modal>
  );
}

function PhoneForm({ onSend }: { onSend: (phone: string) => void }) {
  const t = useTranslations();
  const [countryCode, setCountryCode] = useState("+47");
  const [number, setNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const rawNumber = number.replace(/\s/g, "");
    if (!rawNumber) return;

    setIsLoading(true);

    const phone = `${countryCode}${rawNumber}`;

    const { error: authError } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: "sms" },
    });

    setIsLoading(false);

    if (authError) {
      setError(
        /60200|invalid parameter `to`/i.test(authError.message)
          ? t("auth.invalid_phone")
          : authError.message,
      );
      return;
    }

    onSend(phone);
  }

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">{t("auth.log_in")}</h2>
      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold text-foreground">
          {t("auth.phone_number")}
        </label>
        <div className="flex h-12 w-full rounded-md border border-input bg-background text-base font-semibold transition-colors focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50">
          <select
            className="cursor-pointer rounded-md rounded-r-none border-r border-input bg-background px-3 text-sm font-semibold text-foreground outline-none"
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
          >
            {countryCodes.map((cc) => (
              <option key={cc.value} value={cc.value}>
                {cc.label}
              </option>
            ))}
          </select>
          <input
            className="min-w-0 flex-1 rounded-md rounded-l-none bg-background px-3 text-base font-semibold outline-none placeholder:text-muted-foreground"
            onChange={(e) => setNumber(e.target.value)}
            placeholder="123 45 678"
            type="tel"
            value={number}
          />
        </div>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
      <form className="mt-auto pt-8" onSubmit={handleSubmit}>
        <Button
          className="h-12 w-full rounded-md text-base font-bold"
          disabled={isLoading || !number.trim()}
          type="submit"
        >
          {isLoading ? <LoaderCircle className="size-5 animate-spin" /> : t("auth.send_code")}
        </Button>
      </form>
    </div>
  );
}

function CodeForm({ phone, onLogin }: { phone: string; onLogin: () => void }) {
  const t = useTranslations();
  const [countdown, setCountdown] = useState(60);
  const [digits, setDigits] = useState<string[]>(Array(6).fill(""));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const canResend = countdown === 0;

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (countdown === 0) return;

    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [countdown]);

  async function verifyCode(token: string) {
    setError(null);
    setIsLoading(true);

    const { error: authError } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: "sms",
    });

    setIsLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    onLogin();
  }

  async function handleResend() {
    const { error: authError } = await supabase.auth.signInWithOtp({
      phone,
      options: { channel: "sms" },
    });

    if (authError) {
      setError(authError.message);
      return;
    }

    setCountdown(60);
    setDigits(Array(6).fill(""));
    inputRefs.current[0]?.focus();
  }

  function handleChange(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;

    const digit = value.slice(-1);
    const nextDigits = [...digits];
    nextDigits[index] = digit;
    setDigits(nextDigits);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (digit && index === 5) {
      verifyCode(nextDigits.join(""));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
        {t("auth.enter_code")}
      </h2>
      <div className="mt-6">
        <label className="mb-2 block text-sm font-semibold text-foreground">{t("auth.code")}</label>
        <div className="flex gap-2">
          {digits.map((digit, index) => (
            <input
              key={index}
              className="h-12 w-full rounded-md border border-input bg-background text-center text-lg font-bold outline-none transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
              disabled={isLoading}
              maxLength={1}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              value={digit}
            />
          ))}
        </div>
      </div>
      {error ? <p className="mt-3 text-sm font-semibold text-destructive">{error}</p> : null}
      <div className="mt-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-muted-foreground">
          {t("auth.did_not_receive")}
        </span>
        <button
          className="cursor-pointer text-sm font-bold text-primary transition-colors hover:text-primary/80 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!canResend || isLoading}
          onClick={handleResend}
          type="button"
        >
          {canResend ? t("auth.send_again") : `${t("auth.send_again")} (${countdown}s)`}
        </button>
      </div>
      <form
        className="mt-auto pt-8"
        onSubmit={(e) => {
          e.preventDefault();
          verifyCode(digits.join(""));
        }}
        ref={formRef}
      >
        <Button
          className="h-12 w-full rounded-md text-base font-bold"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? <LoaderCircle className="size-5 animate-spin" /> : t("auth.login_button")}
        </Button>
      </form>
    </div>
  );
}
