"use client";

import Image from "next/image";
import { Camera, UserRound, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { BrandMark } from "@/components/brand-mark";
import { BubbleSessionBootstrap } from "@/components/bubble-session-bootstrap";
import { ensureGuestVisitor, ensureProfileVisitor } from "@/lib/bubble-service";
import { bubblePath, getCurrentBubbleSlug } from "@/lib/bubble-routing";
import { partnerConfig } from "@/lib/partner-config";
import { logSupabaseError } from "@/lib/supabase/log-error";

export default function JoinPage() {
  const router = useRouter();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function continueAnonymously() {
    setBusy(true);
    setMessage("");
    try {
      const bubbleSlug = getCurrentBubbleSlug();
      const result = await ensureGuestVisitor(bubbleSlug);
      if (result.message) setMessage(result.message);
      window.dispatchEvent(new Event("bubble-profile-change"));
      router.push(bubblePath(bubbleSlug, "/live"));
    } catch (error) {
      logSupabaseError("join.anonymous", error);
      setMessage("Verbindung fehlgeschlagen. Bitte versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    try {
      const bubbleSlug = getCurrentBubbleSlug();
      const result = await ensureProfileVisitor({
        name: nickname.trim() || "Bubble Gast",
        avatar: partnerConfig.images.onboarding,
        isAnonymous: false,
      }, bubbleSlug);
      if (result.message) setMessage(result.message);
      window.dispatchEvent(new Event("bubble-profile-change"));
      router.push(bubblePath(bubbleSlug, "/live"));
    } catch (error) {
      logSupabaseError("join.profile", error);
      setMessage("Profil konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-svh overflow-hidden bg-surface">
      <BubbleSessionBootstrap />
      <div className="pointer-events-none fixed -right-20 -top-24 h-[300px] w-[300px] rounded-full bg-primary/5 blur-[120px]" />
      <div className="pointer-events-none fixed -bottom-28 -left-24 h-[350px] w-[350px] rounded-full bg-secondary/5 blur-[120px]" />

      <div className="phone-shell relative z-10 flex min-h-svh flex-col items-center justify-between px-5 py-12">
        <div className="w-full text-center">
          <div className="mb-10 flex justify-center">
            <BrandMark partnerName={partnerConfig.appName} subtitle={partnerConfig.eventName} />
          </div>
          <h1 className="px-4 text-[28px] font-bold leading-[34px] tracking-normal text-on-surface">Direkt rein in die Bubble</h1>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">Ohne E-Mail, ohne Passwort.</p>
        </div>

        <div className="flex w-full flex-col items-center gap-7">
          <div className="group relative">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-4 border-surface-container-high bg-surface-container-highest shadow-ambient animate-float-soft">
              <Image src={partnerConfig.images.onboarding} alt="Avatar Preview" fill sizes="128px" className="object-cover" />
            </div>
            <div className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-active">
              <Camera size={19} />
            </div>
          </div>

          {showProfileForm ? (
            <form className="w-full space-y-4 rounded-[2rem] bg-white p-5 shadow-ambient" onSubmit={handleSubmit}>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-on-surface">Nickname</span>
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  placeholder="Dein Nickname"
                  className="h-14 w-full rounded-[1.25rem] border-2 border-outline-variant/40 bg-surface px-4 text-base font-semibold text-on-surface outline-none transition placeholder:text-outline focus:border-primary"
                  maxLength={24}
                  autoFocus
                />
              </label>
              <p className="rounded-[1.25rem] bg-surface-container-low p-4 text-sm leading-5 text-on-surface-variant">Profilbild ist optional. Für diese Demo nehmen wir deinen Bubble-Avatar.</p>
              <button className="flex min-h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-active transition active:scale-95" type="submit">
                Profil speichern
              </button>
            </form>
          ) : null}
        </div>

        <div className="w-full space-y-4">
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-cta transition active:scale-95" type="button" onClick={continueAnonymously}>
            <Zap size={19} />
            {busy ? "Einen Moment ..." : "Anonym weiter"}
          </button>
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-outline-variant bg-white text-sm font-bold text-primary transition active:scale-95" type="button" onClick={() => setShowProfileForm(true)}>
            <UserRound size={19} />
            Profil erstellen
          </button>
          {message ? <p className="rounded-[1.25rem] bg-white p-3 text-center text-sm font-semibold text-on-surface-variant shadow-ambient">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
