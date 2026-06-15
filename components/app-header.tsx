import { partnerConfig } from "@/lib/partner-config";
import { BrandMark } from "./brand-mark";
import { ProfileSheet } from "./profile-sheet";

export function AppHeader() {
  return (
    <header className="fixed left-0 top-0 z-40 w-full bg-surface/80 backdrop-blur-xl">
      <div className="phone-shell flex h-16 items-center justify-between px-4">
        <BrandMark partnerName={partnerConfig.partnerName} subtitle={partnerConfig.hubName} />
        <ProfileSheet />
      </div>
    </header>
  );
}
