import { BubbleLandingScreen } from "@/components/bubble-landing-screen";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleLandingPage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  return <BubbleLandingScreen bubbleSlug={normalizeBubbleSlug(bubbleSlug)} />;
}
