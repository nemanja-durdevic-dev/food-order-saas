"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase-browser";

export function AdminLoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Sign in</h1>
        </div>

        {error ? (
          <p className="border-l border-destructive pl-4 text-sm text-destructive">{error}</p>
        ) : null}

        <input
          className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Email"
          required
          type="email"
          value={email}
        />
        <input
          className="h-11 w-full border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Password"
          required
          type="password"
          value={password}
        />
        <button
          className="h-11 w-full bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </main>
  );
}
