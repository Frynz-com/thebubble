"use client";

import { Camera, UserRound, Zap } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { AvatarCircle } from "@/components/avatar-circle";
import { BrandMark } from "@/components/brand-mark";
import { BubbleSessionBootstrap } from "@/components/bubble-session-bootstrap";
import { ensureGuestVisitor, ensureProfileVisitor } from "@/lib/bubble-service";
import { uploadVisitorAvatar } from "@/lib/avatar-service";
import { bubblePath, getCurrentBubbleSlug } from "@/lib/bubble-routing";
import { bubbleThemeStyle, useBubbleConfig } from "@/lib/bubble-config";
import { logSupabaseError } from "@/lib/supabase/log-error";
import { trackBubbleEvent } from "@/lib/analytics";

export default function JoinPage() {
  const router = useRouter();
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [nickname, setNickname] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const bubbleSlug = getCurrentBubbleSlug();
  const config = useBubbleConfig(bubbleSlug);

  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview("");
      return undefined;
    }

    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  async function continueAnonymously() {
    setBusy(true);
    setMessage("");
    try {
      const result = await ensureGuestVisitor(bubbleSlug);
      void trackBubbleEvent("anonymous_continue", {}, bubbleSlug);
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
      const result = await ensureProfileVisitor({
        name: nickname.trim() || "Bubble Gast",
        avatar: "",
        isAnonymous: false,
      }, bubbleSlug);
      if (avatarFile) {
        setUploadStatus("Profilbild wird hochgeladen ...");
        await uploadVisitorAvatar(avatarFile, nickname.trim() || "Bubble Gast", {
          bubbleSlug,
          onStage: (stage) => setUploadStatus(stage === "processing" ? "Bild wird zugeschnitten ..." : "Profilbild wird hochgeladen ..."),
        });
      }
      void trackBubbleEvent("profile_create", { hasNickname: Boolean(nickname.trim()) }, bubbleSlug);
      if (result.message) setMessage(result.message);
      window.dispatchEvent(new Event("bubble-profile-change"));
      router.push(bubblePath(bubbleSlug, "/live"));
    } catch (error) {
      logSupabaseError("join.profile", error);
      setMessage("Profil konnte nicht gespeichert werden.");
    } finally {
      setBusy(false);
      setUploadStatus("");
    }
  }

  function chooseAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setAvatarFile(file);
  }

  return (
    <main className="min-h-svh overflow-hidden bg-surface" style={bubbleThemeStyle(config)}>
      <BubbleSessionBootstrap bubbleSlug={bubbleSlug} />

      <div className="phone-shell relative z-10 flex min-h-svh flex-col items-center justify-between px-5 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]">
        <div className="w-full text-center">
          <div className="mb-8 flex justify-center">
            <BrandMark
              partnerName={config.partnerName || config.name}
              subtitle={config.type}
              logoUrl={config.logoUrl}
              logoShape={config.logoShape}
              logoFit={config.logoFit}
              logoBackground={config.logoBackground}
              logoSize={config.logoSize}
              logoCropX={config.logoCropX}
              logoCropY={config.logoCropY}
              logoZoom={config.logoZoom}
            />
          </div>
          <h1 className="px-4 text-[28px] font-bold leading-[34px] tracking-normal text-on-surface">Direkt rein in die Bubble</h1>
          <p className="mt-3 text-base leading-6 text-on-surface-variant">Ohne E-Mail, ohne Passwort.</p>
        </div>

        <div className="flex w-full flex-col items-center gap-6">
          <div className="relative">
            <AvatarCircle src={avatarPreview} name={nickname || "Gast"} size="xl" fallback={showProfileForm ? "camera" : "user"} className="border-4 border-white shadow-ambient" />
            <div className="absolute bottom-1 right-1 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-on-primary shadow-active">
              <Camera size={19} />
            </div>
          </div>

          {showProfileForm ? (
            <form className="w-full space-y-4" onSubmit={handleSubmit}>
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
              <label className="flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-outline-variant bg-white text-sm font-bold text-primary transition active:scale-95">
                <Camera size={18} />
                {avatarFile ? "Anderes Bild wählen" : "Profilbild wählen"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={chooseAvatar} disabled={busy} />
              </label>
              {uploadStatus ? <p className="text-center text-xs font-bold text-primary">{uploadStatus}</p> : null}
              <button className="flex min-h-14 w-full items-center justify-center rounded-full bg-primary text-sm font-bold text-on-primary shadow-active transition active:scale-95 disabled:opacity-60" type="submit" disabled={busy}>
                {busy ? "Speichere ..." : "Profil speichern"}
              </button>
            </form>
          ) : null}
        </div>

        <div className="w-full space-y-4">
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary-container text-sm font-bold text-on-primary-container shadow-cta transition active:scale-95 disabled:opacity-60" type="button" onClick={continueAnonymously} disabled={busy}>
            <Zap size={19} />
            {busy ? "Einen Moment ..." : "Anonym weiter"}
          </button>
          <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-outline-variant bg-white text-sm font-bold text-primary transition active:scale-95 disabled:opacity-60" type="button" onClick={() => setShowProfileForm(true)} disabled={busy}>
            <UserRound size={19} />
            Profil erstellen
          </button>
          {message ? <p className="rounded-[1.25rem] bg-white p-3 text-center text-sm font-semibold text-on-surface-variant shadow-ambient">{message}</p> : null}
        </div>
      </div>
    </main>
  );
}
