"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type AuthState = {
  userId: string | null;
  userEmail: string | null;
  isAuthLoading: boolean;
};

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUserId(session?.user?.id ?? null);
        setUserEmail(session?.user?.email ?? null);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserEmail(null);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setUserEmail(data.user.email ?? null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, userEmail, isAuthLoading };
}
