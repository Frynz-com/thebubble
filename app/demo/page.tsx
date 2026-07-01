import type { Metadata } from "next";
import { DemoHub } from "@/components/demo/DemoHub";

export const metadata: Metadata = {
  title: "The Bubble Demo",
  description: "Erlebe in 60 Sekunden, wie aus einem QR-Scan eine messbare Aktion vor Ort wird.",
};

export default function DemoPage() {
  return <DemoHub />;
}
