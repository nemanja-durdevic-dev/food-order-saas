"use client";

import { useTranslations } from "@/components/order-menu/locale-context";

export default function OrderLoading() {
  const t = useTranslations();

  return (
    <main className="min-h-screen">
      <div className="lg:mx-auto lg:w-full lg:max-w-7xl lg:px-8">
        <div className="relative flex h-44 w-full animate-pulse items-center justify-center overflow-hidden bg-gray-200 sm:h-64">
          <div className="absolute left-4 top-4 z-20 size-10 rounded-md bg-white sm:left-6 sm:top-6" />
          <div className="absolute bottom-2.5 left-1/2 z-30 flex size-16 -translate-x-1/2 flex-col items-center justify-center gap-1 rounded-md bg-white sm:bottom-6">
            <div className="size-6 rounded-md bg-gray-200" />
            <div className="h-2.5 w-10 rounded-full bg-gray-200" />
          </div>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-10 left-1/2 z-20 h-20 w-[120%] -translate-x-1/2 rounded-[100%] bg-white sm:-bottom-14 sm:h-28"
          />
        </div>
      </div>
      <div className="space-y-2 bg-white pb-4">
        <div className="mx-auto h-7 w-44 animate-pulse rounded-md bg-gray-200" />
        <div className="mx-auto h-4 w-52 animate-pulse rounded-md bg-gray-200" />
        <div className="mx-auto h-4 w-36 animate-pulse rounded-md bg-gray-200" />
      </div>
      <section className="relative bg-white">
        <div className="mx-auto w-full max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
          <div aria-label={t("general.loading")} className="animate-pulse" role="status">
            <div className="-mx-4 mb-6 overflow-hidden border-b border-border bg-white py-3 sm:-mx-6 lg:-mx-8">
              <div className="flex items-center gap-2 px-4 sm:px-6 lg:px-8">
                <div className="flex shrink-0 items-center gap-1 sm:hidden">
                  <div className="size-9 rounded-md bg-gray-200" />
                  <div className="h-6 w-px bg-gray-200" />
                </div>
                <div className="hidden h-9 w-48 shrink-0 rounded-md border border-border bg-card sm:block" />
                <div className="hidden h-6 w-px bg-gray-200 sm:block" />
                <div className="min-w-0 flex-1 overflow-hidden">
                  <div className="flex w-max items-center gap-2">
                    {[0, 1, 2, 3, 4].map((item) => (
                      <div className="h-9 w-24 shrink-0 rounded-md bg-gray-200" key={item} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-10">
              {[0, 1].map((section) => (
                <section className="min-w-0 scroll-mt-24" key={section}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div className="h-8 w-36 rounded-md bg-gray-200" />
                    {section === 0 ? (
                      <div className="h-8 w-28 shrink-0 rounded-md border border-gray-200 bg-gray-100" />
                    ) : null}
                  </div>
                  <div className="grid gap-4">
                    {[0, 1, 2].map((item) => (
                      <div
                        className="flex gap-3 overflow-hidden rounded-xl border-0 bg-card/90 shadow-sm"
                        key={item}
                      >
                        <div className="flex min-w-0 flex-1 flex-col px-4 py-3">
                          <div className="h-5 w-40 rounded-md bg-gray-200" />
                          <div className="mt-3 h-3.5 w-full rounded-md bg-gray-200" />
                          <div className="mt-2 h-3.5 w-4/5 rounded-md bg-gray-200" />
                          <div className="mt-5 h-5 w-16 rounded-md bg-gray-200" />
                        </div>
                        <div className="min-h-28 w-28 shrink-0 rounded-r-xl bg-gray-200 sm:min-h-32 sm:w-32" />
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
            <div className="mt-12 flex flex-col items-center gap-3 sm:flex-row">
              <div className="size-9 shrink-0 rounded-md bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-5 w-36 rounded-md bg-gray-200" />
                <div className="h-4 w-48 rounded-md bg-gray-200" />
                <div className="h-4 w-32 rounded-md bg-gray-200" />
              </div>
            </div>
            <span className="sr-only">{t("general.loading")}</span>
          </div>
        </div>
      </section>
    </main>
  );
}
