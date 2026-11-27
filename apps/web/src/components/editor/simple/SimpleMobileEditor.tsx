/**
 * Phone simple mode: portrait, Korean first, big touch targets.
 *
 *   header (undo / redo / menu)
 *   preview + overview strip (tap or drag to seek) + transport
 *   tab content: 클립 / 자막 / AI / 내보내기
 *   bottom tab bar
 *
 * It replaces the full editor on touch phones (toggle in the menu; remembered). The full editor's engines,
 * autosave and story-cut loading keep running underneath because EditorInterface still owns them.
 */
import React, { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { Preview } from "../Preview";
import { Toolbar } from "../Toolbar";
import { StoryCutBridge, useStoryCutStore } from "../StoryCutBridge";
import { PanelErrorBoundary } from "../../ErrorBoundary";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import { useSimpleModeStore } from "../../../stores/simple-mode-store";
import { useLocaleStore, useT, type MessageKey } from "../../../i18n";
import { clock } from "./format";
import { SimpleClipsTab, useMainClips } from "./SimpleClipsTab";
import { SimpleCaptionsTab } from "./SimpleCaptionsTab";
import { SimpleExportTab } from "./SimpleExportTab";
import { ONBOARDING_KEY } from "../tour/tour-steps";
import "./simple-mobile.css";

const SimpleAITab = React.lazy(() => import("./SimpleAITab").then((m) => ({ default: m.SimpleAITab })));

type Tab = "clips" | "captions" | "ai" | "export";
const TABS: { id: Tab; label: MessageKey; icon: string }[] = [
  { id: "clips", label: "tab.clips", icon: "🎞" },
  { id: "captions", label: "tab.captions", icon: "💬" },
  { id: "ai", label: "tab.ai", icon: "✨" },
  { id: "export", label: "tab.export", icon: "⬇" },
];
const EMPTY_SUBS: { startTime: number }[] = [];

/** The whole timeline in one strip: clip blocks, caption ticks and the playhead. Tap or drag to seek. */
function Overview() {
  const t = useT();
  const clips = useMainClips();
  const subs = useProjectStore((s) => s.project.timeline.subtitles ?? EMPTY_SUBS);
  const duration = Math.max(0.001, useProjectStore((s) => s.project.timeline.duration) || 0, ...clips.map((c) => c.startTime + c.duration));
  const playhead = useTimelineStore((s) => s.playheadPosition);
  const ref = useRef<HTMLDivElement>(null);
  const seekFrom = (clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    useTimelineStore.getState().seekTo(Math.min(duration - 0.001, Math.max(0, ((clientX - r.left) / r.width) * duration)));
  };
  const down = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    useTimelineStore.getState().pause();
    e.currentTarget.setPointerCapture(e.pointerId);
    seekFrom(e.clientX);
  };
  return (
    <div className="sm-overview" ref={ref} role="slider" aria-label={t("player.seek")} aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(playhead)}
      onPointerDown={down} onPointerMove={(e) => { if (e.buttons || e.pointerType === "touch") { if (e.currentTarget.hasPointerCapture(e.pointerId)) seekFrom(e.clientX); } }}>
      {clips.map((c, i) => (
        <span key={c.id} className={`sm-ov-clip ${i % 2 ? "alt" : ""}`} style={{ left: `${(c.startTime / duration) * 100}%`, width: `${(c.duration / duration) * 100}%` }}>
          {c.duration / duration > 0.04 ? i + 1 : ""}
        </span>
      ))}
      {subs.length < 1500 && subs.map((s, i) => <i key={i} className="sm-ov-sub" style={{ left: `${(s.startTime / duration) * 100}%` }} />)}
      <b className="sm-ov-head" style={{ left: `${Math.min(100, (playhead / duration) * 100)}%` }} />
    </div>
  );
}

function Transport() {
  const t = useT();
  const playing = useTimelineStore((s) => s.playbackState === "playing");
  const locked = useTimelineStore((s) => s.playbackLockedReason);
  const playhead = useTimelineStore((s) => s.playheadPosition);
  const duration = useProjectStore((s) => s.project.timeline.duration) || 0;
  const seek = (d: number) => useTimelineStore.getState().seekTo(Math.min(Math.max(0, duration - 0.001), Math.max(0, useTimelineStore.getState().playheadPosition + d)));
  return (
    <div className="sm-transport">
      <span className="sm-time">{clock(playhead, true)}<small> / {clock(duration)}</small></span>
      <button type="button" aria-label={t("player.back")} onClick={() => seek(-5)}>↺5</button>
      <button type="button" className="sm-play" aria-label={playing ? t("player.pause") : t("player.play")} disabled={Boolean(locked)} onClick={() => useTimelineStore.getState().togglePlayback()}>
        {playing ? "❚❚" : "▶"}
      </button>
      <button type="button" aria-label={t("player.forward")} onClick={() => seek(5)}>5↻</button>
      <span className="sm-time-spacer" />
    </div>
  );
}

function Menu({ onClose }: { onClose: () => void }) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const link = useStoryCutStore((s) => s.link);
  return (
    <div className="sm-sheet-backdrop" onClick={onClose}>
      <div className="sm-sheet" role="dialog" aria-label={t("mode.simple")} onClick={(e) => e.stopPropagation()}>
        <div className="sm-row">
          <b>{t("lang.label")}</b>
          <div className="sm-seg">
            <button type="button" aria-pressed={locale === "ko"} onClick={() => useLocaleStore.getState().setLocale("ko")}>한국어</button>
            <button type="button" aria-pressed={locale === "en"} onClick={() => useLocaleStore.getState().setLocale("en")}>English</button>
          </div>
        </div>
        <button type="button" className="sm-full" onClick={() => { useSimpleModeStore.getState().setEnabled(false); onClose(); }}>{t("mode.toFull")}</button>
        <p className="sm-hint">{t("mode.toFullHint")}</p>
        {link && <a className="sm-btn sm-full" href={`${link.base}#/job/${link.job}`}>story-cut</a>}
        <button type="button" className="sm-full" onClick={onClose}>{t("common.close")}</button>
      </div>
    </div>
  );
}

function useLandscape(): boolean {
  const [landscape, setLandscape] = useState(() => window.innerWidth > window.innerHeight);
  useEffect(() => {
    const update = () => setLandscape(window.innerWidth > window.innerHeight);
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return landscape;
}

export function SimpleMobileEditor({ ready }: { ready: boolean }) {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const [tab, setTab] = useState<Tab>("clips");
  const [menu, setMenu] = useState(false);
  const [rotateDismissed, setRotateDismissed] = useState(false);
  const landscape = useLandscape();
  const name = useProjectStore((s) => s.project.name);
  const width = useProjectStore((s) => s.project.settings.width) || 1920;
  const height = useProjectStore((s) => s.project.settings.height) || 1080;
  const aspect = useMemo(() => height / width, [width, height]);
  useEffect(() => { document.documentElement.lang = locale; }, [locale]);
  // The first-run tour explains the desktop layout; on a phone that came from simple mode it only gets in the way.
  useEffect(() => { try { if (localStorage.getItem(ONBOARDING_KEY) === null) localStorage.setItem(ONBOARDING_KEY, "true"); } catch { /* ignore */ } }, []);

  return (
    <div className="simple-mobile" data-tab={tab} style={{ "--sm-aspect": aspect } as React.CSSProperties}>
      {/* The toolbar is not shown, but it hosts the export dialog that "phone export" opens. */}
      <div hidden><Toolbar /></div>
      <StoryCutBridge ready={ready} bar={false} />
      <header className="sm-header">
        <b className="sm-title" title={name}>{name}</b>
        <button type="button" aria-label={t("common.undo")} onClick={() => void useProjectStore.getState().undo()}>↶</button>
        <button type="button" aria-label={t("common.redo")} onClick={() => void useProjectStore.getState().redo()}>↷</button>
        <button type="button" className="sm-menu" aria-label={t("mode.simple")} onClick={() => setMenu(true)}>☰</button>
      </header>
      <div className="sm-stage">
        <PanelErrorBoundary name="Stage"><Preview /></PanelErrorBoundary>
      </div>
      <Overview />
      <Transport />
      <main className="sm-content">
        <PanelErrorBoundary name="Simple mode">
          {tab === "clips" && <SimpleClipsTab />}
          {tab === "captions" && <SimpleCaptionsTab />}
          {tab === "ai" && <React.Suspense fallback={<p className="sm-hint">{t("app.loading")}</p>}><SimpleAITab /></React.Suspense>}
          {tab === "export" && <SimpleExportTab />}
        </PanelErrorBoundary>
      </main>
      <nav className="sm-tabs" aria-label="tabs">
        {TABS.map((item) => (
          <button key={item.id} type="button" aria-pressed={tab === item.id} onClick={() => setTab(item.id)}>
            <span aria-hidden>{item.icon}</span>{t(item.label)}
          </button>
        ))}
      </nav>
      {menu && <Menu onClose={() => setMenu(false)} />}
      {landscape && !rotateDismissed && (
        <div className="sm-rotate" role="dialog" aria-label={t("mode.rotate")}>
          <div className="sm-rotate-icon">📱↻</div>
          <b>{t("mode.rotate")}</b>
          <p>{t("mode.rotateHint")}</p>
          <button type="button" onClick={() => setRotateDismissed(true)}>{t("mode.rotateContinue")}</button>
        </div>
      )}
    </div>
  );
}
