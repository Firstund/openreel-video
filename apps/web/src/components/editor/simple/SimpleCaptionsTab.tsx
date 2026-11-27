import { useEffect, useMemo, useRef, useState } from "react";
import type { Subtitle } from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import { toast } from "../../../stores/notification-store";
import { useT } from "../../../i18n";
import { clock } from "./format";

const STEP = 0.1;
const EMPTY: Subtitle[] = [];
const round = (v: number) => Math.round(v * 1000) / 1000;

function SubtitleEditor({ sub, onDone }: { sub: Subtitle; onDone: () => void }) {
  const t = useT();
  const [text, setText] = useState(sub.text);
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { setText(sub.text); }, [sub.id, sub.text]);
  useEffect(() => { area.current?.focus({ preventScroll: true }); }, [sub.id]);
  const update = (patch: Partial<Subtitle>) => useProjectStore.getState().updateSubtitle(sub.id, patch);
  const commitText = () => { const v = text.trim(); if (v && v !== sub.text) update({ text: v }); };
  const shift = (edge: "start" | "end" | "both", delta: number) => {
    let a = sub.startTime, b = sub.endTime;
    if (edge !== "end") a = Math.max(0, a + delta);
    if (edge !== "start") b = b + delta;
    if (edge === "both" && sub.startTime + delta < 0) { a = 0; b = sub.endTime - sub.startTime; }
    if (b - a < 0.2) return;
    update({ startTime: round(a), endTime: round(b) });
    useTimelineStore.getState().seekTo(round(a) + 0.001);
  };
  const s = t("common.sec", { n: STEP });
  return (
    <div className="sm-subedit" onClick={(e) => e.stopPropagation()}>
      <label className="sm-label">{t("captions.text")}
        <textarea ref={area} value={text} rows={2} onChange={(e) => setText(e.target.value)} onBlur={commitText} />
      </label>
      <div className="sm-timing">
        <span>{t("captions.start")} <b>{clock(sub.startTime, true)}</b></span>
        <button type="button" onClick={() => shift("start", -STEP)}>{t("captions.earlier", { s })}</button>
        <button type="button" onClick={() => shift("start", STEP)}>{t("captions.later", { s })}</button>
      </div>
      <div className="sm-timing">
        <span>{t("captions.end")} <b>{clock(sub.endTime, true)}</b></span>
        <button type="button" onClick={() => shift("end", -STEP)}>{t("captions.earlier", { s })}</button>
        <button type="button" onClick={() => shift("end", STEP)}>{t("captions.later", { s })}</button>
      </div>
      <div className="sm-grid2">
        <button type="button" onClick={() => {
          const p = useTimelineStore.getState().playheadPosition;
          update({ startTime: round(p), endTime: round(p + (sub.endTime - sub.startTime)) });
        }}>⇤ {t("captions.toPlayhead")}</button>
        <button type="button" className="sm-danger" onClick={() => { useProjectStore.getState().removeSubtitle(sub.id); onDone(); }}>🗑 {t("captions.deleteLine")}</button>
      </div>
      <button type="button" className="sm-primary sm-full" onClick={() => { commitText(); onDone(); }}>{t("captions.done")}</button>
    </div>
  );
}

export function SimpleCaptionsTab() {
  const t = useT();
  const raw = useProjectStore((s) => s.project.timeline.subtitles ?? EMPTY);
  const subs = useMemo(() => [...raw].sort((a, b) => a.startTime - b.startTime), [raw]);
  const playhead = useTimelineStore((s) => s.playheadPosition);
  const playing = useTimelineStore((s) => s.playbackState === "playing");
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const current = subs.findIndex((s) => playhead >= s.startTime && playhead < s.endTime);
  const shown = query.trim() ? subs.filter((s) => s.text.toLowerCase().includes(query.trim().toLowerCase())) : subs;

  // Bring the line being edited (e.g. one just added) into view.
  useEffect(() => {
    if (!editing) return;
    const id = requestAnimationFrame(() => listRef.current?.querySelector(`[data-sub="${editing}"]`)?.scrollIntoView({ block: "start", behavior: "smooth" }));
    return () => cancelAnimationFrame(id);
  }, [editing]);

  // Follow the playing line, unless the user is editing one.
  useEffect(() => {
    if (!playing || editing || current < 0) return;
    listRef.current?.querySelector(`[data-sub="${subs[current].id}"]`)?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [playing, editing, current, subs]);

  const add = async () => {
    const p = useTimelineStore.getState().playheadPosition;
    useTimelineStore.getState().pause();
    const before = new Set(subs.map((s) => s.id));
    const result = await useProjectStore.getState().executeAction({
      type: "subtitle/add", id: crypto.randomUUID(), timestamp: Date.now(),
      params: { text: t("captions.newText"), startTime: round(p), endTime: round(p + 2) },
    } as never);
    if (!result?.success) { toast.error(t("clips.failed", { e: result?.error?.message ?? "" })); return; }
    const created = useProjectStore.getState().project.timeline.subtitles.find((s) => !before.has(s.id));
    if (created) setEditing(created.id);
  };

  return (
    <div className="sm-tab sm-captions">
      <div className="sm-row">
        <p className="sm-summary">{subs.length ? t("captions.count", { n: subs.length }) : t("captions.empty")}</p>
        {subs.length > 8 && <input className="sm-search" type="search" value={query} placeholder={t("captions.search")} aria-label={t("captions.search")} onChange={(e) => setQuery(e.target.value)} />}
      </div>
      <ol className="sm-sublist" ref={listRef}>
        {shown.map((sub) => {
          const isCurrent = subs[current]?.id === sub.id;
          const open = editing === sub.id;
          return (
            <li key={sub.id} data-sub={sub.id} className={`sm-subrow ${isCurrent ? "now" : ""} ${open ? "open" : ""}`}
              onClick={() => { if (!open) { setEditing(sub.id); useTimelineStore.getState().seekTo(sub.startTime + 0.001); } }}>
              <div className="sm-subhead">
                <span className="sm-subtime">{clock(sub.startTime, true)}{isCurrent ? ` · ${t("captions.now")}` : ""}</span>
                <span className="sm-subtext">{sub.text}</span>
              </div>
              {open && <SubtitleEditor sub={sub} onDone={() => setEditing(null)} />}
            </li>
          );
        })}
      </ol>
      <div className="sm-stickybar">
        <button type="button" className="sm-primary sm-full" onClick={() => void add()}>＋ {t("captions.add")}</button>
      </div>
    </div>
  );
}
