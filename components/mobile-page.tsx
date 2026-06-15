import type { ReactNode } from "react";
import { AppHeader } from "./app-header";
import { BottomNav } from "./bottom-nav";
import { PresenceHeartbeat } from "./presence-heartbeat";

type MobilePageProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
};

export function MobilePage({ title, subtitle, children }: MobilePageProps) {
  return (
    <div className="min-h-svh bg-surface">
      <PresenceHeartbeat />
      <AppHeader />
      <main className="phone-shell safe-bottom px-4 pt-24">
        <div className="mb-7 animate-pop-in">
          <h1 className="text-[28px] font-bold leading-[34px] tracking-normal text-on-surface">{title}</h1>
          {subtitle ? <p className="mt-2 text-base leading-6 text-on-surface-variant">{subtitle}</p> : null}
        </div>
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
