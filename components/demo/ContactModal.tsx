"use client";

import { useEffect } from "react";
import { Mail, X } from "lucide-react";
import styles from "@/components/demo/demo.module.css";
import { trackDemoEvent } from "@/components/demo/demoAnalytics";

type ContactModalProps = {
  isOpen: boolean;
  onClose: () => void;
  source: string;
};

const mailtoHref = "mailto:kai@yourbubble.app?subject=The%20Bubble%20Demo%20Pilot";

export function ContactModal({ isOpen, onClose, source }: ContactModalProps) {
  const contactEvent = source === "hub" ? "demo_contact_click" : "dashboard_contact_click";
  const contactMode = source === "hub" ? null : "dashboard";

  useEffect(() => {
    if (!isOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.modalBackdrop}>
      <div aria-modal="true" className={styles.modal} role="dialog">
        <div className={styles.modalHeader}>
          <div>
            <p className={styles.eyebrow}>The Bubble</p>
            <h2 className={styles.modalTitle}>Pilot anfragen</h2>
          </div>
          <button aria-label="Modal schliessen" className={styles.modalClose} title="Schliessen" type="button" onClick={onClose}>
            <X size={18} strokeWidth={2.4} />
          </button>
        </div>

        <p className={styles.modalText}>
          Diese Demo zeigt nur ein Beispiel. Wir passen Branding, Inhalte, Aktionen, Rewards und Sponsorenflächen individuell an
          deinen Verein, dein Event, deine Location oder deine Marke an.
        </p>

        <div className={styles.mailCard}>
          <p className={styles.smallLabel}>E-Mail</p>
          <p className={styles.mailValue}>kai@yourbubble.app</p>
        </div>

        <a
          className={styles.modalLink}
          href={mailtoHref}
          onClick={() => void trackDemoEvent(contactEvent, { source: `${source}_mailto` }, contactMode)}
        >
          <Mail size={18} strokeWidth={2.4} />
          Kontakt aufnehmen
        </a>

        <p className={styles.modalHint}>Antwort meist innerhalb von 24 Stunden.</p>
      </div>
    </div>
  );
}
