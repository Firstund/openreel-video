import { useCallback, useEffect, useRef, useState } from "react";
import { useUIStore } from "../../../stores/ui-store";
import { useT } from "../../../i18n";
import { sendToStoryCut, useStoryCutStore } from "../StoryCutBridge";
import { bytes } from "./format";

interface RenderState { status?: "running" | "done" | "error"; progress?: number; file?: string; size?: number; started?: number; error?: string; small?: boolean }

/** story-cut job render: send the edit, ask the PC to render, poll, then offer the MP4. */
function StoryCutExport() {
  const t = useT();
  const link = useStoryCutStore((s) => s.link)!;
  const sending = useStoryCutStore((s) => s.sending);
  const sentAt = useStoryCutStore((s) => s.sentAt);
  const dirty = useStoryCutStore((s) => s.dirty);
  const [render, setRender] = useState<RenderState>({});
  const [burn, setBurn] = useState(true);
  const [starting, setStarting] = useState(false);
  const timer = useRef<number | null>(null);
  const api = `${link.base}api/jobs/${link.job}`;

  const poll = useCallback(async () => {
    try {
      const res = await fetch(api, { credentials: "include", cache: "no-store" });
      if (!res.ok) return;
      const job = (await res.json()) as { render?: RenderState };
      setRender(job.render ?? {});
      if (job.render?.status !== "running" && timer.current) { window.clearInterval(timer.current); timer.current = null; }
    } catch { /* PC asleep or offline: keep the last state */ }
  }, [api]);
  const startPolling = useCallback(() => {
    if (timer.current) return;
    timer.current = window.setInterval(() => void poll(), 1500);
  }, [poll]);
  useEffect(() => { void poll().then(() => undefined); return () => { if (timer.current) window.clearInterval(timer.current); timer.current = null; }; }, [poll]);
  useEffect(() => { if (render.status === "running") startPolling(); }, [render.status, startPolling]);

  const make = async (small: boolean) => {
    setStarting(true);
    try {
      // Always render what is on screen: send first when it was never sent or changed since.
      if (!sentAt || dirty) { const ok = await sendToStoryCut(); if (!ok) return; }
      const res = await fetch(`${api}/render`, {
        method: "POST", credentials: "include", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ burn_subs: burn, small }),
      });
      if (!res.ok) throw new Error(`story-cut ${res.status}`);
      const job = (await res.json()) as { render?: RenderState };
      setRender(job.render ?? { status: "running", progress: 0 });
      startPolling();
    } catch (e) {
      setRender({ status: "error", error: e instanceof Error ? e.message : String(e) });
    } finally {
      setStarting(false);
    }
  };

  const out = (inline: boolean) => `${api}/output?v=${Math.round(render.started ?? 0)}${inline ? "&inline=1" : ""}`;
  const running = render.status === "running";
  return (
    <section className="sm-card">
      <h3>{t("export.scTitle")}</h3>
      <p className="sm-hint">{t("export.scHint")}</p>
      <button type="button" className="sm-full" disabled={sending} onClick={() => void sendToStoryCut()}>
        {sending ? t("export.sending") : sentAt && !dirty ? `✓ ${t("export.sent")}` : t("export.send")}
      </button>
      {sentAt && dirty && <p className="sm-warn">{t("export.unsaved")}</p>}
      <label className="sm-check"><input type="checkbox" checked={burn} onChange={(e) => setBurn(e.target.checked)} /> {t("export.burn")}</label>
      <button type="button" className="sm-primary sm-full sm-big" disabled={running || starting || sending} onClick={() => void make(false)}>{t("export.render")}</button>
      <button type="button" className="sm-full" disabled={running || starting || sending} onClick={() => void make(true)}>{t("export.renderSmall")}</button>
      {running && (
        <div className="sm-progress" role="status">
          <span>{t("export.rendering", { p: Math.round((render.progress ?? 0) * 100) })}</span>
          <div className="sm-bar"><i style={{ width: `${(render.progress ?? 0) * 100}%` }} /></div>
          <small>{t("export.renderHint")}</small>
        </div>
      )}
      {render.status === "done" && render.file && (
        <div className="sm-done">
          <b>✅ {t("export.done", { f: render.file, s: bytes(render.size ?? 0) })}</b>
          {/* No `download` attribute: Chrome cancels <a download> on a self-signed HTTPS page; the server names the file. */}
          <a className="sm-btn sm-primary sm-full sm-big" href={out(false)}>{t("export.download", { s: bytes(render.size ?? 0) })}</a>
          <a className="sm-btn sm-full" href={out(true)} target="_blank" rel="noopener">{t("export.open")}</a>
        </div>
      )}
      {render.status === "error" && <p className="sm-error">{t("export.renderFailed", { e: render.error ?? "" })}</p>}
    </section>
  );
}

export function SimpleExportTab() {
  const t = useT();
  const link = useStoryCutStore((s) => s.link);
  const exportState = useUIStore((s) => s.exportState);
  const pct = Math.round(exportState.progress <= 1 ? exportState.progress * 100 : exportState.progress);
  return (
    <div className="sm-tab sm-export">
      {link ? <StoryCutExport /> : (
        <section className="sm-card">
          <h3>{t("export.scTitle")}</h3>
          <p className="sm-hint">{t("export.noLink")}</p>
          <a className="sm-btn sm-full" href="/storycut/">{t("export.openSc")}</a>
        </section>
      )}
      <section className="sm-card">
        <h3>{t("export.phoneTitle")}</h3>
        <p className="sm-hint">{t("export.phoneHint")}</p>
        {exportState.isExporting ? (
          <div className="sm-progress" role="status">
            <span>{exportState.phase} {pct}%</span>
            <div className="sm-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        ) : (
          <button type="button" className="sm-full" onClick={() => useUIStore.getState().openModal("export")}>{t("export.phoneButton")}</button>
        )}
      </section>
    </div>
  );
}
