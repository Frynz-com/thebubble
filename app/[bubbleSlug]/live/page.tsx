import { BubbleLiveScreen } from "@/components/bubble-live-screen";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleLivePage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  return <BubbleLiveScreen bubbleSlug={normalizeBubbleSlug(bubbleSlug)} />;
}
