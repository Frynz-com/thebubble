/* eslint-disable @next/next/no-img-element */
import { logoFrameClasses, logoImageStyle } from "@/lib/bubble-config";
import type { LogoBackground, LogoFit, LogoShape, LogoSize } from "@/lib/bubble-config";

type BrandMarkProps = {
  inverted?: boolean;
  partnerName?: string;
  subtitle?: string;
  logoUrl?: string;
  logoShape?: LogoShape;
  logoFit?: LogoFit;
  logoBackground?: LogoBackground;
  logoSize?: LogoSize;
  logoCropX?: number;
  logoCropY?: number;
  logoZoom?: number;
};

export function BrandMark({
  inverted = false,
  partnerName = "The Bubble",
  subtitle,
  logoUrl,
  logoShape = "round",
  logoFit = "contain",
  logoBackground = "transparent",
  logoSize = "medium",
  logoCropX = 0,
  logoCropY = 0,
  logoZoom = 100,
}: BrandMarkProps) {
  const logoConfig = { logoShape, logoFit, logoBackground, logoSize, logoCropX, logoCropY, logoZoom };
  const initial = partnerName.trim().slice(0, 1).toUpperCase() || "B";

  if (logoUrl) {
    return (
      <div className="flex min-w-0 items-center rounded-[1.1rem] bg-white/95 px-2.5 py-1.5 shadow-[0_8px_22px_rgba(20,27,43,.08)] ring-1 ring-black/5">
        <img
          src={logoUrl}
          alt={partnerName}
          className="block h-auto max-h-[48px] w-auto max-w-[min(72vw,286px)] object-contain"
          style={logoImageStyle({ ...logoConfig, logoZoom: Math.max(80, logoZoom) })}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <div className={logoFrameClasses(logoConfig, inverted)}>
        <span className="text-sm font-black leading-none">{initial}</span>
      </div>
      <div className="min-w-0 leading-none">
        <p className={["truncate text-xl font-extrabold tracking-normal", inverted ? "text-white" : "text-primary"].join(" ")}>
          {partnerName}
        </p>
        {subtitle ? (
          <p className={["mt-1 text-[11px] font-bold tracking-normal", inverted ? "text-white/70" : "text-on-surface-variant"].join(" ")}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
