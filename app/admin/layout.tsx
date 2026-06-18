"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase-browser";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/staff/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="w-56 border-r border-border bg-card p-4 flex flex-col gap-4">
        <h2 className="font-bold text-lg">Admin</h2>
        <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
          <a href="/admin" className="hover:text-foreground">
            Orders
          </a>
        </nav>
        <div className="mt-auto">
          <button
            onClick={handleSignOut}
            className="text-sm text-muted-foreground hover:text-destructive"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
