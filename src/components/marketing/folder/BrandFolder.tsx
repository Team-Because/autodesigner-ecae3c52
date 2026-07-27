import { CSSProperties, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type FolderState = "empty" | "receiving" | "active" | "client";

interface BrandFolderProps {
  /** Brand tint — provide two HSL tokens or hex; falls back to blue. */
  color?: { light: string; deep: string };
  name: string;
  logoUrl?: string;
  /** 2–3 hex or hsl color strings for palette dots. */
  palette?: string[];
  state?: FolderState;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  ariaLabel?: string;
}

const sizeMap = {
  sm: { w: 132, h: 108, radius: 12, fontSize: 12, logoSize: 22, dot: 8 },
  md: { w: 200, h: 160, radius: 14, fontSize: 14, logoSize: 30, dot: 10 },
  lg: { w: 280, h: 220, radius: 18, fontSize: 16, logoSize: 40, dot: 12 },
  xl: { w: 380, h: 300, radius: 22, fontSize: 18, logoSize: 54, dot: 14 },
};

export const BrandFolder = forwardRef<HTMLDivElement, BrandFolderProps>(function BrandFolder(
  {
    color,
    name,
    logoUrl,
    palette = [],
    state = "active",
    size = "md",
    className,
    ariaLabel,
  },
  ref
) {
  const s = sizeMap[size];
  const isEmpty = state === "empty";

  const tint = color ?? { light: "hsl(var(--blue-300))", deep: "hsl(var(--blue-700))" };

  const bodyStyle: CSSProperties = isEmpty
    ? {
        width: s.w,
        height: s.h,
        borderRadius: s.radius,
        border: "2px dashed hsl(var(--ink-faint))",
        background: "hsl(var(--paper))",
      }
    : {
        width: s.w,
        height: s.h,
        borderRadius: s.radius,
        background: `linear-gradient(160deg, ${tint.light} 0%, ${tint.deep} 100%)`,
        boxShadow: `
          0 1px 0 rgba(255,255,255,0.35) inset,
          0 -6px 20px rgba(0,0,0,0.06) inset,
          0 22px 40px -14px rgba(20,22,43,0.22),
          0 6px 14px -6px rgba(20,22,43,0.14)
        `,
      };

  const tabW = Math.round(s.w * 0.42);
  const tabH = Math.round(s.h * 0.12);

  const initial = name?.trim()?.[0]?.toUpperCase() ?? "?";

  return (
    <div
      ref={ref}
      className={cn("relative inline-flex flex-col items-center select-none", className)}
      aria-label={ariaLabel ?? `${name} brand folder`}
      role="img"
    >
      {/* Tab */}
      {!isEmpty && (
        <div
          style={{
            width: tabW,
            height: tabH,
            borderTopLeftRadius: s.radius - 4,
            borderTopRightRadius: s.radius - 4,
            background: `linear-gradient(180deg, ${tint.light} 0%, ${tint.light} 100%)`,
            marginBottom: -Math.round(tabH / 2),
            marginRight: s.w - tabW - 12,
            filter: "brightness(0.94)",
            boxShadow: "0 -1px 0 rgba(255,255,255,0.3) inset",
          }}
        />
      )}
      {isEmpty && (
        <div
          style={{
            width: tabW,
            height: tabH,
            borderTopLeftRadius: s.radius - 4,
            borderTopRightRadius: s.radius - 4,
            border: "2px dashed hsl(var(--ink-faint))",
            borderBottom: "none",
            marginBottom: -1,
            marginRight: s.w - tabW - 12,
          }}
        />
      )}

      {/* Paper edges peeking */}
      {!isEmpty && (
        <>
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: tabH + 6,
              left: 8,
              right: 12,
              height: 6,
              background: "linear-gradient(180deg, #ffffff 0%, #eef0f6 100%)",
              borderRadius: 3,
              opacity: 0.95,
            }}
          />
          <div
            aria-hidden
            style={{
              position: "absolute",
              top: tabH + 12,
              left: 14,
              right: 6,
              height: 6,
              background: "linear-gradient(180deg, #ffffff 0%, #eef0f6 100%)",
              borderRadius: 3,
              opacity: 0.75,
            }}
          />
        </>
      )}

      {/* Body */}
      <div style={bodyStyle} className="relative overflow-hidden">
        {state === "receiving" && (
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(80% 60% at 50% 100%, hsl(var(--yellow-500) / 0.35) 0%, transparent 70%)",
            }}
          />
        )}

        {/* Logo slot */}
        {!isEmpty && (
          <div
            className="absolute flex items-center justify-center bg-white/95 backdrop-blur-sm shadow-sm"
            style={{
              width: s.logoSize,
              height: s.logoSize,
              borderRadius: s.logoSize * 0.28,
              top: 14,
              left: 14,
            }}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt=""
                className="object-contain"
                style={{ maxWidth: "72%", maxHeight: "72%" }}
              />
            ) : (
              <span
                className="font-bold"
                style={{
                  color: "hsl(var(--ink))",
                  fontSize: Math.round(s.logoSize * 0.5),
                  letterSpacing: "-0.02em",
                }}
              >
                {initial}
              </span>
            )}
          </div>
        )}

        {/* Palette dots */}
        {!isEmpty && palette.length > 0 && (
          <div
            className="absolute flex items-center gap-1.5"
            style={{ bottom: 14, left: 14 }}
          >
            {palette.slice(0, 3).map((c, i) => (
              <span
                key={i}
                style={{
                  width: s.dot,
                  height: s.dot,
                  borderRadius: "999px",
                  background: c,
                  boxShadow: "0 0 0 1.5px rgba(255,255,255,0.9)",
                }}
              />
            ))}
          </div>
        )}

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span
              className="font-mono-sys text-xs"
              style={{ color: "hsl(var(--ink-faint))" }}
            >
              + add a brand
            </span>
          </div>
        )}
      </div>

      {/* Name label */}
      <div
        className="mt-3 text-center font-semibold"
        style={{
          fontSize: s.fontSize,
          color: "hsl(var(--ink))",
          letterSpacing: "-0.01em",
          maxWidth: s.w + 20,
        }}
      >
        {name}
      </div>
    </div>
  );
});
