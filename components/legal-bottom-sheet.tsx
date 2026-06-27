"use client";

import { X } from "lucide-react";

type LegalBottomSheetProps = {
  title: string;
  body: string;
  onClose: () => void;
};

export function LegalBottomSheet({ title, body, onClose }: LegalBottomSheetProps) {
  return (
    <div className="fixed inset-0 z-[95] flex items-end bg-on-surface/35 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-labelledby="legal-sheet-title">
      <button className="absolute inset-0 h-full w-full cursor-default" type="button" aria-label="Hinweise schließen" onClick={onClose} />
      <section className="phone-shell relative w-full max-w-md rounded-[1.6rem] bg-white p-5 shadow-active animate-pop-in">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id="legal-sheet-title" className="text-xl font-black leading-7 text-on-surface">
            {title}
          </h2>
          <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-on-surface transition active:scale-[0.96]" type="button" aria-label="Schließen" onClick={onClose}>
            <X size={18} />
          </button>
        </div>
        <p className="text-sm font-semibold leading-6 text-on-surface-variant">{body}</p>
      </section>
    </div>
  );
}
