/**
 * Edits behind the phone simple mode. The simple mode shows ONE main video track as a gap-free list of clips
 * (that is what story-cut produces). Every edit here:
 *   - is one undo step (history group),
 *   - closes gaps on the main track afterwards (like a ripple edit),
 *   - moves the subtitles with the footage they belong to (subtitles live in timeline time, clips move under
 *     them; we map each subtitle through its source time, so reorder/trim/delete keep captions in sync).
 */
import type { Clip, Project, Subtitle, Track } from "@openreel/core";
import { useProjectStore } from "../../../stores/project-store";

export const MIN_CLIP = 0.2;

export function mainTrack(project: Pick<Project, "timeline">): Track | undefined {
  const candidates = project.timeline.tracks.filter((track) =>
    track.type === "video" && track.role !== "captions" && track.name !== "Captions");
  let best: Track | undefined;
  for (const track of candidates) if (!best || track.clips.length > best.clips.length) best = track;
  return best;
}

export function orderedClips(track: Track | undefined): Clip[] {
  return track ? [...track.clips].sort((a, b) => a.startTime - b.startTime) : [];
}

const rate = (clip: Clip) => (clip.duration > 0 ? (clip.outPoint - clip.inPoint) / clip.duration : 1);
const end = (clip: Clip) => clip.startTime + clip.duration;

interface Mapped { time: number; clip: Clip }

/** Where timeline time `t` (before an edit) lands after it, following the source frame. null = cut away. */
export function remapTime(t: number, before: readonly Clip[], after: readonly Clip[]): Mapped | null | "outside" {
  const from = before.find((clip) => t >= clip.startTime - 1e-6 && t < end(clip) - 1e-6);
  if (!from) return "outside";
  const src = from.inPoint + (t - from.startTime) * rate(from);
  const hits = after.filter((clip) => clip.mediaId === from.mediaId && src >= clip.inPoint - 1e-6 && src < clip.outPoint - 1e-6);
  if (!hits.length) return null;
  const to = hits.find((clip) => clip.id === from.id) ?? hits[0];
  return { time: to.startTime + (src - to.inPoint) / rate(to), clip: to };
}

const round = (v: number) => Math.round(v * 1000) / 1000;

/** Subtitles after a clip edit. Returns null when nothing changed. */
export function remapSubtitles(subs: readonly Subtitle[], before: readonly Clip[], after: readonly Clip[]): Subtitle[] | null {
  let changed = false;
  const out: Subtitle[] = [];
  const lastEnd = after.reduce((m, c) => Math.max(m, end(c)), 0);
  const prevEnd = before.reduce((m, c) => Math.max(m, end(c)), 0);
  for (const sub of subs) {
    const len = sub.endTime - sub.startTime;
    const a = remapTime(sub.startTime, before, after);
    const b = remapTime(Math.max(sub.startTime, sub.endTime - 0.001), before, after);
    if (a === "outside") {
      const firstStart = before.reduce((m, c) => Math.min(m, c.startTime), Number.POSITIVE_INFINITY);
      const afterFirst = after.reduce((m, c) => Math.min(m, c.startTime), Number.POSITIVE_INFINITY);
      let shifted: number;
      if (sub.startTime >= prevEnd - 1e-6) shifted = sub.startTime + (lastEnd - prevEnd); // past the end: keep distance
      else if (sub.startTime < firstStart) shifted = sub.startTime + (afterFirst - firstStart); // before the first clip
      else { changed = true; continue; } // sat in a gap (its clip was removed elsewhere): nothing to show it over
      const next = { ...sub, startTime: round(Math.max(0, shifted)), endTime: round(Math.max(0, shifted) + len) };
      if (next.startTime !== sub.startTime) changed = true;
      out.push(next);
      continue;
    }
    if (!a && (!b || b === "outside")) { changed = true; continue; } // its footage was cut out
    let start: number, stop: number;
    const bm = b && b !== "outside" ? b : null;
    if (a) {
      start = a.time;
      if (bm && (bm.clip.id === a.clip.id || (bm.time > a.time && bm.time - a.time <= len + 0.01))) {
        stop = bm.time + 0.001; // still in one piece (same clip, or a split / neighbouring clip right after it)
      } else {
        stop = Math.min(start + len, end(a.clip)); // the rest moved elsewhere: keep the part over this clip
        if (stop - start < 0.3 && bm) { start = bm.clip.startTime; stop = bm.time + 0.001; } // ...unless that part is a sliver
      }
    } else {
      const bb = b as Mapped; // start was cut, the end survived: begin where that footage now begins
      start = bb.clip.startTime;
      stop = bb.time + 0.001;
    }
    if (stop - start < 0.05) { changed = true; continue; }
    const next = { ...sub, startTime: round(start), endTime: round(stop) };
    if (Math.abs(next.startTime - sub.startTime) > 1e-4 || Math.abs(next.endTime - sub.endTime) > 1e-4) changed = true;
    out.push(next);
  }
  if (!changed) return null;
  return out.sort((x, y) => x.startTime - y.startTime);
}

export class SimpleEditError extends Error {}

function check(result: { success: boolean; error?: { message?: string } } | undefined, what: string): void {
  if (!result || !result.success) throw new SimpleEditError(result?.error?.message || what);
}

const store = () => useProjectStore.getState();
const clipsNow = (trackId: string) => orderedClips(store().project.timeline.tracks.find((t) => t.id === trackId));

/** Run `fn` as one undo step, then close gaps on the main track and carry the subtitles along. */
export async function simpleEdit(label: string, fn: (track: Track) => Promise<void>): Promise<void> {
  const s = store();
  const track = mainTrack(s.project);
  if (!track) throw new SimpleEditError("no main track");
  if (track.locked) throw new SimpleEditError("track locked");
  const before = orderedClips(track);
  const subsBefore = s.project.timeline.subtitles ?? [];
  s.beginHistoryGroup(label);
  try {
    await fn(track);
    const afterEdit = clipsNow(track.id);
    const gaps = afterEdit.some((clip, i) => Math.abs(clip.startTime - (i === 0 ? clip.startTime : end(afterEdit[i - 1]))) > 1e-3);
    if (gaps) check(await store().consolidateTrack(track.id), "close gaps");
    const after = clipsNow(track.id);
    const subs = remapSubtitles(subsBefore, before, after);
    if (subs) check(await store().executeAction({ type: "subtitle/setAll", id: crypto.randomUUID(), timestamp: Date.now(), params: { subtitles: subs } }), "subtitles");
  } finally {
    store().endHistoryGroup();
  }
}

/** Move the clip at `from` to position `to` (indexes in play order); the list stays gap-free. */
export function reorderClips(from: number, to: number): Promise<void> {
  return simpleEdit("Reorder clips", async (track) => {
    const clips = orderedClips(track);
    if (from === to || from < 0 || to < 0 || from >= clips.length || to >= clips.length) return;
    const order = [...clips];
    const [moved] = order.splice(from, 1);
    order.splice(to, 0, moved);
    let cursor = clips[0].startTime;
    const moves = order.map((clip) => { const m = { clipId: clip.id, startTime: round(cursor) }; cursor += clip.duration; return m; });
    check(await store().moveClips(moves), "move");
  });
}

function mediaDuration(clip: Clip): number {
  const item = store().project.mediaLibrary.items.find((m) => m.id === clip.mediaId);
  const d = item?.metadata?.duration;
  return typeof d === "number" && d > 0 ? d : Number.POSITIVE_INFINITY;
}

/** Set a clip's source range. Growing pushes the later clips right first so nothing overlaps. */
export function setClipRange(clipId: string, inPoint: number, outPoint: number): Promise<void> {
  return simpleEdit("Trim clip", async (track) => {
    const clips = orderedClips(track);
    const clip = clips.find((c) => c.id === clipId);
    if (!clip) throw new SimpleEditError("clip not found");
    const r = rate(clip);
    const nextIn = Math.max(0, round(inPoint));
    const nextOut = Math.min(mediaDuration(clip), round(outPoint));
    if (nextOut - nextIn < MIN_CLIP * r) throw new SimpleEditError("too short");
    const grow = (nextOut - nextIn) / r - clip.duration;
    if (grow > 1e-6) {
      const later = clips.filter((c) => c.startTime > clip.startTime);
      if (later.length) check(await store().moveClips(later.map((c) => ({ clipId: c.id, startTime: round(c.startTime + grow) }))), "make room");
    }
    check(await store().trimClip(clipId, nextIn, nextOut), "trim");
  });
}

export function nudgeEdge(clip: Clip, edge: "start" | "end", delta: number): Promise<void> {
  return edge === "start"
    ? setClipRange(clip.id, clip.inPoint + delta, clip.outPoint)
    : setClipRange(clip.id, clip.inPoint, clip.outPoint + delta);
}

/** Source time under the playhead, if the playhead is inside the clip. */
export function sourceAt(clip: Clip, timelineTime: number): number | null {
  if (timelineTime < clip.startTime + 0.01 || timelineTime > end(clip) - 0.01) return null;
  return clip.inPoint + (timelineTime - clip.startTime) * rate(clip);
}

export function splitAt(clipId: string, time: number): Promise<void> {
  return simpleEdit("Split clip", async () => { check(await store().splitClip(clipId, time), "split"); });
}

export function deleteClip(clipId: string): Promise<void> {
  return simpleEdit("Delete clip", async () => { check(await store().rippleDeleteClips([clipId]), "delete"); });
}
