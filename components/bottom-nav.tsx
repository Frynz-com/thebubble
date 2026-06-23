"use client";

import Link from "next/link";
import { Gift, Radio, UsersRound } from "lucide-react";
import { usePathname } from "next/navigation";
import { bubblePath, getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { useBubbleConfig } from "@/lib/bubble-config";
import { trackBubbleEvent } from "@/lib/analytics";

const items = [
  { path: "/live", label: "Live", icon: Radio },
  { path: "/community", label: "Community", icon: UsersRound },
  { path: "/benefits", label: "Vorteile", icon: Gift },
];

export function BottomNav() {
  const pathname = usePathname();
  const slug = getBubbleSlugFromPathname(pathname);
  const config = useBubbleConfig(slug);
  const visibleItems = items.filter((item) => {
    if (item.path === "/live") return config.features.live;
    if (item.path === "/community") return config.features.community;
    if (item.path === "/benefits") return config.features.rewards;
    return true;
  });

  if (visibleItems.length === 0) return null;

  return (
    <nav className="fixed bottom-0 left-0 z-50 w-full bg-surface/80 px-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-2 shadow-active backdrop-blur-xl">
      <div className="phone-shell grid min-h-16 items-center gap-1" style={{ gridTemplateColumns: `repeat(${visibleItems.length}, minmax(0, 1fr))` }}>
        {visibleItems.map((item) => {
          const href = bubblePath(slug, item.path);
          const active = pathname === href;
          const Icon = item.icon;
          return (
            <Link
              key={href}
              href={href}
              className={[
                "flex min-h-12 flex-col items-center justify-center rounded-full px-2 py-2 text-xs font-bold transition active:scale-95",
                active ? "bg-primary-container text-on-primary-container" : "text-on-surface-variant",
              ].join(" ")}
              onClick={() => void trackBubbleEvent("module_click", { module: item.label.toLowerCase(), href }, slug)}
            >
              <Icon size={21} fill={active ? "currentColor" : "none"} />
              <span className="mt-1 leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
