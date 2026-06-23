import Image from "next/image";
import { Camera, UserRound } from "lucide-react";

type AvatarCircleProps = {
  src?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fallback?: "user" | "camera" | "initial";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10",
  md: "h-12 w-12",
  lg: "h-16 w-16",
  xl: "h-32 w-32",
};

const iconSizes = {
  sm: 18,
  md: 21,
  lg: 26,
  xl: 42,
};

function initialFromName(name?: string) {
  const clean = name?.trim();
  if (!clean) return "";
  return clean.slice(0, 1).toUpperCase();
}

export function AvatarCircle({ src, name, size = "md", fallback = "user", className = "" }: AvatarCircleProps) {
  const imageSrc = typeof src === "string" && src.trim() ? src.trim() : "";
  const initial = fallback === "initial" ? initialFromName(name) : "";
  const Icon = fallback === "camera" ? Camera : UserRound;

  return (
    <span className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-container-high text-primary ${sizeClasses[size]} ${className}`}>
      {imageSrc ? (
        <Image src={imageSrc} alt={name ?? ""} fill sizes={size === "xl" ? "128px" : size === "lg" ? "64px" : "48px"} className="rounded-full object-cover object-center" />
      ) : initial ? (
        <span className="text-lg font-black text-primary">{initial}</span>
      ) : (
        <Icon size={iconSizes[size]} strokeWidth={2.4} />
      )}
    </span>
  );
}
