import type { Metadata } from "next";
import { BubbleStudioView } from "./bubble-studio-view";

export const metadata: Metadata = {
  title: "Bubble Studio · Lab | The Bubble",
  description: "Isolierter Prototyp für das zukünftige Operator-Dashboard und den Bubble-Erstellungsflow.",
  robots: { index: false, follow: false },
};

/**
 * /admin/lab/bubble-studio
 * Isolierte Lab-Route. Keine Supabase-Zugriffe, keine Auswirkungen auf
 * /admin, /admin/bubbles oder Live-/Pilot-Routen.
 */
export default function BubbleStudioLabPage() {
  return <BubbleStudioView />;
}
