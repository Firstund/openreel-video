import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import type { Clip } from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";
import { useTimelineStore } from "../../../stores/timeline-store";
import { toast } from "../../../stores/notification-store";
import { useT } from "../../../i18n";
import { clock, secs } from "./format";
import { deleteClip, mainTrack, nudgeEdge, orderedClips, reorderClips, setClipRange, sourceAt, splitAt, MIN_CLIP } from "./simple-edit-ops";

const NUDGE = 0.5;

export function useMainClips(): Clip[] {
  const track = useProjectStore((s) => mainTrack(s.project));
  return useMemo(() => orderedClips(track), [track, track?.clips]);
}

function useEdit() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<void>, done?: string) => {
    if (busy) return;
    setBusy(true);
    useTimelineStore.getState().pause();
    try {
      await fn();
      if (done) toast.success(done);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(t("clips.failed", { e: msg === "too short" ? t("clips.tooShort") : msg }));
    } finally {
      setBusy(false);
    }
  };
  return { busy, run };
}

/** Source-range bar with two big handles. Dragging changes a draft; letting go applies it. */
function TrimBar({ clip, busy, onApply }: { clip: Clip; busy: boolean; onApply: (inPoint: number, outPoint: number) => void }) {
  const t = useT();
  const mediaDuration = useProjectStore((s) => s.project.mediaLibrary.items.find((m) => m.id === clip.mediaId)?.metadata?.duration ?? 0);
  const [draft, setDraft] = useState<{ in: number; out: number } | null>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const span = clip.outPoint - clip.inPoint;
  const pad = Math.min(30, Math.max(5, span * 0.6));
  const lo = Math.max(0, clip.inPoint - pad);
  const hi = Math.max(clip.outPoint + 0.1, mediaDuration > 0 ? Math.min(mediaDuration, clip.outPoint + pad) : clip.outPoint + pad);
  const cur = draft ?? { in: clip.inPoint, out: clip.outPoint };
  const pct = (v: number) => `${((v - lo) / (hi - lo)) * 100}%`;
  useEffect(() => setDraft(null), [clip.id, clip.inPoint, clip.outPoint]);

  const drag = (edge: "in" | "out") => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (busy) return;
    event.preventDefault();
    const el = barRef.current;
    if (!el) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const rect = el.getBoundingClientRect();
    let next = { in: clip.inPoint, out: clip.outPoint };
    const move = (e: PointerEvent) => {
      const v = lo + Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width)) * (hi - lo);
      next = edge === "in" ? { in: Math.min(v, next.out - MIN_CLIP), out: next.out } : { in: next.in, out: Math.max(v, next.in + MIN_CLIP) };
      setDraft(next);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (Math.abs(next.in - clip.inPoint) > 0.02 || Math.abs(next.out - clip.outPoint) > 0.02) onApply(next.in, next.out);
      else setDraft(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  return (
    <div className="sm-trim">
      <div className="sm-trim-labels">
        <span>{t("clips.startLabel")} {clock(cur.in, true)}</span>
        <b>{secs(cur.out - cur.in)}s</b>
        <span>{t("clips.endLabel")} {clock(cur.out, true)}</span>
      </div>
      <div className="sm-trim-bar" ref={barRef} aria-label={t("clips.trimBar")}>
        <div className="sm-trim-keep" style={{ left: pct(cur.in), width: `calc(${pct(cur.out)} - ${pct(cur.in)})` }} />
        <button type="button" className="sm-trim-handle" style={{ left: pct(cur.in) }} aria-label={t("clips.startLabel")} onPointerDown={drag("in")}><i /></button>
        <button type="button" className="sm-trim-handle end" style={{ left: pct(cur.out) }} aria-label={t("clips.endLabel")} onPointerDown={drag("out")}><i /></button>
      </div>
      <p className="sm-hint">{t("clips.trimBar")}</p>
    </div>
  );
}

function SelectedClip({ clip, index, busy, run }: { clip: Clip; index: number; busy: boolean; run: (fn: () => Promise<void>, done?: string) => Promise<void> }) {
  const t = useT();
  const playhead = useTimelineStore((s) => s.playheadPosition);
  // Start/end at the playhead also work right on the clip's edges; a split needs a point strictly inside.
  const touching = playhead >= clip.startTime - 0.01 && playhead <= clip.startTime + clip.duration + 0.01;
  const inside = sourceAt(clip, playhead) !== null;
  const s = t("common.sec", { n: NUDGE });
  const atPlayhead = (edge: "start" | "end") => {
    const p = useTimelineStore.getState().playheadPosition;
    const src = sourceAt(clip, p) ?? (Math.abs(p - clip.startTime) <= 0.011 ? clip.inPoint : Math.abs(p - clip.startTime - clip.duration) <= 0.011 ? clip.outPoint : null);
    if (src === null) { toast.info(t("clips.playheadOutside")); return; }
    void run(() => edge === "start" ? setClipRange(clip.id, src, clip.outPoint) : setClipRange(clip.id, clip.inPoint, src));
  };
  return (
    <section className="sm-selected" onClick={(e) => e.stopPropagation()} aria-label={t("clips.selected", { i: index + 1, d: secs(clip.duration) })}>
      <TrimBar clip={clip} busy={busy} onApply={(a, b) => void run(() => setClipRange(clip.id, a, b))} />
      <div className="sm-grid2">
        <button type="button" disabled={busy} onClick={() => void run(() => nudgeEdge(clip, "start", -NUDGE))}>◀ {t("clips.startMinus", { s })}</button>
        <button type="button" disabled={busy} onClick={() => void run(() => nudgeEdge(clip, "start", NUDGE))}>{t("clips.startPlus", { s })} ▶</button>
        <button type="button" disabled={busy} onClick={() => void run(() => nudgeEdge(clip, "end", -NUDGE))}>◀ {t("clips.endMinus", { s })}</button>
        <button type="button" disabled={busy} onClick={() => void run(() => nudgeEdge(clip, "end", NUDGE))}>{t("clips.endPlus", { s })} ▶</button>
        <button type="button" disabled={busy || !touching} onClick={() => atPlayhead("start")}>⇤ {t("clips.startHere")}</button>
        <button type="button" disabled={busy || !touching} onClick={() => atPlayhead("end")}>{t("clips.endHere")} ⇥</button>
        <button type="button" className="sm-accent" disabled={busy || !inside} onClick={() => void run(() => splitAt(clip.id, useTimelineStore.getState().playheadPosition))}>✂ {t("clips.split")}</button>
        <button type="button" className="sm-danger" disabled={busy} onClick={() => void run(() => deleteClip(clip.id), t("clips.deleted"))}>🗑 {t("clips.delete")}</button>
      </div>
      {!inside && <p className="sm-hint">{t("clips.splitHint")}</p>}
    </section>
  );
}

export function SimpleClipsTab() {
  const t = useT();
  const clips = useMainClips();
  const playhead = useTimelineStore((s) => s.playheadPosition);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { busy, run } = useEdit();
  const [drag, setDrag] = useState<{ from: number; over: number; dy: number; h: number } | null>(null);
  const listRef = useRef<HTMLOListElement>(null);

  const selectedIndex = clips.findIndex((c) => c.id === selectedId);
  const selected = selectedIndex >= 0 ? clips[selectedIndex] : null;
  // A split keeps the left half's id; a delete drops the selection.
  useEffect(() => { if (selectedId && selectedIndex < 0) setSelectedId(null); }, [selectedId, selectedIndex]);
  const total = clips.reduce((sum, c) => sum + c.duration, 0);
  const playingIndex = clips.findIndex((c) => playhead >= c.startTime && playhead < c.startTime + c.duration);

  const startDrag = (index: number) => (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (busy) return;
    event.preventDefault();
    const list = listRef.current;
    if (!list) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    const rows = Array.from(list.querySelectorAll<HTMLElement>("[data-row]"));
    const mids = rows.map((r) => { const b = r.getBoundingClientRect(); return b.top + b.height / 2; });
    const y0 = event.clientY;
    // Rows the dragged one passes slide by its own height (plus the list gap) to open a slot.
    const h = rows[index].getBoundingClientRect().height + 6;
    let state = { from: index, over: index, dy: 0, h };
    setDrag(state);
    const move = (e: PointerEvent) => {
      const y = e.clientY;
      let over = mids.findIndex((m) => y < m);
      if (over < 0) over = rows.length - 1;
      else if (over > index) over -= 1;
      state = { from: index, over: Math.max(0, Math.min(rows.length - 1, over)), dy: y - y0, h };
      setDrag(state);
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setDrag(null);
      if (state.over !== state.from) void run(() => reorderClips(state.from, state.over), t("clips.moved"));
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  if (!clips.length) return <p className="sm-empty">{t("clips.empty")}</p>;

  return (
    <div className="sm-tab sm-clips">
      <p className="sm-summary">{t("clips.summary", { n: clips.length, d: clock(total) })}{busy ? ` · ${t("common.working")}` : ""}</p>
      {!selected && <p className="sm-hint">{t("clips.selectHint")}</p>}
      <ol className="sm-cliplist" ref={listRef}>
        {clips.map((clip, i) => {
          const dragging = drag?.from === i;
          const shift = drag && !dragging ? (drag.from < i && drag.over >= i ? -1 : drag.from > i && drag.over <= i ? 1 : 0) : 0;
          return (
            <li key={clip.id} data-row
              className={`sm-cliprow ${clip.id === selectedId ? "on" : ""} ${i === playingIndex ? "playing" : ""} ${dragging ? "dragging" : ""}`}
              style={dragging ? { transform: `translateY(${drag.dy}px)` } : shift && drag ? { transform: `translateY(${shift * drag.h}px)` } : undefined}>
              <button type="button" className="sm-handle" aria-label={t("clips.drag")} onPointerDown={startDrag(i)} disabled={busy}>≡</button>
              <button type="button" className="sm-clipmain" onClick={(e) => {
                const row = e.currentTarget.closest("li");
                setSelectedId(clip.id === selectedId ? null : clip.id);
                useTimelineStore.getState().seekTo(clip.startTime + 0.001);
                requestAnimationFrame(() => row?.scrollIntoView({ block: "start", behavior: "smooth" }));
              }}>
                <span className="sm-clipnum">{i + 1}</span>
                <span className="sm-cliptext">
                  <b>{t("clips.item", { i: i + 1 })} · {secs(clip.duration)}s</b>
                  <small>{t("clips.source", { a: clock(clip.inPoint), b: clock(clip.outPoint) })}</small>
                </span>
              </button>
              <span className="sm-updown">
                <button type="button" aria-label={t("clips.up")} disabled={busy || i === 0} onClick={() => void run(() => reorderClips(i, i - 1))}>▲</button>
                <button type="button" aria-label={t("clips.down")} disabled={busy || i === clips.length - 1} onClick={() => void run(() => reorderClips(i, i + 1))}>▼</button>
              </span>
              {clip.id === selectedId && <SelectedClip clip={clip} index={i} busy={busy} run={run} />}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
