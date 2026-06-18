import Link from "next/link";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { Logo } from "@/components/logo";

export default async function Home() {
  const locale = await getLocale();

  const dict = await getDictionary(locale);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-10 bg-[radial-gradient(circle_at_center,#fed7aa_0,#fff8ef_42%,#fff8ef_100%)] px-6">
      <Logo variant="hero" />
      <Link
        href="/order"
        className="inline-flex h-16 cursor-pointer items-center justify-center rounded-2xl bg-primary px-10 text-center text-xl font-black tracking-[-0.03em] text-primary-foreground shadow-xl shadow-orange-950/20 transition-transform hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring focus-visible:ring-offset-4 sm:h-18 sm:px-12 sm:text-2xl"
      >
        {dict.home.cta as string}
      </Link>
    </main>
  );
}
