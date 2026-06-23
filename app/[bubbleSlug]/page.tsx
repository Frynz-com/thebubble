import { notFound } from "next/navigation";
import { BubbleLandingScreen } from "@/components/bubble-landing-screen";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";
import { getActiveServerBubble } from "@/lib/bubble-server";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleLandingPage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  const normalizedSlug = normalizeBubbleSlug(bubbleSlug);
  const bubble = await getActiveServerBubble(normalizedSlug);
  if (!bubble) notFound();

  return <BubbleLandingScreen bubbleSlug={normalizedSlug} />;
}
