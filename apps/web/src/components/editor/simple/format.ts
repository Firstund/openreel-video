/** 83.4 -> "1:23.4"; with hours "1:02:03". */
export function clock(seconds: number, tenths = false): string {
  const v = Math.max(0, seconds);
  const h = Math.floor(v / 3600);
  const m = Math.floor((v % 3600) / 60);
  const s = v % 60;
  const sec = tenths ? s.toFixed(1).padStart(4, "0") : String(Math.floor(s)).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${sec}` : `${m}:${sec}`;
}

/** Seconds as "16.2초"-style text via the caller's translator. */
export const secs = (v: number) => (Math.round(v * 10) / 10).toFixed(1);

export function bytes(n: number): string {
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)} GB`;
  if (n >= 1e7) return `${Math.round(n / 1e6)} MB`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(n / 1e3))} KB`;
}
