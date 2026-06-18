"use client";

import { useCallback, useEffect, useState } from "react";

import { supabase } from "@/lib/supabase";

import { readStoredAllergens, writeStoredAllergens } from "./storage";
import type { ItemAllergen } from "./types";

export function useAllergens(allergens: ItemAllergen[], userId: string | null) {
  const [selectedAllergenIds, setSelectedAllergenIds] = useState<string[]>(() => {
    const stored = readStoredAllergens();

    if (stored) {
      const valid = stored.filter((id) => allergens.some((a) => a.id === id));

      return valid;
    }

    return [];
  });
  const [hasHydratedFromServer, setHasHydratedFromServer] = useState(false);

  useEffect(() => {
    if (!userId || hasHydratedFromServer) return;

    supabase
      .from("user_allergens")
      .select("allergen_id")
      .then(({ data, error }) => {
        if (error || !data) return;

        const serverIds = data.map((row) => row.allergen_id);

        setSelectedAllergenIds((current) => {
          const merged = new Set([...current, ...serverIds]);

          return Array.from(merged);
        });
        setHasHydratedFromServer(true);
      });
  }, [userId, hasHydratedFromServer]);

  const save = useCallback(
    async (ids: string[]) => {
      writeStoredAllergens(ids);
      setSelectedAllergenIds(ids);

      if (!userId) return;

      const { error: deleteError } = await supabase
        .from("user_allergens")
        .delete()
        .eq("user_id", userId);

      if (deleteError) return;

      if (ids.length === 0) return;

      const { error: insertError } = await supabase
        .from("user_allergens")
        .insert(ids.map((allergenId) => ({ user_id: userId, allergen_id: allergenId })));

      if (insertError) {
        // Revert localStorage on failure
        writeStoredAllergens(selectedAllergenIds);
      }
    },
    [userId, selectedAllergenIds],
  );

  return { selectedAllergenIds, setSelectedAllergenIds, save };
}
