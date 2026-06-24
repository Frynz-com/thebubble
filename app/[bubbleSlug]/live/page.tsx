import { notFound } from "next/navigation";
import { BubbleLiveScreen } from "@/components/bubble-live-screen";
import { HuberArenaPilot } from "@/components/huber-arena-pilot";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getActiveServerBubble } from "@/lib/bubble-server";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleLivePage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const bubble = await getActiveServerBubble(normalizedSlug);
  if (!bubble) notFound();

  if (normalizedSlug === "huber-arena") {
    return <HuberArenaPilot bubbleSlug={normalizedSlug} />;
  }

  return <BubbleLiveScreen bubbleSlug={normalizedSlug} />;
}
