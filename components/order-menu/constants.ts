export const preparationTime = "10min";

export const contactEmail = "post@firebite.no";

export const countryCodes = [
  { value: "+47", label: "🇳🇴 +47" },
  { value: "+46", label: "🇸🇪 +46" },
  { value: "+45", label: "🇩🇰 +45" },
  { value: "+358", label: "🇫🇮 +358" },
] as const;

export const localeToDateTimeFormat: Record<string, string> = {
  no: "nb-NO",
  sv: "sv-SE",
  en: "en-GB",
  da: "da-DK",
};

export const accents = [
  "bg-orange-200",
  "bg-amber-200",
  "bg-yellow-200",
  "bg-red-200",
  "bg-lime-200",
  "bg-stone-300",
];

export const menuItemMediaClass =
  "grid min-h-28 w-28 shrink-0 self-stretch place-items-center overflow-hidden rounded-r-xl bg-muted sm:min-h-32 sm:w-32";
