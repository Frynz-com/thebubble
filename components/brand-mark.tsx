import { CircleDotDashed } from "lucide-react";

type BrandMarkProps = {
  inverted?: boolean;
  partnerName?: string;
  subtitle?: string;
};

export function BrandMark({ inverted = false, partnerName = "The Bubble", subtitle }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={[
          "flex h-9 w-9 items-center justify-center rounded-xl border",
          inverted ? "border-white/30 bg-white/20 text-white backdrop-blur-md" : "border-primary/10 bg-surface-container-low text-primary",
        ].join(" ")}
      >
        <CircleDotDashed size={21} strokeWidth={2.4} />
      </div>
      <div className="min-w-0 leading-none">
        <p className={["truncate text-xl font-extrabold tracking-normal", inverted ? "text-white" : "text-primary"].join(" ")}>
          {partnerName}
        </p>
        {subtitle ? (
          <p className={["mt-1 text-[10px] font-bold uppercase tracking-[0.18em]", inverted ? "text-white/70" : "text-on-surface-variant"].join(" ")}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
