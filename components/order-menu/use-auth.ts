"use client";

import { useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

export type AuthState = {
  userId: string | null;
  userPhone: string | null;
  isAuthLoading: boolean;
};

export function useAuth(): AuthState {
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN") {
        setUserId(session?.user?.id ?? null);
        setUserPhone(session?.user?.phone ?? null);
      } else if (event === "SIGNED_OUT") {
        setUserId(null);
        setUserPhone(null);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUserId(data.user.id);
        setUserPhone(data.user.phone ?? null);
      }
      setIsAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { userId, userPhone, isAuthLoading };
}
