"use client";

import { ensureProfileVisitor, getActiveBubble, getStoredVisitor } from "./bubble-service";
import { getSupabaseBrowserClient } from "./supabase/browser";
import { logSupabaseError } from "./supabase/log-error";
import { BubbleProfile, getStoredProfile, setStoredProfile } from "./storage";

export const profileImagesBucket = "profile-images";

const maxSourceImageSize = 15 * 1024 * 1024;
const acceptedTypes = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp", "image/heic", "image/heif"]);
const acceptedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"];

export type AvatarUploadResult = {
  profile: BubbleProfile;
  publicUrl: string;
  path: string;
};

type AvatarUploadStage = "processing" | "uploading";

type AvatarUploadOptions = {
  onStage?: (stage: AvatarUploadStage) => void;
};

export async function uploadVisitorAvatar(file: File, nickname?: string, options?: AvatarUploadOptions): Promise<AvatarUploadResult> {
  console.info("[avatar-upload] start", {
    bucket: profileImagesBucket,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  });

  if (!isAcceptedImage(file)) {
    throw new Error("Bitte lade ein JPG, PNG, HEIC/HEIF oder WebP hoch.");
  }

  if (file.size > maxSourceImageSize) {
    throw new Error("Bitte wähle ein Bild unter 15 MB.");
  }

  const supabase = getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error("Supabase ist nicht konfiguriert.");
  }

  const { data: bucket, error: bucketError } = await supabase.storage.getBucket(profileImagesBucket);
  if (bucketError) {
    console.error("[avatar-upload] bucket check failed", {
      bucket: profileImagesBucket,
      error: bucketError,
    });
  } else {
    console.info("[avatar-upload] bucket check ok", {
      bucket: bucket.name,
      public: bucket.public,
      fileSizeLimit: bucket.file_size_limit,
      allowedMimeTypes: bucket.allowed_mime_types,
    });
  }

  const [bubble, visitor] = await Promise.all([getActiveBubble(), getStoredVisitor()]);
  if (!bubble || !visitor) {
    console.error("[avatar-upload] missing bubble or visitor", {
      hasBubble: Boolean(bubble),
      bubbleId: bubble?.id ?? null,
      hasVisitor: Boolean(visitor),
      visitorId: visitor?.id ?? null,
    });
    throw new Error("Bitte betrete zuerst die Bubble.");
  }

  options?.onStage?.("processing");
  const avatarImage = await resizeAvatarImage(file, 512);
  const path = `${bubble.id}/${visitor.id}/avatar.jpg`;
  console.info("[avatar-upload] upload target", {
    bucket: profileImagesBucket,
    path,
    bubbleId: bubble.id,
    visitorId: visitor.id,
    contentType: avatarImage.contentType,
    outputSize: avatarImage.blob.size,
  });

  options?.onStage?.("uploading");
  const { error } = await supabase.storage.from(profileImagesBucket).upload(path, avatarImage.blob, {
    cacheControl: "3600",
    contentType: avatarImage.contentType,
    upsert: true,
  });

  if (error) {
    const detail = formatStorageError(error);
    console.error("[avatar-upload] supabase storage upload failed", {
      bucket: profileImagesBucket,
      path,
      bubbleId: bubble.id,
      visitorId: visitor.id,
      contentType: avatarImage.contentType,
      error,
    });
    logSupabaseError("uploadVisitorAvatar.storage", error);
    throw new Error(`Profilbild konnte nicht hochgeladen werden: ${detail}`);
  }

  const { data } = supabase.storage.from(profileImagesBucket).getPublicUrl(path);
  const publicUrl = `${data.publicUrl}?v=${Date.now()}`;
  const currentProfile = getStoredProfile();
  const nextProfile: BubbleProfile = {
    name: nickname?.trim() || currentProfile?.name || visitor.nickname,
    avatar: publicUrl,
    isAnonymous: false,
  };

  try {
    await ensureProfileVisitor(nextProfile);
  } catch (error) {
    console.error("[avatar-upload] visitor avatar_url update failed", {
      bubbleId: bubble.id,
      visitorId: visitor.id,
      publicUrl,
      error,
    });
    throw error;
  }
  setStoredProfile(nextProfile);

  return {
    profile: nextProfile,
    publicUrl,
    path,
  };
}

async function resizeAvatarImage(file: File, size: number) {
  const image = await loadImage(file);
  const sourceSize = Math.min(image.naturalWidth, image.naturalHeight);
  const sourceX = Math.max(0, Math.floor((image.naturalWidth - sourceSize) / 2));
  const sourceY = Math.max(0, Math.floor((image.naturalHeight - sourceSize) / 2));
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Bild konnte nicht verarbeitet werden.");
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.clearRect(0, 0, size, size);
  console.info("[avatar-upload] center crop", {
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    sourceX,
    sourceY,
    sourceSize,
    targetSize: size,
  });
  context.drawImage(image, sourceX, sourceY, sourceSize, sourceSize, 0, 0, size, size);

  const jpegBlob = await canvasToBlob(canvas, "image/jpeg", 0.82);
  if (!jpegBlob) {
    console.error("[avatar-upload] canvas.toBlob failed", {
      sourceType: file.type,
      sourceSize: file.size,
      targetType: "image/jpeg",
      targetSize: size,
    });
    throw new Error("Bild konnte nicht optimiert werden. Bitte wähle ein anderes Foto.");
  }

  console.info("[avatar-upload] optimized image", {
    sourceSize: file.size,
    outputSize: jpegBlob.size,
    contentType: "image/jpeg",
  });

  return {
    blob: jpegBlob,
    contentType: "image/jpeg",
  };
}

function canvasToBlob(canvas: HTMLCanvasElement, contentType: string, quality: number) {
  return new Promise<Blob | null>((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      contentType,
      quality,
    );
  });
}

function loadImage(file: File) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Bild konnte nicht gelesen werden."));
    };
    image.src = url;
  });
}

function formatStorageError(error: unknown) {
  if (!error || typeof error !== "object") return String(error);
  const record = error as Record<string, unknown>;
  return [record.message, record.statusCode ? `Status ${record.statusCode}` : null, record.error, record.name]
    .filter(Boolean)
    .join(" | ");
}

function isAcceptedImage(file: File) {
  const type = file.type.toLowerCase();
  if (acceptedTypes.has(type)) return true;

  const name = file.name.toLowerCase();
  return acceptedExtensions.some((extension) => name.endsWith(extension));
}
