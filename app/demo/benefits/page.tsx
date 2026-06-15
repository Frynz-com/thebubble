import { BenefitsList } from "@/components/benefits-list";
import { MobilePage } from "@/components/mobile-page";

export default function BenefitsPage() {
  return (
    <MobilePage title="Deine Vorteile heute" subtitle="Exklusive Perks für TSV Mitglieder und Fans.">
      <BenefitsList />
    </MobilePage>
  );
}
