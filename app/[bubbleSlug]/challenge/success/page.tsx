import { BubbleSuccessScreen } from "@/components/bubble-success-screen";
import { normalizeBubbleSlug } from "@/lib/bubble-routing";

type BubblePageProps = {
  params: Promise<{ bubbleSlug: string }>;
};

export default async function BubbleSuccessPage({ params }: BubblePageProps) {
  const { bubbleSlug } = await params;
  return <BubbleSuccessScreen bubbleSlug={normalizeBubbleSlug(bubbleSlug)} />;
}
