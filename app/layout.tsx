import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { Toaster } from "sonner";
import { getDictionary, getLocale } from "@/lib/dictionaries";
import { TranslationProvider } from "@/components/order-menu/locale-context";
import { BRAND_NAME } from "@/lib/brand";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: "Order food online and pick it up fresh from the counter.",
  icons: { icon: "/favicon.svg" },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();

  const dict = await getDictionary(locale);

  return (
    <html lang={locale} className={`${montserrat.className} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <TranslationProvider locale={locale} messages={dict}>
          {children}
        </TranslationProvider>
        <Toaster richColors closeButton />
      </body>
    </html>
  );
}
