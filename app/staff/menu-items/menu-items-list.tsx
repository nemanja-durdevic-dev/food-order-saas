"use client";

import { useCallback, useState } from "react";
import { LoaderCircle } from "lucide-react";

type MenuItemRow = {
  id: string;
  name: string;
  is_available: boolean;
  category_name: string | null;
};

export function MenuItemsList({ items: initialItems }: { items: MenuItemRow[] }) {
  const [items, setItems] = useState(initialItems);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const toggle = useCallback(async (id: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/staff/menu-items/${id}/toggle`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setItems((prev) =>
        prev.map((item) =>
          item.id === data.id ? { ...item, is_available: data.is_available } : item,
        ),
      );
    } finally {
      setLoadingId(null);
    }
  }, []);

  const available = items.filter((i) => i.is_available);
  const unavailable = items.filter((i) => !i.is_available);

  return (
    <div className="space-y-8">
      <Section title="Unavailable" items={unavailable} loadingId={loadingId} onToggle={toggle} />
      <Section title="Available" items={available} loadingId={loadingId} onToggle={toggle} />
    </div>
  );
}

function Section({
  title,
  items,
  loadingId,
  onToggle,
}: {
  title: string;
  items: MenuItemRow[];
  loadingId: string | null;
  onToggle: (id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wider">
        {title} ({items.length})
      </h2>
      <div className="divide-y rounded-xl border border-border bg-white">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-4 px-4 py-3" key={item.id}>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              {item.category_name ? (
                <p className="text-xs text-muted-foreground">{item.category_name}</p>
              ) : null}
            </div>
            <button
              className={`relative flex h-7 w-12 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                item.is_available ? "bg-green-500" : "bg-gray-200"
              }`}
              disabled={loadingId === item.id}
              onClick={() => onToggle(item.id)}
              type="button"
              role="switch"
              aria-checked={item.is_available}
              aria-label={`Toggle ${item.name}`}
            >
              {loadingId === item.id ? (
                <LoaderCircle className="mx-auto size-4 animate-spin text-white" />
              ) : (
                <span
                  className={`inline-block size-5 rounded-full bg-white shadow-sm ring-0 transition-transform ${
                    item.is_available ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
