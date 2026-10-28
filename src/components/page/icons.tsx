import type { ReactElement } from "react";

/*
  Agenics line icons. 24 × 24, 1.8 stroke, round caps and joins, drawn for this
  template. In the page they sit in a navy disc ringed in silver, which echoes
  the rings of the Agenics mark. Squarespace: export each from /specs as SVG.
*/

export const ICONS: Record<string, { label: string; glyph: ReactElement }> = {
  cart: {
    label: "Order online",
    glyph: (
      <>
        <circle cx="9" cy="20" r="1.4" />
        <circle cx="18" cy="20" r="1.4" />
        <path d="M2.5 3.5h2.6l2.4 11.2a1.6 1.6 0 0 0 1.6 1.3h8.3a1.6 1.6 0 0 0 1.6-1.2L21 8H6.1" />
      </>
    ),
  },
  kit: {
    label: "Kit / package",
    glyph: (
      <>
        <path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z" />
        <path d="M3.5 7.5 12 12l8.5-4.5M12 12v9" />
      </>
    ),
  },
  vial: {
    label: "Sample vial",
    glyph: (
      <>
        <path d="M8.5 3h7M10 3v14.5a2 2 0 0 0 4 0V3" />
        <path d="M10 11.5h4" />
      </>
    ),
  },
  mail: {
    label: "Mail-in",
    glyph: (
      <>
        <rect x="3" y="5.5" width="18" height="13" rx="1.5" />
        <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
      </>
    ),
  },
  truck: {
    label: "Shipping",
    glyph: (
      <>
        <path d="M2.5 6.5h11v9h-11zM13.5 9.5h4l3 3.2v2.8h-7" />
        <circle cx="6.5" cy="17.5" r="1.8" />
        <circle cx="17" cy="17.5" r="1.8" />
      </>
    ),
  },
  report: {
    label: "Report",
    glyph: (
      <>
        <path d="M6 3h8.5L19 7.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
        <path d="M14 3v5h5M8.5 14.5l2.3 2.3 4.7-4.8" />
      </>
    ),
  },
  online: {
    label: "Online results",
    glyph: (
      <>
        <rect x="4" y="4.5" width="16" height="11" rx="1.2" />
        <path d="M2 19.5h20M9 10.5l2 2 4-4" />
      </>
    ),
  },
  chart: {
    label: "Data / trends",
    glyph: <path d="M4 20.5h16M7 17v-5M12 17V7M17 17v-8" />,
  },
  unlock: {
    label: "No contract",
    glyph: (
      <>
        <rect x="5" y="11" width="14" height="10" rx="2" />
        <path d="M8 11V7.5a4 4 0 0 1 7.7-1.6M12 15v2" />
      </>
    ),
  },
  tag: {
    label: "Pricing",
    glyph: (
      <>
        <path d="M3 12.2V4a1 1 0 0 1 1-1h8.2a1 1 0 0 1 .7.3l7.8 7.8a1 1 0 0 1 0 1.4l-8.2 8.2a1 1 0 0 1-1.4 0L3.3 12.9a1 1 0 0 1-.3-.7z" />
        <circle cx="8" cy="8" r="1.6" />
      </>
    ),
  },
  check: {
    label: "Check",
    glyph: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="m8.3 12.3 2.5 2.5 5-5.1" />
      </>
    ),
  },
  shield: {
    label: "Safety / compliance",
    glyph: (
      <>
        <path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z" />
        <path d="m8.8 12.2 2.2 2.2 4.3-4.4" />
      </>
    ),
  },
  patient: {
    label: "Patients",
    glyph: (
      <>
        <circle cx="12" cy="7.5" r="3.5" />
        <path d="M5 20.5c.8-3.6 3.6-6 7-6s6.2 2.4 7 6" />
      </>
    ),
  },
  heart: {
    label: "Care",
    glyph: <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z" />,
  },
  instruments: {
    label: "Instruments / devices",
    glyph: (
      <>
        <circle cx="6.5" cy="17.5" r="3" />
        <circle cx="17.5" cy="17.5" r="3" />
        <path d="M8.6 15.4 19 4M15.4 15.4 5 4" />
      </>
    ),
  },
  stethoscope: {
    label: "Practice",
    glyph: (
      <>
        <path d="M5 3v5a4 4 0 0 0 8 0V3" />
        <path d="M9 12v3a5 5 0 0 0 10 0v-2" />
        <circle cx="19" cy="11" r="2" />
      </>
    ),
  },
  facility: {
    label: "Facility",
    glyph: (
      <>
        <path d="M4 21V5a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v16M2.5 21h19" />
        <path d="M12 7.5v5M9.5 10h5M10 21v-4h4v4" />
      </>
    ),
  },
  clinic: {
    label: "Clinic / center",
    glyph: (
      <>
        <path d="M3.5 10.5 12 3.5l8.5 7M5.5 9v11.5h13V9" />
        <path d="M12 11v5M9.5 13.5h5" />
      </>
    ),
  },
  community: {
    label: "Community",
    glyph: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3.5 19.5c.6-3 2.8-5 5.5-5s4.9 2 5.5 5" />
        <circle cx="17" cy="9" r="2.4" />
        <path d="M15.8 14.6c2.3.2 4.1 2 4.7 4.9" />
      </>
    ),
  },
  tooth: {
    label: "Dental",
    glyph: (
      <path d="M8 3.5c-2.6 0-4.5 2-4.5 4.8 0 3 1.4 4.6 2 7.7.4 2.4 1 5 2.4 5 1.5 0 1.6-3.6 4.1-3.6s2.6 3.6 4.1 3.6c1.4 0 2-2.6 2.4-5 .6-3.1 2-4.7 2-7.7 0-2.8-1.9-4.8-4.5-4.8-1.7 0-2.5 1-4 1s-2.3-1-4-1z" />
    ),
  },
  droplet: {
    label: "Water",
    glyph: <path d="M12 3.2s6.5 7 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 10.2 12 3.2 12 3.2z" />,
  },
  flask: {
    label: "Laboratory",
    glyph: <path d="M9.5 3h5M10 3v6.2L4.8 18.4A1.8 1.8 0 0 0 6.4 21h11.2a1.8 1.8 0 0 0 1.6-2.6L14 9.2V3M7.2 15h9.6" />,
  },
  clock: {
    label: "Turnaround",
    glyph: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3 2" />
      </>
    ),
  },
  calendar: {
    label: "Schedule",
    glyph: (
      <>
        <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
        <path d="M3.5 9.5h17M8 3v4M16 3v4" />
      </>
    ),
  },
  phone: {
    label: "Support",
    glyph: (
      <path d="M5 3.5h3l1.5 4-2 1.5a11 11 0 0 0 7.5 7.5l1.5-2 4 1.5v3a1.5 1.5 0 0 1-1.6 1.5A16.5 16.5 0 0 1 3.5 5.1 1.5 1.5 0 0 1 5 3.5z" />
    ),
  },
};

export const ICON_NAMES = Object.keys(ICONS);

export function IconGlyph({ name, size = 24 }: { name: string; size?: number }) {
  const icon = ICONS[name] ?? ICONS.check;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon.glyph}
    </svg>
  );
}
