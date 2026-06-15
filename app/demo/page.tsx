import { BubbleLandingScreen } from "@/components/bubble-landing-screen";
import { defaultBubbleSlug } from "@/lib/bubble-routing";

export default function DemoLandingPage() {
  return <BubbleLandingScreen bubbleSlug={defaultBubbleSlug} />;
}
