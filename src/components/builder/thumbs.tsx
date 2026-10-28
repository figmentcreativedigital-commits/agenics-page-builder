import type { ReactElement } from "react";
import type { ModuleType } from "@/lib/types";

/*
  Schematic thumbnails of each module, in brand colors, for the block library,
  the layout picker and the new-page gallery. 160 × 96 units.
*/

const NAVY = "#004278";
const CYAN = "#00BBF2";
const SILVER = "#B6B7BA";
const LINE = "#C9CACD";
const TINT = "#F2F2F3";
const CYAN12 = "#E0F7FD";
const WHITE = "#FFFFFF";

const L = (x: number, y: number, w: number, c = LINE, h = 4) => <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={c} />;
const H = (x: number, y: number, w: number, c = NAVY) => <rect x={x} y={y} width={w} height={7} rx={2} fill={c} />;
const B = (x: number, y: number, w = 30, c = NAVY) => <rect x={x} y={y} width={w} height={10} rx={3} fill={c} />;
const Img = (x: number, y: number, w: number, h: number, fill = "#DCE6EE") => (
  <g>
    <rect x={x} y={y} width={w} height={h} rx={3} fill={fill} />
    <path d={`M${x + w * 0.18} ${y + h * 0.78} l${w * 0.22} -${h * 0.3} l${w * 0.16} ${h * 0.18} l${w * 0.12} -${h * 0.12} l${w * 0.18} ${h * 0.24}z`} fill="#B9CCDA" />
    <circle cx={x + w * 0.72} cy={y + h * 0.3} r={Math.min(w, h) * 0.08} fill="#B9CCDA" />
  </g>
);
const Ring = (cx: number, cy: number, r = 6) => (
  <g>
    <circle cx={cx} cy={cy} r={r + 2.5} fill="none" stroke={SILVER} strokeWidth="1.5" />
    <circle cx={cx} cy={cy} r={r} fill={NAVY} />
    <circle cx={cx} cy={cy} r={r * 0.4} fill={CYAN} />
  </g>
);

function draw(type: ModuleType, v?: string): ReactElement {
  switch (type) {
    case "hero":
      return v === "split" ? (
        <>
          <rect width="160" height="96" fill={NAVY} />
          {Img(84, 0, 76, 96, "#2B6A9A")}
          {L(12, 24, 30, CYAN, 3)}
          {H(12, 32, 58, WHITE)}
          {H(12, 42, 44, WHITE)}
          {L(12, 56, 60, "#8FB3CF", 3)}
          {B(12, 68, 30, CYAN)}
          <rect x="46" y="68" width="28" height="10" rx="3" fill="none" stroke={WHITE} strokeWidth="1.2" />
        </>
      ) : (
        <>
          <rect width="160" height="96" fill="#2B6A9A" />
          {Img(60, 0, 100, 96, "#5B8DB5")}
          <rect width="160" height="96" fill="url(#agx-hero-shade)" />
          {L(12, 24, 30, CYAN, 3)}
          {H(12, 32, 66, WHITE)}
          {H(12, 42, 50, WHITE)}
          {L(12, 56, 70, "#8FB3CF", 3)}
          {B(12, 68, 30, CYAN)}
          <rect x="46" y="68" width="28" height="10" rx="3" fill="none" stroke={WHITE} strokeWidth="1.2" />
        </>
      );
    case "trust":
      return (
        <>
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              {Ring(20 + i * 38, 48)}
              {L(30 + i * 38, 44, 20, NAVY, 3)}
              {L(30 + i * 38, 50, 16)}
            </g>
          ))}
        </>
      );
    case "intro":
      return (
        <>
          {H(40, 14, 80)}
          {L(30, 28, 100)}
          {L(42, 35, 76)}
          {v !== "text" ? (
            [0, 1].map((i) => (
              <g key={i}>
                <rect x={18 + i * 66} y={50} width={58} height={32} rx={4} fill={WHITE} stroke={SILVER} />
                <circle cx={30 + i * 66} cy={63} r={7} fill={CYAN} />
                {L(42 + i * 66, 58, 26, NAVY, 3)}
                {L(42 + i * 66, 65, 22)}
              </g>
            ))
          ) : (
            <>
              {L(36, 42, 88)}
              {L(50, 49, 60)}
            </>
          )}
        </>
      );
    case "feature": {
      const right = v === "image-right";
      const ix = right ? 98 : 12;
      const tx = right ? 12 : 72;
      return (
        <>
          <rect width="160" height="96" fill={TINT} />
          {Img(ix, 10, 50, 76)}
          {L(tx, 16, 24, NAVY, 3)}
          {H(tx, 23, 70)}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <circle cx={tx + 4} cy={42 + i * 13} r={3.5} fill="none" stroke={CYAN} strokeWidth="2" />
              {L(tx + 12, 39 + i * 13, 50, NAVY, 3)}
              {L(tx + 12, 45 + i * 13, 40)}
            </g>
          ))}
          <rect x={tx} y={80} width={28} height={9} rx={3} fill="none" stroke={NAVY} strokeWidth="1.2" />
        </>
      );
    }
    case "products":
      return (
        <>
          {H(50, 8, 60)}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <rect x={10 + i * 48} y={22} width={44} height={68} rx={4} fill={WHITE} stroke={SILVER} />
              <rect x={10.5 + i * 48} y={22.5} width={43} height={26} rx={3.5} fill={TINT} />
              <rect x={22 + i * 48} y={27} width={20} height={16} rx={2} fill="#DCE6EE" />
              {L(15 + i * 48, 53, 30, NAVY, 4)}
              {L(15 + i * 48, 61, 26)}
              {L(15 + i * 48, 67, 22)}
              {B(15 + i * 48, 75, 26)}
            </g>
          ))}
        </>
      );
    case "steps":
      return (
        <>
          <rect width="160" height="96" fill={TINT} />
          {H(12, 12, 52)}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <circle cx={22 + i * 38} cy={44} r={9} fill={NAVY} stroke={CYAN} strokeWidth="1.5" />
              <text x={22 + i * 38} y={47.5} textAnchor="middle" fontSize="10" fontWeight="800" fill={WHITE} fontFamily="Arial">
                {i + 1}
              </text>
              {L(13 + i * 38, 60, 26, NAVY, 3)}
              {L(13 + i * 38, 67, 30)}
              {L(13 + i * 38, 73, 22)}
            </g>
          ))}
        </>
      );
    case "proof":
      return (
        <>
          <rect width="160" height="96" fill={NAVY} />
          <circle cx={34} cy={46} r={18} fill="#5B8DB5" stroke={CYAN} strokeWidth="2" />
          <text x={60} y={36} fontSize="18" fill={CYAN} fontFamily="Georgia">
            “
          </text>
          {L(64, 32, 80, WHITE, 4)}
          {L(64, 40, 74, WHITE, 4)}
          {L(64, 48, 56, WHITE, 4)}
          {L(64, 58, 36, "#8FB3CF", 3)}
          {v === "stats" ? (
            <>
              {H(64, 70, 22, SILVER)}
              {H(100, 70, 22, CYAN)}
            </>
          ) : null}
        </>
      );
    case "compare":
      return (
        <>
          {H(12, 10, 64)}
          <rect x={12} y={24} width={136} height={62} rx={3} fill={WHITE} stroke={SILVER} />
          <rect x={12} y={24} width={136} height={12} rx={3} fill={NAVY} />
          {[0, 1, 2].map((r) => (
            <g key={r}>
              {r % 2 ? <rect x={12.5} y={36 + r * 16.5} width={135} height={16} fill={TINT} /> : null}
              {L(18, 42 + r * 16.5, 22, NAVY, 3)}
              {L(50, 42 + r * 16.5, 20)}
              {L(78, 42 + r * 16.5, 18)}
              {L(104, 42 + r * 16.5, 36)}
            </g>
          ))}
        </>
      );
    case "resources":
      return (
        <>
          <rect width="160" height="96" fill={TINT} />
          {H(12, 10, 60)}
          {L(118, 12, 30, NAVY, 3)}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={12 + i * 35} y={24} width={31} height={64} rx={3} fill={WHITE} stroke={SILVER} />
              <rect x={16 + i * 35} y={28} width={23} height={30} rx={1} fill="#DCE6EE" />
              <rect x={16 + i * 35} y={62} width={14} height={4} rx={2} fill={CYAN12} />
              {L(16 + i * 35, 70, 22, NAVY, 3)}
              {L(16 + i * 35, 77, 16)}
            </g>
          ))}
        </>
      );
    case "faq":
      return (
        <>
          {H(12, 14, 40)}
          {L(12, 26, 34)}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              <rect x={62} y={14 + i * 19} width={86} height={0.8} fill={SILVER} />
              {L(64, 21 + i * 19, 62, NAVY, 3)}
              <text x={144} y={25 + i * 19} fontSize="9" fontWeight="700" fill={NAVY} textAnchor="end" fontFamily="Arial">
                +
              </text>
            </g>
          ))}
        </>
      );
    case "cta":
      return (
        <>
          <rect width="160" height="96" fill={NAVY} />
          <path d="M0 0H160V10C130 18 108 4 80 10C52 16 28 18 0 12Z" fill={WHITE} />
          {H(44, 34, 72, WHITE)}
          {L(36, 48, 88, "#8FB3CF", 3)}
          {B(62, 60, 36, CYAN)}
          {v === "phone" ? L(64, 76, 32, WHITE, 3) : null}
        </>
      );
    case "explainer": {
      const stacked = v === "stacked";
      const mark = (x: number, y: number, n: number) =>
        v === "numbered" ? (
          <g>
            <circle cx={x} cy={y} r={4.5} fill={NAVY} />
            <text x={x} y={y + 2.6} textAnchor="middle" fontSize="6.5" fontWeight="800" fill={WHITE} fontFamily="Arial">
              {n}
            </text>
          </g>
        ) : (
          <circle cx={x} cy={y} r={4} fill={CYAN} />
        );
      return stacked ? (
        <>
          {H(12, 10, 60)}
          {L(12, 22, 130)}
          {L(12, 29, 110)}
          <rect x={12} y={40} width={136} height={48} rx={4} fill={TINT} />
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              {mark(22 + (i % 2) * 68, 54 + Math.floor(i / 2) * 18, i + 1)}
              {L(30 + (i % 2) * 68, 52 + Math.floor(i / 2) * 18, 50)}
            </g>
          ))}
        </>
      ) : (
        <>
          {H(12, 14, 50)}
          {L(12, 28, 62)}
          {L(12, 35, 58)}
          {L(12, 42, 62)}
          {L(12, 52, 54)}
          {L(12, 59, 40)}
          <rect x={84} y={10} width={64} height={76} rx={4} fill={TINT} />
          {L(90, 18, 40, NAVY, 4)}
          {[0, 1, 2, 3].map((i) => (
            <g key={i}>
              {mark(95, 34 + i * 14, i + 1)}
              {L(103, 32 + i * 14, 38)}
            </g>
          ))}
        </>
      );
    }
    case "grid": {
      if (v === "split")
        return (
          <>
            {H(12, 16, 46)}
            {H(12, 26, 34)}
            {L(12, 40, 50)}
            {L(12, 47, 44)}
            {B(12, 60, 32)}
            {[0, 1, 2, 3].map((i) => (
              <g key={i}>
                <rect x={72 + (i % 2) * 40} y={10 + Math.floor(i / 2) * 40} width={36} height={36} rx={4} fill={WHITE} stroke={SILVER} />
                {Ring(82 + (i % 2) * 40, 22 + Math.floor(i / 2) * 40, 4.5)}
                {L(77 + (i % 2) * 40, 32 + Math.floor(i / 2) * 40, 24, NAVY, 3)}
                {L(77 + (i % 2) * 40, 38 + Math.floor(i / 2) * 40, 20)}
              </g>
            ))}
          </>
        );
      const n = v === "cols-4" ? 4 : v === "cols-2" ? 2 : 3;
      const w = (136 - (n - 1) * 6) / n;
      return (
        <>
          {H(44, 10, 72)}
          {L(30, 22, 100)}
          {[...Array(v === "cols-2" ? 4 : n)].map((_, i) => {
            const col = v === "cols-2" ? i % 2 : i;
            const row = v === "cols-2" ? Math.floor(i / 2) : 0;
            const h = v === "cols-2" ? 28 : 52;
            const x = 12 + col * (w + 6);
            const y = 34 + row * 31;
            return (
              <g key={i}>
                <rect x={x} y={y} width={w} height={h} rx={4} fill={WHITE} stroke={SILVER} />
                {Ring(x + 11, y + 11, 4.5)}
                {L(x + 6, y + (v === "cols-2" ? 19 : 24), w * 0.6, NAVY, 3)}
                {v === "cols-2" ? null : L(x + 6, y + 31, w * 0.75)}
                {v === "cols-2" ? null : L(x + 6, y + 37, w * 0.55)}
              </g>
            );
          })}
        </>
      );
    }
    case "audience":
      if (v === "cards")
        return (
          <>
            {H(12, 10, 60)}
            {L(12, 21, 90, "#8FB3CF", 4)}
            {[0, 1, 2].map((i) => (
              <g key={i}>
                <rect x={12 + i * 46} y={34} width={42} height={52} rx={4} fill={WHITE} stroke={SILVER} />
                {Ring(24 + i * 46, 47, 5)}
                {L(18 + i * 46, 60, 28, NAVY, 3)}
                {L(18 + i * 46, 67, 30)}
                {L(18 + i * 46, 73, 22)}
              </g>
            ))}
          </>
        );
      return (
        <>
          {v === "image" ? Img(12, 8, 58, 36) : null}
          {H(12, v === "image" ? 50 : 20, 54)}
          {L(12, v === "image" ? 62 : 32, 58, "#8FB3CF", 4)}
          {L(12, v === "image" ? 72 : 46, 54)}
          {L(12, v === "image" ? 79 : 53, 46)}
          {[0, 1, 2].map((i) => (
            <g key={i}>
              {Ring(88, 22 + i * 26, 5)}
              {L(100, 18 + i * 26, 40, NAVY, 3)}
              {L(100, 25 + i * 26, 46)}
              {i < 2 ? <rect x={80} y={33 + i * 26} width={68} height={0.8} fill={SILVER} /> : null}
            </g>
          ))}
        </>
      );
    case "statement":
      return v === "split" ? (
        <>
          <rect width="160" height="96" fill={CYAN12} />
          {H(12, 22, 50)}
          {H(12, 32, 40)}
          {L(80, 18, 66)}
          {L(80, 25, 60)}
          {L(80, 36, 66)}
          {L(80, 43, 50)}
          {L(80, 56, 64, NAVY, 5)}
          {B(80, 70, 32)}
        </>
      ) : (
        <>
          <rect width="160" height="96" fill={CYAN12} />
          {H(34, 12, 92)}
          {L(28, 26, 104)}
          {L(40, 33, 80)}
          {L(32, 42, 96)}
          <rect x={70} y={53} width={20} height={1.5} fill={CYAN} />
          {L(30, 60, 100, NAVY, 5)}
          {B(64, 74, 32)}
        </>
      );
    case "story": {
      const left = v === "image-left";
      const ix = left ? 12 : 86;
      const tx = left ? 92 : 12;
      return (
        <>
          {Img(ix, 20, 62, 42)}
          {H(tx, 18, 60)}
          {L(tx, 32, 60)}
          {L(tx, 39, 54)}
          {L(tx, 49, 60)}
          {L(tx, 56, 46)}
          {L(tx, 66, 58)}
          {L(tx, 73, 40)}
        </>
      );
    }
  }
}

export function ModuleThumb({ type, variant, className }: { type: ModuleType; variant?: string; className?: string }) {
  return (
    <svg className={className ?? "pb-thumbsvg"} viewBox="0 0 160 96" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="agx-hero-shade" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={NAVY} stopOpacity="0.97" />
          <stop offset="0.45" stopColor={NAVY} stopOpacity="0.85" />
          <stop offset="1" stopColor={NAVY} stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="160" height="96" fill={WHITE} />
      {draw(type, variant)}
    </svg>
  );
}
