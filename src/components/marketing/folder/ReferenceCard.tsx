import { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Scatter = "coral" | "violet" | "mint" | "pink" | "sky";

interface ReferenceCardProps {
  imgUrl?: string;
  label?: string;
  scatter?: Scatter;
  tilt?: number; // deg, -8..8
  width?: number;
  height?: number;
  className?: string;
  children?: ReactNode;
}

const scatterMap: Record<Scatter, string> = {
  coral: "hsl(var(--scatter-coral))",
  violet: "hsl(var(--scatter-violet))",
  mint: "hsl(var(--scatter-mint))",
  pink: "hsl(var(--scatter-pink))",
  sky: "hsl(var(--scatter-sky))",
};

export const ReferenceCard = ({
  imgUrl,
  label = "reference",
  scatter = "coral",
  tilt = -3,
  width = 160,
  height = 210,
  className,
  children,
}: ReferenceCardProps) => {
  const color = scatterMap[scatter];

  const style: CSSProperties = {
    width,
    height,
    transform: `rotate(${tilt}deg)`,
    borderRadius: 4, // sharp — only sharp corners in system
    background: "#fff",
    boxShadow:
      "0 20px 40px -18px rgba(20,22,43,0.28), 0 6px 14px -6px rgba(20,22,43,0.14)",
    borderTop: `4px solid ${color}`,
  };

  return (
    <div className={cn("relative shrink-0 overflow-hidden", className)} style={style}>
      {imgUrl ? (
        <img
          src={imgUrl}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center font-mono-sys text-[11px]"
          style={{ background: "hsl(var(--paper))", color: "hsl(var(--ink-faint))" }}
        >
          {children ?? "reference"}
        </div>
      )}
      <span
        className="absolute bottom-2 left-2 font-mono-sys text-[10px] font-medium px-1.5 py-0.5"
        style={{
          background: "rgba(255,255,255,0.94)",
          color: "hsl(var(--ink))",
          borderRadius: 3,
          textTransform: "lowercase",
        }}
      >
        {label}
      </span>
    </div>
  );
};
