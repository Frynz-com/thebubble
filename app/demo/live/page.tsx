import { BubbleLiveScreen } from "@/components/bubble-live-screen";
import { defaultBubbleSlug } from "@/lib/bubble-routing";

export default function LivePage() {
  return <BubbleLiveScreen bubbleSlug={defaultBubbleSlug} />;
}
