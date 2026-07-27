import { cn } from "@/lib/utils";

interface FolderMarkProps {
  size?: number;
  className?: string;
}

/** Small logo-mark version of the brand folder — used in nav and footer. */
export const FolderMark = ({ size = 24, className }: FolderMarkProps) => {
  const w = size;
  const h = Math.round(size * 0.82);
  const tabW = Math.round(w * 0.45);
  const tabH = Math.round(h * 0.22);
  return (
    <span
      className={cn("relative inline-block", className)}
      style={{ width: w, height: h + tabH / 2 }}
      aria-hidden
    >
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 1,
          width: tabW,
          height: tabH,
          borderTopLeftRadius: 3,
          borderTopRightRadius: 3,
          background: "hsl(var(--blue-300))",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: tabH - 2,
          left: 0,
          width: w,
          height: h,
          borderRadius: 4,
          background:
            "linear-gradient(160deg, hsl(var(--blue-300)) 0%, hsl(var(--blue-700)) 100%)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.3) inset",
        }}
      />
    </span>
  );
};
