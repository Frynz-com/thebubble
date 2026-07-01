"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Home, ListPlus, Pencil, Plus, QrCode, Settings2, SlidersHorizontal, Sparkles } from "lucide-react";
import { DemoBackButton } from "@/components/demo/DemoHub";
import styles from "@/components/demo/demo.module.css";
import { trackDemoEvent } from "@/components/demo/demoAnalytics";

type DashboardTab = "home" | "create" | "setup";

const tabs: Array<{ id: DashboardTab; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "create", label: "Erstellen", icon: ListPlus },
  { id: "setup", label: "Setup", icon: SlidersHorizontal },
];

const metrics = [
  ["1.248", "Scans"],
  ["612", "Teilnahmen"],
  ["319", "Coupons"],
  ["84", "Kontakte"],
];

const actionTypes = [
  ["Voting", "Fans stimmen live ab."],
  ["Tippspiel", "Besucher geben ihren Tipp ab."],
  ["Coupon", "Reward nach Teilnahme freischalten."],
  ["Gewinnspiel", "Kontakte sammeln und Gewinner ziehen."],
];

const setupItems = [
  ["Branding", "Logo, Farben und Texte anpassen."],
  ["QR-Code", "Touchpoint für Eingang, Screen oder Tisch erstellen."],
  ["Export & CRM", "Kontakte exportieren oder später mit CRM verbinden."],
];

const setupChips = ["Logo", "Farben", "QR-Touchpoints", "Rewards", "Sponsorflächen", "Export"];

function resetWindowScroll() {
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

export function DashboardDemo({ onBack, onContact }: { onBack: () => void; onContact: (source: string) => void }) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("home");
  const [selectedType, setSelectedType] = useState("Tippspiel");
  const [showQr, setShowQr] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventByTab = {
      home: "dashboard_home_view",
      create: "dashboard_create_view",
      setup: "dashboard_setup_view",
    } as const;

    void trackDemoEvent(eventByTab[activeTab], { tab: activeTab }, "dashboard");
  }, [activeTab]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [activeTab]);

  function setDashboardTab(tab: DashboardTab) {
    setActiveTab(tab);
    resetWindowScroll();
  }

  return (
    <main className={styles.appPage}>
      <div className={styles.mobileShell}>
        <DemoBackButton onBack={onBack} />

        <div className={styles.dashboardOuter}>
          <div className={styles.dashboardInner}>
            <header className={styles.appHeader}>
              <div>
                <div className={`${styles.statusPill} ${styles.dashboardStatus}`}>
                  <span className={styles.liveDot} />
                  Live
                </div>
                <h1 className={styles.dashboardTitle}>Huber Arena Dashboard</h1>
                <p className={styles.dashboardSubtitle}>Deutschland vs. Ecuador · Public Viewing</p>
              </div>
              <button
                aria-label="Pilot anfragen"
                className={styles.iconButton}
                title="Pilot anfragen"
                type="button"
                onClick={() => onContact("plus_icon")}
              >
                <Plus size={19} strokeWidth={2.5} />
              </button>
            </header>

            <div className={styles.content} ref={contentRef}>
              {activeTab === "home" ? <DashboardHome onContact={onContact} /> : null}
              {activeTab === "create" ? (
                <DashboardCreate onContact={onContact} selectedType={selectedType} setSelectedType={setSelectedType} />
              ) : null}
              {activeTab === "setup" ? <DashboardSetup onContact={onContact} setShowQr={setShowQr} showQr={showQr} /> : null}
            </div>
          </div>
        </div>

        <nav className={`${styles.bottomNav} ${styles.navLight}`}>
          <div className={styles.navGrid}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  className={`${styles.navButton} ${isActive ? styles.navActive : ""}`}
                  key={tab.id}
                  type="button"
                  onClick={() => setDashboardTab(tab.id)}
                >
                  <Icon size={17} strokeWidth={2.4} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </main>
  );
}

function DashboardHome({ onContact }: { onContact: (source: string) => void }) {
  return (
    <section className={styles.sectionIn}>
      <div className={styles.metricGrid}>
        {metrics.map(([value, label]) => (
          <div className={styles.metricCard} key={label}>
            <p className={styles.metricValue}>{value}</p>
            <p className={styles.metricLabel}>{label}</p>
          </div>
        ))}
      </div>

      <div className={styles.whiteCard}>
        <div className={styles.cardHeader}>
          <div>
            <p className={styles.eyebrow}>Aktive Aktion</p>
            <h2 className={styles.cardTitle}>Spieltag-Tipp + Getränkerabatt</h2>
          </div>
          <span className={styles.statusGood}>Läuft gerade</span>
        </div>
        <button className={styles.outlineButton} type="button" onClick={() => onContact("edit_action")}>
          <Pencil size={15} strokeWidth={2.4} />
          Bearbeiten
        </button>
      </div>

      <div className={styles.sponsorCard}>
        <p className={styles.smallLabel}>Sponsor-Ergebnis</p>
        <p className={styles.sponsorExplainer}>Sponsoren sehen, wie viele Besucher ihre Aktion wirklich erreicht hat.</p>
        <div className={styles.sponsorRows}>
          {["319 Coupon-Öffnungen", "52 Einlösungen", "8,4 % Lead-Rate"].map((item) => (
            <div className={styles.sponsorRow} key={item}>
              <span>{item}</span>
              <Check className={styles.coralIcon} size={17} strokeWidth={2.5} />
            </div>
          ))}
        </div>
      </div>

      <button className={`${styles.primaryButton} ${styles.buttonWithTop}`} type="button" onClick={() => onContact("new_action")}>
        <Plus size={18} strokeWidth={2.5} />
        Neue Aktion planen
      </button>
    </section>
  );
}

function DashboardCreate({
  onContact,
  selectedType,
  setSelectedType,
}: {
  onContact: (source: string) => void;
  selectedType: string;
  setSelectedType: (value: string) => void;
}) {
  return (
    <section className={styles.sectionIn}>
      <h2 className={styles.sectionTitle}>Aktion erstellen</h2>

      <div className={styles.typeGrid}>
        {actionTypes.map(([title, text]) => {
          const isSelected = selectedType === title;

          return (
            <button
              className={`${styles.typeButton} ${isSelected ? styles.typeSelected : ""}`}
              key={title}
              type="button"
              onClick={() => setSelectedType(title)}
            >
              <span>
                <span className={styles.typeTitle}>{title}</span>
                <span className={styles.typeText}>{text}</span>
              </span>
              <span className={styles.checkCircle}>{isSelected ? <Check size={16} strokeWidth={2.6} /> : null}</span>
            </button>
          );
        })}
      </div>

      <div className={styles.formCard}>
        <DemoField label="Titel der Aktion" value="Wie geht das Spiel aus?" />
        <DemoField label="Reward" value="10 % Rabatt am Getränkestand" />
        <DemoField label="Sponsor" value="Getränkepartner" last />
      </div>

      <button className={`${styles.primaryButton} ${styles.buttonWithTop}`} type="button" onClick={() => onContact("publish_action")}>
        Aktion live schalten
        <Sparkles size={18} strokeWidth={2.4} />
      </button>
    </section>
  );
}

function DashboardSetup({
  onContact,
  setShowQr,
  showQr,
}: {
  onContact: (source: string) => void;
  setShowQr: (value: boolean) => void;
  showQr: boolean;
}) {
  return (
    <section className={styles.sectionIn}>
      <h2 className={styles.sectionTitle}>Bubble-Setup</h2>

      <div className={styles.setupGrid}>
        {setupItems.map(([title, text]) => (
          <div className={styles.setupCard} key={title}>
            <div className={styles.setupIcon}>
              {title === "QR-Code" ? <QrCode size={18} strokeWidth={2.4} /> : <Settings2 size={18} strokeWidth={2.4} />}
            </div>
            <p className={styles.setupTitle}>{title}</p>
            <p className={styles.setupText}>{text}</p>
          </div>
        ))}
      </div>

      <button className={`${styles.darkButton} ${styles.buttonWithTop}`} type="button" onClick={() => setShowQr(!showQr)}>
        <QrCode size={18} strokeWidth={2.5} />
        QR-Code anzeigen
      </button>

      {showQr ? (
        <div className={styles.qrCard}>
          <div className={styles.qrGrid}>
            {Array.from({ length: 25 }).map((_, index) => (
              <span
                className={`${styles.qrCell} ${
                  [0, 1, 3, 5, 6, 8, 10, 12, 13, 16, 17, 19, 21, 23, 24].includes(index) ? styles.qrCellOn : ""
                }`}
                key={index}
              />
            ))}
          </div>
          <p className={styles.qrText}>Scan-Link für Eingang, Screen oder Tisch.</p>
        </div>
      ) : null}

      <div className={styles.setupNote}>
        Diese Demo zeigt nur ein Beispiel. Branding, Inhalte, Aktionen, Rewards und Sponsorenflächen werden individuell angepasst.
        <div className={styles.setupChipGrid}>
          {setupChips.map((chip) => (
            <span className={styles.setupChip} key={chip}>
              {chip}
            </span>
          ))}
        </div>
      </div>

      <button className={`${styles.outlineButton} ${styles.buttonWithTop}`} type="button" onClick={() => onContact("setup_contact")}>
        Kontakt aufnehmen
      </button>
    </section>
  );
}

function DemoField({ label, last, value }: { label: string; last?: boolean; value: string }) {
  return (
    <div className={`${styles.field} ${last ? styles.fieldLast : ""}`}>
      <p className={styles.fieldLabel}>{label}</p>
      <p className={styles.fieldValue}>{value}</p>
    </div>
  );
}
