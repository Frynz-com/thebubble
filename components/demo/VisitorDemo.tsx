"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Copy, Gift, Home, ScanLine, Sparkles, Target, Ticket, X } from "lucide-react";
import { DemoBackButton } from "@/components/demo/DemoHub";
import styles from "@/components/demo/demo.module.css";
import { trackDemoEvent } from "@/components/demo/demoAnalytics";

type VisitorTab = "home" | "action" | "reward";
type Outcome = "deutschland" | "unentschieden" | "ecuador";

const optionLabels: Record<Outcome, string> = {
  deutschland: "Deutschland gewinnt",
  unentschieden: "Unentschieden",
  ecuador: "Ecuador gewinnt",
};

const tabs: Array<{ id: VisitorTab; label: string; icon: typeof Home }> = [
  { id: "home", label: "Home", icon: Home },
  { id: "action", label: "Aktion", icon: Target },
  { id: "reward", label: "Reward", icon: Ticket },
];

function resetWindowScroll() {
  window.requestAnimationFrame(() => window.scrollTo(0, 0));
}

export function VisitorDemo({ onBack }: { onBack: () => void }) {
  const [activeTab, setActiveTab] = useState<VisitorTab>("home");
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome>("deutschland");
  const [score, setScore] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isRewardSheetOpen, setIsRewardSheetOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventByTab = {
      home: "visitor_home_view",
      action: "visitor_action_view",
      reward: "visitor_reward_view",
    } as const;

    void trackDemoEvent(eventByTab[activeTab], { tab: activeTab }, "visitor");
  }, [activeTab]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    setIsRewardSheetOpen(false);
  }, [activeTab]);

  function setVisitorTab(tab: VisitorTab) {
    setActiveTab(tab);
    resetWindowScroll();
  }

  function submitTip() {
    setIsSubmitted(true);
    void trackDemoEvent("visitor_tip_submit", { outcome: selectedOutcome, has_score: Boolean(score.trim()) }, "visitor");
    window.setTimeout(() => setVisitorTab("reward"), 720);
  }

  return (
    <main className={styles.appPage}>
      <div className={styles.mobileShell}>
        <DemoBackButton onBack={onBack} />

        <div className={styles.visitorSurface}>
          <header className={styles.appHeader}>
            <div>
              <p className={styles.brandTitle}>The Bubble</p>
              <div className={styles.statusPill}>
                <span className={styles.liveDot} />
                Live · Public Viewing · Heute
              </div>
            </div>
            <div className={styles.darkRoundIcon}>
              <ScanLine size={19} strokeWidth={2.4} />
            </div>
          </header>

          <div className={styles.content} ref={contentRef}>
            {activeTab === "home" ? <VisitorHome onStart={() => setVisitorTab("action")} /> : null}
            {activeTab === "action" ? (
              <VisitorAction
                isSubmitted={isSubmitted}
                onSelect={setSelectedOutcome}
                onSubmit={submitTip}
                score={score}
                selectedOutcome={selectedOutcome}
                setScore={setScore}
              />
            ) : null}
            {activeTab === "reward" ? <VisitorReward onSheetOpenChange={setIsRewardSheetOpen} /> : null}
          </div>
        </div>

        <nav className={`${styles.bottomNav} ${styles.navDark} ${isRewardSheetOpen ? styles.navHidden : ""}`}>
          <div className={styles.navGrid}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  className={`${styles.navButton} ${isActive ? styles.navActive : ""}`}
                  key={tab.id}
                  type="button"
                  onClick={() => setVisitorTab(tab.id)}
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

function VisitorHome({ onStart }: { onStart: () => void }) {
  const microCards = [
    ["Live dabei", "Interaktion direkt am Event."],
    ["Ohne App", "Ein Scan reicht."],
    ["Reward sichern", "Nach der Teilnahme freischalten."],
  ];

  return (
    <section className={styles.sectionIn}>
      <p className={styles.eyebrow}>Spieltag-Bubble</p>

      <div className={styles.heroCard}>
        <div className={styles.heroChip}>Heute · 20:45 Uhr</div>
        <h1 className={styles.heroTitle}>Deutschland vs. Ecuador</h1>
        <p className={styles.heroText}>Mach mit, gib deinen Tipp ab und sichere dir einen Reward vor Ort.</p>
        <button className={`${styles.primaryButton} ${styles.buttonWithTop}`} type="button" onClick={onStart}>
          Tipp abgeben
          <Target size={18} strokeWidth={2.5} />
        </button>
      </div>

      <div className={styles.microGrid}>
        {microCards.map(([title, text]) => (
          <div className={styles.softCard} key={title}>
            <p className={styles.softCardTitle}>{title}</p>
            <p className={styles.softCardText}>{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function VisitorAction({
  isSubmitted,
  onSelect,
  onSubmit,
  score,
  selectedOutcome,
  setScore,
}: {
  isSubmitted: boolean;
  onSelect: (outcome: Outcome) => void;
  onSubmit: () => void;
  score: string;
  selectedOutcome: Outcome;
  setScore: (value: string) => void;
}) {
  return (
    <section className={styles.sectionIn}>
      <h1 className={styles.sectionTitle}>Wie geht das Spiel aus?</h1>
      <p className={styles.sectionCopy}>Wähle deine Tendenz und gib optional deinen Ergebnistipp ab.</p>

      {isSubmitted ? (
        <div className={styles.successBox}>
          <div className={styles.successIcon}>
            <Check size={23} strokeWidth={2.6} />
          </div>
          <p className={styles.successTitle}>Danke für deine Teilnahme.</p>
          <p className={styles.successText}>Dein Reward wurde freigeschaltet.</p>
        </div>
      ) : (
        <>
          <div className={styles.optionGrid}>
            {(Object.keys(optionLabels) as Outcome[]).map((outcome) => {
              const isActive = selectedOutcome === outcome;

              return (
                <button
                  className={`${styles.optionButton} ${isActive ? styles.optionActive : ""}`}
                  key={outcome}
                  type="button"
                  onClick={() => onSelect(outcome)}
                >
                  {optionLabels[outcome]}
                  <span className={styles.checkCircle}>{isActive ? <Check size={15} strokeWidth={2.6} /> : null}</span>
                </button>
              );
            })}
          </div>

          <label className={styles.inputLabel}>
            Dein Ergebnistipp
            <input
              className={styles.input}
              inputMode="text"
              placeholder="z. B. 2:1"
              value={score}
              onChange={(event) => setScore(event.target.value)}
            />
          </label>

          <button className={`${styles.primaryButton} ${styles.buttonWithTop}`} type="button" onClick={onSubmit}>
            Tipp speichern
          </button>
        </>
      )}
    </section>
  );
}

function VisitorReward({ onSheetOpenChange }: { onSheetOpenChange: (isOpen: boolean) => void }) {
  const [isCouponOpen, setIsCouponOpen] = useState(false);
  const [isWalletSaved, setIsWalletSaved] = useState(false);
  const [isCodeCopied, setIsCodeCopied] = useState(false);
  const [portalTarget, setPortalTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setPortalTarget(document.body);
  }, []);

  useEffect(() => {
    onSheetOpenChange(isCouponOpen);

    return () => onSheetOpenChange(false);
  }, [isCouponOpen, onSheetOpenChange]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText("BUBBLE10");
    } catch {
      // The visual demo state still confirms the intended action if clipboard access is unavailable.
    }
    setIsCodeCopied(true);
  }

  return (
    <section className={styles.sectionIn}>
      <p className={styles.eyebrow}>Freigeschaltet</p>
      <h1 className={styles.sectionTitle}>Dein Reward</h1>

      <div className={styles.rewardCard}>
        <div className={styles.rewardIcon}>
          <Gift size={22} strokeWidth={2.4} />
        </div>
        <p className={styles.rewardTitle}>10 % Rabatt am Getränkestand</p>
        <div className={styles.codeBox}>
          <p className={styles.codeLabel}>Code</p>
          <p className={styles.codeValue}>BUBBLE10</p>
        </div>
        <p className={styles.finePrint}>Gültig heute bis 22:00 Uhr.</p>
      </div>

      <button
        className={`${styles.primaryButton} ${styles.buttonWithTop}`}
        type="button"
        onClick={() => {
          setIsCouponOpen(true);
          void trackDemoEvent("reward_coupon_click", { reward: "BUBBLE10" }, "visitor");
        }}
      >
        Coupon anzeigen
        <Sparkles size={18} strokeWidth={2.4} />
      </button>

      <p className={styles.sponsorLine}>Präsentiert von Getränkepartner</p>
      <p className={styles.sponsorSubline}>Der Sponsor wird nicht nur sichtbar – die Aktion wird messbar.</p>

      {isCouponOpen && portalTarget
        ? createPortal(
        <div className={styles.sheetBackdrop}>
          <div className={styles.couponSheet} role="dialog" aria-modal="true">
            <div className={styles.sheetHandle} />
            <div className={styles.sheetHeader}>
              <div>
                <p className={styles.eyebrow}>Reward</p>
                <h2 className={styles.sheetTitle}>{isWalletSaved ? "Reward vorgemerkt" : "Coupon aktiviert"}</h2>
              </div>
              <button className={styles.modalClose} type="button" aria-label="Coupon schliessen" onClick={() => setIsCouponOpen(false)}>
                <X size={18} strokeWidth={2.4} />
              </button>
            </div>

            {isWalletSaved ? (
              <div className={styles.walletSuccess}>
                <div className={styles.successIcon}>
                  <Check size={22} strokeWidth={2.6} />
                </div>
                <p className={styles.successTitle}>Reward vorgemerkt</p>
                <p className={styles.successText}>Der Coupon wäre jetzt für spätere Aktionen wieder auffindbar.</p>
              </div>
            ) : (
              <>
                <p className={styles.sheetText}>
                  Zeige diesen Code am Getränkestand vor oder speichere den Reward für spätere Aktionen.
                </p>

                <div className={styles.activatedCoupon}>
                  <p className={styles.rewardTitle}>10 % Rabatt am Getränkestand</p>
                  <div className={styles.codeBox}>
                    <p className={styles.codeLabel}>Code</p>
                    <p className={styles.codeValue}>BUBBLE10</p>
                  </div>
                  <div className={styles.demoCodeBox}>Demo-Code</div>
                </div>

                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={() => {
                    setIsWalletSaved(true);
                    void trackDemoEvent("reward_wallet_save", { reward: "BUBBLE10" }, "visitor");
                  }}
                >
                  In Wallet speichern
                </button>
                <button className={`${styles.outlineButton} ${styles.sheetSecondary}`} type="button" onClick={() => void copyCode()}>
                  <Copy size={16} strokeWidth={2.4} />
                  {isCodeCopied ? "Code kopiert" : "Code kopieren"}
                </button>

                <p className={styles.demoHint}>
                  Demo: In echten Bubbles können Wallet-Pässe individuell eingerichtet werden.
                </p>
              </>
            )}
          </div>
        </div>,
          portalTarget,
        )
        : null}
    </section>
  );
}
