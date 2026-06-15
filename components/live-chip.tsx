export function LiveChip({ dark = false }: { dark?: boolean }) {
  return (
    <div
      className={[
        "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-normal",
        dark ? "border border-white/20 bg-white/10 text-white backdrop-blur-md" : "bg-white text-secondary shadow-ambient",
      ].join(" ")}
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-pulse-live" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
      </span>
      Live
    </div>
  );
}
