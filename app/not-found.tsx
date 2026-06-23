import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-surface px-5 py-10">
      <section className="w-full max-w-md rounded-[1.5rem] bg-white p-6 text-center shadow-ambient">
        <p className="text-sm font-extrabold uppercase tracking-[0.14em] text-primary">The Bubble</p>
        <h1 className="mt-3 text-3xl font-black text-on-surface">Bubble nicht gefunden</h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-on-surface-variant">
          Diese Bubble ist nicht aktiv oder der Link ist nicht korrekt.
        </p>
        <Link className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-primary px-5 text-sm font-bold text-on-primary" href="/demo">
          Demo öffnen
        </Link>
      </section>
    </main>
  );
}
