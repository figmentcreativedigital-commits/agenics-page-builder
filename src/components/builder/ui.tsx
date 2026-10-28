import type { ReactElement } from "react";

/* Tool icons (the builder chrome, not the page). 20 × 20, 1.8 stroke. */

const P: Record<string, ReactElement> = {
  up: <path d="M10 15V5M5.5 9.5 10 5l4.5 4.5" />,
  down: <path d="M10 5v10M5.5 10.5 10 15l4.5-4.5" />,
  copy: (
    <>
      <rect x="7" y="7" width="9.5" height="9.5" rx="1.6" />
      <path d="M13 7V5a1.5 1.5 0 0 0-1.5-1.5h-6A1.5 1.5 0 0 0 4 5v6.5A1.5 1.5 0 0 0 5.5 13H7" />
    </>
  ),
  trash: <path d="M4 6h12M8 6V4.5h4V6M6 6l.7 9.6a1.5 1.5 0 0 0 1.5 1.4h3.6a1.5 1.5 0 0 0 1.5-1.4L14 6" />,
  plus: <path d="M10 4.5v11M4.5 10h11" />,
  undo: <path d="M7.5 5 4 8.5 7.5 12M4.5 8.5h7a4.5 4.5 0 0 1 0 9H9" />,
  redo: <path d="M12.5 5 16 8.5 12.5 12M15.5 8.5h-7a4.5 4.5 0 0 0 0 9H11" />,
  desktop: (
    <>
      <rect x="2.5" y="3.5" width="15" height="10" rx="1.3" />
      <path d="M7 17h6M10 13.5V17" />
    </>
  ),
  tablet: (
    <>
      <rect x="4.5" y="2.5" width="11" height="15" rx="1.6" />
      <path d="M9 15h2" />
    </>
  ),
  phone: (
    <>
      <rect x="6" y="2.5" width="8" height="15" rx="1.6" />
      <path d="M9.2 15h1.6" />
    </>
  ),
  eye: (
    <>
      <path d="M1.8 10S5 4.5 10 4.5 18.2 10 18.2 10 15 15.5 10 15.5 1.8 10 1.8 10z" />
      <circle cx="10" cy="10" r="2.5" />
    </>
  ),
  eyeOff: <path d="M3 3l14 14M8.3 5A8.6 8.6 0 0 1 10 4.5c5 0 8.2 5.5 8.2 5.5a14 14 0 0 1-2.5 3M12 15.3a7 7 0 0 1-2 .2C5 15.5 1.8 10 1.8 10a14 14 0 0 1 3.4-3.8" />,
  add: (
    <>
      <rect x="3" y="3" width="14" height="14" rx="3" />
      <path d="M10 6.5v7M6.5 10h7" />
    </>
  ),
  layers: <path d="M10 3 2.5 7 10 11l7.5-4zM2.5 10.5 10 14.5l7.5-4M2.5 14 10 18l7.5-4" />,
  pages: (
    <>
      <path d="M6 2.5h6l4 4V16a1.5 1.5 0 0 1-1.5 1.5h-8.5A1.5 1.5 0 0 1 4.5 16V4A1.5 1.5 0 0 1 6 2.5z" />
      <path d="M12 2.5v4h4" />
    </>
  ),
  review: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="m6.8 10.2 2.2 2.2 4.3-4.4" />
    </>
  ),
  help: (
    <>
      <circle cx="10" cy="10" r="7.5" />
      <path d="M7.8 7.8a2.3 2.3 0 1 1 3.3 2.1c-.7.4-1.1.9-1.1 1.6v.4M10 14.3v.2" />
    </>
  ),
  close: <path d="M5 5l10 10M15 5 5 15" />,
  note: <path d="M4 3.5h12v9l-4 4H4zM12 16.5v-4h4" />,
  link: <path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-.8.8M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l.8-.8" />,
  download: <path d="M10 3.5v9M6 9l4 4 4-4M4 16.5h12" />,
  grid: (
    <>
      <rect x="3" y="3" width="6" height="6" rx="1" />
      <rect x="11" y="3" width="6" height="6" rx="1" />
      <rect x="3" y="11" width="6" height="6" rx="1" />
      <rect x="11" y="11" width="6" height="6" rx="1" />
    </>
  ),
  sparkle: <path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6zM15.5 13.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" />,
  drag: (
    <>
      <circle cx="7.5" cy="5" r="1.2" />
      <circle cx="12.5" cy="5" r="1.2" />
      <circle cx="7.5" cy="10" r="1.2" />
      <circle cx="12.5" cy="10" r="1.2" />
      <circle cx="7.5" cy="15" r="1.2" />
      <circle cx="12.5" cy="15" r="1.2" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: keyof typeof P | string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill={name === "drag" ? "currentColor" : "none"}
      stroke={name === "drag" ? "none" : "currentColor"}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {P[name]}
    </svg>
  );
}

/** Background swatch colors for the page map and style picker. */
export const BG_SWATCH: Record<string, string> = {
  white: "#FFFFFF",
  silver: "#F2F2F3",
  cyan: "#E0F7FD",
  navy: "#004278",
};
