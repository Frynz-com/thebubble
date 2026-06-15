import { BubbleSuccessScreen } from "@/components/bubble-success-screen";
import { defaultBubbleSlug } from "@/lib/bubble-routing";

export default function SuccessPage() {
  return <BubbleSuccessScreen bubbleSlug={defaultBubbleSlug} />;
}
