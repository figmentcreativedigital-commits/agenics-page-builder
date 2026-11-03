import type { ImageVal } from "./types";

/** Agenics photography that ships with the builder, offered in the photo library. */
export const AGENICS_PHOTOS: (Required<Pick<ImageVal, "src" | "w" | "h" | "alt" | "name" | "type">> & { label: string })[] = [
  {
    label: "Loading a sterilizer",
    src: "/examples/st108/st108-hero-sterilizer-16x9.jpg",
    w: 2119,
    h: 1192,
    alt: "Gloved hand loading instrument trays into a sterilizer",
    name: "st108-hero-sterilizer-16x9.jpg",
    type: "image/jpeg",
  },
  {
    label: "Sterilizer chamber",
    src: "/examples/st108/st108-sterilizer-chamber-3x2.jpg",
    w: 1254,
    h: 837,
    alt: "Open sterilizer with wrapped instrument packs loaded on its racks",
    name: "st108-sterilizer-chamber-3x2.jpg",
    type: "image/jpeg",
  },
  {
    label: "AffirmCritical kit",
    src: "/examples/st108/st108-affirm-critical-kit-1x1.png",
    w: 1200,
    h: 1200,
    alt: "AffirmCritical test kit with sample vials, instructions and mailer",
    name: "st108-affirm-critical-kit-1x1.png",
    type: "image/png",
  },
  {
    label: "AffirmUtility kit",
    src: "/examples/st108/st108-affirm-utility-kit-1x1.png",
    w: 1200,
    h: 1200,
    alt: "AffirmUtility test kit with sample vials, instructions and mailer",
    name: "st108-affirm-utility-kit-1x1.png",
    type: "image/png",
  },
];
