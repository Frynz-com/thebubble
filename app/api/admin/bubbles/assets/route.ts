import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";

const bucketName = "bubble-assets";
const maxFileSize = 8 * 1024 * 1024;
const allowedMimeTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const extensionByMimeType: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

type AssetKind = "logo" | "cover";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, { status });
}

function getSubmittedSecret(request: NextRequest) {
  return request.headers.get("x-admin-secret") ?? "";
}

function isAuthorized(request: NextRequest) {
  const adminSecret = process.env.ADMIN_SECRET;
  return Boolean(adminSecret && getSubmittedSecret(request) === adminSecret);
}

function normalizeSlug(value: unknown) {
  return typeof value === "string"
    ? value
        .trim()
        .toLowerCase()
        .replace(/ä/g, "ae")
        .replace(/ö/g, "oe")
        .replace(/ü/g, "ue")
        .replace(/ß/g, "ss")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 64)
    : "";
}

function normalizeKind(value: unknown): AssetKind | null {
  return value === "logo" || value === "cover" ? value : null;
}

function getFileExtension(file: File) {
  const byMime = extensionByMimeType[file.type];
  if (byMime) return byMime;

  const extension = file.name.toLowerCase().split(".").pop();
  return extension && ["jpg", "jpeg", "png", "webp", "svg"].includes(extension) ? extension.replace("jpeg", "jpg") : "";
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return jsonResponse({ error: "Nicht autorisiert." }, 401);
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return jsonResponse({ error: "Supabase Admin Client ist nicht konfiguriert." }, 500);
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ error: "Upload-Daten konnten nicht gelesen werden." }, 400);
  }

  const slug = normalizeSlug(formData.get("slug"));
  const kind = normalizeKind(formData.get("kind"));
  const file = formData.get("file");

  if (!slug) return jsonResponse({ error: "Slug ist erforderlich." }, 400);
  if (!kind) return jsonResponse({ error: "Asset-Typ ist ungültig." }, 400);
  if (!(file instanceof File)) return jsonResponse({ error: "Keine Datei erhalten." }, 400);
  if (!allowedMimeTypes.has(file.type)) return jsonResponse({ error: "Bitte JPG, PNG, WebP oder SVG hochladen." }, 400);
  if (file.size > maxFileSize) return jsonResponse({ error: "Bitte ein Bild unter 8 MB hochladen." }, 400);

  const { data: bubble, error: bubbleError } = await supabase.from("bubbles").select("id,slug").eq("slug", slug).maybeSingle();
  if (bubbleError) {
    return jsonResponse({ error: bubbleError.message, details: bubbleError.details, hint: bubbleError.hint, code: bubbleError.code }, 500);
  }
  if (!bubble) return jsonResponse({ error: "Bubble wurde nicht gefunden. Bitte zuerst speichern." }, 404);

  const extension = getFileExtension(file);
  if (!extension) return jsonResponse({ error: "Dateiendung konnte nicht erkannt werden." }, 400);

  const path = `${slug}/${kind}.${extension}`;
  const { error: uploadError } = await supabase.storage.from(bucketName).upload(path, file, {
    cacheControl: "3600",
    contentType: file.type,
    upsert: true,
  });

  if (uploadError) {
    console.error("[admin-assets] upload failed", {
      bucket: bucketName,
      path,
      slug,
      kind,
      message: uploadError.message,
      name: uploadError.name,
    });
    return jsonResponse({ error: uploadError.message, details: uploadError.name }, 500);
  }

  const { data } = supabase.storage.from(bucketName).getPublicUrl(path);

  return jsonResponse({
    bucket: bucketName,
    path,
    publicUrl: `${data.publicUrl}?v=${Date.now()}`,
  });
}
