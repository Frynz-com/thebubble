"use client";

import Image from "next/image";
import { ImageUp, LogOut, Pencil, UserRound, X } from "lucide-react";
import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";
import { ensureProfileVisitor, getStoredVisitor, leaveVisitor } from "@/lib/bubble-service";
import { uploadVisitorAvatar } from "@/lib/avatar-service";
import { bubblePath, getBubbleSlugFromPathname } from "@/lib/bubble-routing";
import { partnerConfig } from "@/lib/partner-config";
import { BubbleProfile, clearStoredProfile, getStoredProfile, getStoredVisitorId, setStoredProfile } from "@/lib/storage";

function defaultProfile(): BubbleProfile {
  return {
    name: "Bubble Gast",
    avatar: partnerConfig.images.user,
    isAnonymous: true,
  };
}

export function ProfileSheet() {
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<BubbleProfile>(defaultProfile);
  const [name, setName] = useState("");
  const [avatar, setAvatar] = useState(partnerConfig.images.user);
  const [message, setMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState("");
  const activeSlug = getBubbleSlugFromPathname(pathname);

  useEffect(() => {
    setMounted(true);
    const slug = getBubbleSlugFromPathname(pathname);
    const stored = getStoredProfile(slug) ?? defaultProfile();
    setProfile(stored);
    setName(stored.name);
    setAvatar(stored.avatar);

    async function hydrateFromVisitor() {
      try {
        const visitor = await getStoredVisitor(slug);
        if (!visitor) return;
        const nextProfile = {
          name: visitor.nickname,
          avatar: visitor.avatar_url ?? partnerConfig.images.user,
          isAnonymous: visitor.is_guest,
        };
        setStoredProfile(nextProfile, slug);
        setProfile(nextProfile);
        setName(nextProfile.name);
        setAvatar(nextProfile.avatar);
      } catch {
        setMessage("Profil konnte nicht geladen werden.");
      }
    }

    void hydrateFromVisitor();
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  async function refreshProfile(next: BubbleProfile) {
    setStoredProfile(next, activeSlug);
    setProfile(next);
    setName(next.name);
    setAvatar(next.avatar);
    window.dispatchEvent(new Event("bubble-profile-change"));
    const result = await ensureProfileVisitor(next, activeSlug);
    if (result.message) setMessage(result.message);
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    try {
      await refreshProfile({
        name: name.trim() || "Bubble Gast",
        avatar,
        isAnonymous: false,
      });
      setEditing(false);
    } catch {
      setMessage("Profil konnte nicht gespeichert werden.");
    }
  }

  async function uploadAvatar(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(true);
    setUploadStatus("Bild wird zugeschnitten ...");
    setMessage("");
    try {
      const result = await uploadVisitorAvatar(file, name.trim() || profile.name, {
        bubbleSlug: activeSlug,
        onStage: (stage) => {
          setUploadStatus(stage === "processing" ? "Bild wird zugeschnitten ..." : "Profilbild wird hochgeladen ...");
        },
      });
      setProfile(result.profile);
      setName(result.profile.name);
      setAvatar(result.publicUrl);
      window.dispatchEvent(new Event("bubble-profile-change"));
      setMessage("Profilbild wurde aktualisiert.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Profilbild konnte nicht hochgeladen werden.");
    } finally {
      setUploading(false);
      setUploadStatus("");
    }
  }

  async function leaveBubble() {
    const visitorId = getStoredVisitorId(activeSlug);
    if (visitorId) await leaveVisitor(visitorId, activeSlug);
    clearStoredProfile(activeSlug);
    setOpen(false);
    setEditing(false);
    router.push(bubblePath(activeSlug));
  }

  function closeSheet() {
    setOpen(false);
    setEditing(false);
    setMessage("");
    setUploading(false);
    setUploadStatus("");
    setName(profile.name);
    setAvatar(profile.avatar);
  }

  const avatarChoices = Array.from(new Set([partnerConfig.images.user, partnerConfig.images.onboarding, ...partnerConfig.people.slice(0, 3).map((person) => person.avatar)]));

  const sheet = (
    <div className="fixed inset-0 z-[100] flex items-end bg-on-surface/30 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 h-full w-full cursor-default" aria-label="Profil schließen" type="button" onClick={closeSheet} />
      <section className="phone-shell relative w-full max-h-[calc(100svh-2rem)] overflow-y-auto rounded-[2rem] bg-white p-5 shadow-active animate-pop-in">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold uppercase tracking-[0.14em] text-outline">Profil</p>
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-container-low text-on-surface" type="button" onClick={closeSheet} aria-label="Schließen">
            <X size={18} />
          </button>
        </div>

        <div className="mb-5 flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-surface-container-high">
            <Image src={profile.avatar} alt="" fill sizes="64px" className="rounded-full object-cover object-center" />
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold leading-7 text-on-surface">{profile.name}</h2>
            <p className="text-sm font-semibold text-on-surface-variant">{profile.isAnonymous ? "Anonym in der Bubble" : "Profil aktiv"}</p>
          </div>
        </div>

        {editing ? (
          <form className="space-y-4" onSubmit={saveProfile}>
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-on-surface">Nickname</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="h-14 w-full rounded-[1.25rem] border-2 border-outline-variant/40 bg-surface px-4 text-base font-semibold outline-none focus:border-primary"
                maxLength={24}
                placeholder="Dein Nickname"
              />
            </label>

            <div>
              <p className="mb-3 text-sm font-bold text-on-surface">Profilbild</p>
              <div className="grid grid-cols-5 gap-3">
                {avatarChoices.map((imageUrl) => (
                  <button
                    key={imageUrl}
                    className={[
                      "relative h-12 w-12 overflow-hidden rounded-full border-2 bg-surface-container-high",
                      avatar === imageUrl ? "border-primary" : "border-transparent",
                    ].join(" ")}
                    type="button"
                    onClick={() => setAvatar(imageUrl)}
                    aria-label="Profilbild wählen"
                  >
                    <Image src={imageUrl} alt="" fill sizes="48px" className="rounded-full object-cover object-center" />
                  </button>
                ))}
              </div>
              <label className="mt-4 flex min-h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-dashed border-outline-variant bg-surface text-sm font-bold text-primary transition active:scale-95">
                <ImageUp size={18} />
                {uploading ? (uploadStatus || "Bild wird zugeschnitten ...") : "Eigenes Bild hochladen"}
                <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif" onChange={uploadAvatar} disabled={uploading} />
              </label>
              {uploading && uploadStatus ? <p className="mt-2 text-xs font-bold leading-5 text-primary">{uploadStatus}</p> : null}
              <p className="mt-2 text-xs font-semibold leading-5 text-outline">JPG, PNG, HEIC/HEIF oder WebP. Maximal 15 MB.</p>
            </div>

            <button className="min-h-14 w-full rounded-full bg-primary text-sm font-bold text-on-primary shadow-active disabled:opacity-60" type="submit" disabled={uploading}>
              {uploading ? "Bitte warten ..." : "Profil speichern"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-bold text-on-primary shadow-active"
              type="button"
              onClick={() => {
                setName(profile.name);
                setAvatar(profile.avatar);
                setEditing(true);
              }}
            >
              {profile.isAnonymous ? <UserRound size={18} /> : <Pencil size={18} />}
              {profile.isAnonymous ? "Profil erstellen" : "Profil bearbeiten"}
            </button>
            <button className="flex min-h-14 w-full items-center justify-center gap-2 rounded-full border-2 border-outline-variant text-sm font-bold text-primary" type="button" onClick={leaveBubble}>
              <LogOut size={18} />
              Bubble verlassen
            </button>
          </div>
        )}
        {message ? <p className="mt-4 rounded-[1rem] bg-surface-container-low p-3 text-sm font-semibold text-on-surface-variant">{message}</p> : null}
      </section>
    </div>
  );

  return (
    <>
      <button
        aria-label="Profil öffnen"
        className="relative h-10 w-10 overflow-hidden rounded-full border-2 border-primary-container bg-surface-container-high"
        type="button"
        onClick={() => setOpen(true)}
      >
        <Image src={profile.avatar} alt="Profil" fill sizes="40px" className="rounded-full object-cover object-center" />
      </button>

      {mounted && open ? createPortal(sheet, document.body) : null}
    </>
  );
}
