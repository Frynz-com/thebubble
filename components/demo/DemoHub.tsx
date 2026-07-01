"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, BarChart3, ChevronLeft, Play, ScanLine, Sparkles } from "lucide-react";
import Image from "next/image";
import { ContactModal } from "@/components/demo/ContactModal";
import { DashboardDemo } from "@/components/demo/DashboardDemo";
import styles from "@/components/demo/demo.module.css";
import { trackDemoEvent } from "@/components/demo/demoAnalytics";
import { VisitorDemo } from "@/components/demo/VisitorDemo";

type DemoMode = "hub" | "visitor" | "dashboard";

const processSteps = ["QR-Scan", "Aktion", "Reward", "Auswertung"];
const audience = ["Vereine", "Events", "Stadien", "Festivals", "Locations", "Sponsoren"];
const showcaseItems = [
  {
    title: "Straßenfest Stuttgart",
    text: "Voting, Aktionen und Rewards für Besucher vor Ort.",
    image: "/demo-showcase/stuttgart-streetfest.png",
  },
  {
    title: "Einzelhandel",
    text: "Produkt-Feedback direkt am POS und von der Community.",
    image: "/demo-showcase/retail-voting.png",
  },
  {
    title: "Club",
    text: "Challenge, Präsenz und Freigetränk für Gäste.",
    image: "/demo-showcase/club-reward.png",
  },
  {
    title: "Sportverein",
    text: "Player-of-the-Match Voting und Fan-Vorteile.",
    image: "/demo-showcase/sports-club.png",
  },
];

function resetWindowScroll() {
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

export function DemoHub() {
  const [mode, setMode] = useState<DemoMode>("hub");
  const [isContactOpen, setIsContactOpen] = useState(false);
  const showcaseRef = useRef<HTMLElement | null>(null);
  const didTrackShowcase = useRef(false);

  useEffect(() => {
    void trackDemoEvent("demo_view", { source: "demo_route" });
  }, []);

  useEffect(() => {
    if (mode !== "hub" || didTrackShowcase.current) return;
    const node = showcaseRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting || didTrackShowcase.current) return;
        didTrackShowcase.current = true;
        void trackDemoEvent("demo_showcase_view", { source: "hub_showcase" });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [mode]);

  function chooseMode(nextMode: Exclude<DemoMode, "hub">) {
    void trackDemoEvent(nextMode === "visitor" ? "demo_choose_visitor" : "demo_choose_dashboard", { source: "hub_card" }, nextMode);
    setMode(nextMode);
    resetWindowScroll();
  }

  function openContact(source: string) {
    void trackDemoEvent(mode === "hub" ? "demo_contact_click" : "dashboard_contact_click", { source }, mode === "hub" ? null : mode);
    setIsContactOpen(true);
  }

  if (mode === "visitor") {
    return (
      <VisitorDemo
        onBack={() => {
          setMode("hub");
          resetWindowScroll();
        }}
      />
    );
  }

  if (mode === "dashboard") {
    return (
      <>
        <DashboardDemo
          onBack={() => {
            setMode("hub");
            resetWindowScroll();
          }}
          onContact={openContact}
        />
        <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} source="dashboard" />
      </>
    );
  }

  return (
    <main className={styles.hubPage}>
      <section className={styles.hubGrid}>
        <div className={styles.hubCopy}>
          <div className={styles.liveBadge}>
            <span className={styles.liveDot} />
            Live-Demo
          </div>

          <p className={styles.eyebrow}>The Bubble</p>
          <h1 className={styles.hubTitle}>The Bubble Demo</h1>
          <p className={styles.hubLead}>Erlebe in 60 Sekunden, wie aus einem QR-Scan eine messbare Aktion vor Ort wird.</p>

          <div className={styles.processLine} aria-label="Demo-Ablauf">
            {processSteps.map((step, index) => (
              <span className={styles.processStep} key={step}>
                {step}
                {index < processSteps.length - 1 ? <span className={styles.processArrow}>→</span> : null}
              </span>
            ))}
          </div>

          <div className={styles.note}>
            <p>Jede Bubble wird individuell angepasst – an dein Event, dein Branding, deine Sponsoren und deine Ziele.</p>
            <div className={styles.audienceLine} aria-label="Geeignet für">
              Geeignet für {audience.join(" · ")}.
            </div>
          </div>
        </div>

        <div className={styles.chooser}>
          <div className={styles.chooserInner}>
            <div className={styles.chooserHeader}>
              <div>
                <p className={styles.smallLabel}>Demo-Auswahl</p>
                <p className={styles.headerTitle}>Wähle deine Perspektive</p>
              </div>
              <div className={styles.roundIcon}>
                <Sparkles size={18} strokeWidth={2.4} />
              </div>
            </div>

            <div className={styles.choiceStack}>
              <button className={styles.choiceCard} type="button" onClick={() => chooseMode("visitor")}>
                <span className={styles.choiceLayout}>
                  <span className={styles.choiceTop}>
                    <span className={styles.softIcon}>
                      <ScanLine size={22} strokeWidth={2.3} />
                    </span>
                    <ArrowRight className={styles.arrowIcon} size={22} />
                  </span>
                  <span>
                    <span className={styles.choiceTitle}>Als Besucher testen</span>
                    <span className={styles.choiceText}>Scannen, mitmachen, Reward erhalten.</span>
                    <span className={styles.choiceMeta}>Erlebe die Sicht eines Gasts.</span>
                  </span>
                </span>
              </button>

              <button className={`${styles.choiceCard} ${styles.choiceCardDark}`} type="button" onClick={() => chooseMode("dashboard")}>
                <span className={styles.choiceLayout}>
                  <span className={styles.choiceTop}>
                    <span className={styles.softIcon}>
                      <BarChart3 size={22} strokeWidth={2.3} />
                    </span>
                    <ArrowRight className={styles.arrowIcon} size={22} />
                  </span>
                  <span>
                    <span className={styles.choiceTitle}>Dashboard ansehen</span>
                    <span className={styles.choiceText}>Aktionen planen, Ergebnisse messen, Sponsoren auswerten.</span>
                    <span className={styles.choiceMeta}>Sieh, was Veranstalter und Sponsoren messen.</span>
                  </span>
                </span>
              </button>
            </div>

            <button className={styles.ghostButton} type="button" onClick={() => openContact("hub_contact")}>
              <Play size={16} fill="currentColor" strokeWidth={2.4} />
              Pilot anfragen
            </button>
          </div>
        </div>
      </section>

      <section className={styles.showcaseSection} aria-labelledby="showcase-title" ref={showcaseRef}>
        <div className={styles.showcaseHeader}>
          <p className={styles.smallLabel}>Use Cases</p>
          <h2 className={styles.showcaseTitle} id="showcase-title">
            So kann eine Bubble aussehen
          </h2>
          <p className={styles.showcaseLead}>Jede Bubble wird individuell an Event, Marke, Zielgruppe und Aktion angepasst.</p>
        </div>

        <div className={styles.showcaseGrid}>
          {showcaseItems.map((item) => (
            <article className={styles.showcaseCard} key={item.title}>
              <div className={styles.showcaseMedia}>
                <Image
                  className={styles.showcaseImage}
                  src={item.image}
                  alt={`${item.title} Bubble Beispiel`}
                  fill
                  sizes="(min-width: 820px) 260px, 78vw"
                />
              </div>
              <div className={styles.showcaseBody}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} source="hub" />
    </main>
  );
}

export function DemoBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button className={styles.backButton} type="button" onClick={onBack}>
      <ChevronLeft size={15} strokeWidth={2.5} />
      Zurück zur Demo-Auswahl
    </button>
  );
}
