"use client";

import { useRef } from "react";
import { ICONS, ICON_NAMES, IconGlyph } from "@/components/page/icons";

function IconCard({ name }: { name: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const download = () => {
    const svg = ref.current?.querySelector("svg");
    if (!svg) return;
    const clone = svg.cloneNode(true) as SVGSVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("stroke", "#004278");
    clone.removeAttribute("aria-hidden");
    const blob = new Blob([clone.outerHTML], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `agenics-icon-${name}.svg`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  };
  return (
    <button type="button" className="sp-icon" onClick={download} title={`Download ${name}.svg`}>
      <span ref={ref} className="sp-icon__badge">
        <IconGlyph name={name} size={26} />
      </span>
      <b>{ICONS[name].label}</b>
      <small>{name}.svg ↓</small>
    </button>
  );
}

export function IconSheet() {
  return (
    <div className="sp-icons">
      {ICON_NAMES.map((n) => (
        <IconCard key={n} name={n} />
      ))}
    </div>
  );
}
