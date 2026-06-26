"use client";

import type { ReactElement } from "react";

import { Logo } from "@/components/logo";
import { BRAND_NAME } from "@/lib/brand";
import { useTranslations } from "./locale-context";

import { contactEmail } from "./constants";
import type { OpeningHour, RestaurantSocialLinks } from "./types";
import { getScheduleForDisplay } from "./opening-hours";

type RestaurantInfoContentProps = {
  address: string | null;
  contentLayout?: "stacked" | "responsive";
  isManuallyClosed?: boolean;
  isOpenNow?: boolean;
  openingHours: OpeningHour[] | null;
  phone: string | null;
  socialLinks: RestaurantSocialLinks;
  title?: string | null;
  titleId?: string;
};

export function RestaurantInfoContent({
  address,
  contentLayout = "stacked",
  isManuallyClosed = false,
  isOpenNow = true,
  openingHours,
  phone,
  socialLinks,
  titleId,
  title = BRAND_NAME,
}: RestaurantInfoContentProps) {
  const displayTitle = title ?? BRAND_NAME;
  const contentClassName =
    contentLayout === "responsive"
      ? "mt-8 grid gap-7 sm:mt-10 lg:mt-0 lg:grid-cols-3 lg:gap-10"
      : "mt-8 space-y-7 sm:mt-10";

  const days = getScheduleForDisplay(openingHours);

  const content = (
    <>
      {days.length > 0 ? (
        <OpeningHours days={days} isManuallyClosed={isManuallyClosed} isOpenNow={isOpenNow} />
      ) : null}
      <Address address={address} />
      <ContactInformation phone={phone} socialLinks={socialLinks} />
    </>
  );

  if (contentLayout === "responsive") {
    return (
      <div className="rounded-[1.75rem] bg-[#f7f7f8] px-5 py-7 text-black sm:rounded-[2.5rem] sm:px-9 sm:py-9 lg:px-10">
        <div className={contentClassName}>
          <div>
            <Logo className="mb-5" />
            <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" id={titleId}>
              {displayTitle}
            </h2>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] bg-[#f7f7f8] px-5 py-7 text-black sm:rounded-[2.5rem] sm:px-9 sm:py-9 lg:px-10">
      <Logo className="mb-5" />
      <h2 className="text-2xl font-semibold tracking-[-0.04em] sm:text-3xl" id={titleId}>
        {displayTitle}
      </h2>
      <div className={contentClassName}>{content}</div>
    </div>
  );
}

function OpeningHours({
  days,
  isManuallyClosed,
  isOpenNow,
}: {
  days: Array<{ day: string; dayKey: string; hours: string }>;
  isManuallyClosed: boolean;
  isOpenNow: boolean;
}) {
  const t = useTranslations();
  const closed = isManuallyClosed || !isOpenNow;

  return (
    <section>
      <h3 className="text-xl font-semibold sm:text-2xl">{t("restaurant.opening_hours")}</h3>
      {closed ? (
        <p className="mt-2 text-sm font-medium text-black">{t("location.closed_message")}</p>
      ) : (
        <dl className="mt-2 divide-y divide-black/10 text-base sm:text-lg">
          {days.map((item) => (
            <div className="flex items-center justify-between gap-6 py-3.5 sm:py-4" key={item.day}>
              <dt>{t(`days.${item.dayKey}`)}</dt>
              <dd className="text-right text-[#62676f]">{item.hours}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function Address({ address }: { address: string | null }) {
  const t = useTranslations();

  return (
    <section>
      <h3 className="text-xl font-semibold sm:text-2xl">{t("restaurant.address")}</h3>
      <address className="mt-2 not-italic text-base leading-7 sm:text-lg">
        {address ?? t("restaurant.default_address")}
      </address>
    </section>
  );
}

function ContactInformation({
  phone,
  socialLinks,
}: {
  phone: string | null;
  socialLinks: RestaurantSocialLinks;
}) {
  const t = useTranslations();

  return (
    <section>
      <h3 className="text-xl font-semibold sm:text-2xl">{t("restaurant.contact")}</h3>
      <div className="mt-2 space-y-1 text-base leading-7 sm:text-lg">
        <p>{contactEmail}</p>
        {phone ? <p>{phone}</p> : null}
      </div>
      <SocialLinks socialLinks={socialLinks} />
    </section>
  );
}

function SocialLinks({ socialLinks }: { socialLinks: RestaurantSocialLinks }) {
  const t = useTranslations();
  const links: Array<{ href: string; label: string; icon: ReactElement }> = [];

  if (socialLinks.instagram_url) {
    links.push({
      href: socialLinks.instagram_url,
      label: t("restaurant.social_instagram"),
      icon: <InstagramIcon />,
    });
  }

  if (socialLinks.facebook_url) {
    links.push({
      href: socialLinks.facebook_url,
      label: t("restaurant.social_facebook"),
      icon: <FacebookIcon />,
    });
  }

  if (socialLinks.tiktok_url) {
    links.push({
      href: socialLinks.tiktok_url,
      label: t("restaurant.social_tiktok"),
      icon: <TikTokIcon />,
    });
  }

  if (links.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 flex items-center gap-3">
      {links.map((link) => (
        <a
          aria-label={link.label}
          className="grid size-10 place-items-center rounded-full bg-white text-black shadow-sm transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href={link.href}
          key={link.label}
          rel="noreferrer"
          target="_blank"
        >
          {link.icon}
        </a>
      ))}
    </div>
  );
}

function InstagramIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="none"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7.75 2.75h8.5a5 5 0 0 1 5 5v8.5a5 5 0 0 1-5 5h-8.5a5 5 0 0 1-5-5v-8.5a5 5 0 0 1 5-5Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M15.6 11.55a3.6 3.6 0 1 1-7.2.9 3.6 3.6 0 0 1 7.2-.9Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M17.5 6.8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M14.5 8.25V6.9c0-.72.28-1.08 1.18-1.08h1.57V2.95a21.3 21.3 0 0 0-2.5-.15c-2.48 0-4.18 1.52-4.18 4.3v1.15H7.75v3.2h2.82v7.75h3.46v-7.75h2.88l.46-3.2h-3.87Z" />
    </svg>
  );
}

function TikTokIcon() {
  return (
    <svg
      aria-hidden="true"
      className="size-5"
      fill="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M16.85 3.25c.27 2.05 1.42 3.36 3.45 3.5v3.04a7.05 7.05 0 0 1-3.35-.83v6.13c0 3.1-2.08 5.16-5.12 5.16-2.9 0-5.13-2.04-5.13-4.8 0-2.92 2.25-4.98 5.36-4.98.3 0 .58.03.86.08v3.1a3.2 3.2 0 0 0-.86-.12c-1.34 0-2.2.73-2.2 1.86 0 1.03.82 1.78 1.93 1.78 1.24 0 1.98-.72 1.98-2.12V3.25h3.08Z" />
    </svg>
  );
}
