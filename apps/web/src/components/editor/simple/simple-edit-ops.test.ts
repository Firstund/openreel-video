import "../../../test/install-local-storage-mock";
import { beforeEach, describe, expect, it } from "vitest";
import type { Clip, MediaItem, Subtitle, Track } from "@openreel/core";
import { createEmptyProject } from "../../../stores/project/project-helpers";
import { useProjectStore } from "../../../stores/project-store";
import { deleteClip, mainTrack, orderedClips, remapSubtitles, reorderClips, setClipRange, splitAt } from "./simple-edit-ops";

const base: Clip = { id: "c", mediaId: "m", trackId: "main", startTime: 0, duration: 10, inPoint: 0, outPoint: 10, volume: 1, effects: [], audioEffects: [], keyframes: [],
  transform: { position: { x: 0, y: 0 }, scale: { x: 1, y: 1 }, anchor: { x: .5, y: .5 }, rotation: 0, opacity: 1 } };
const media: MediaItem = { id: "m", name: "m.mp4", type: "video", fileHandle: null, blob: null, thumbnailUrl: null, waveformData: null,
  metadata: { duration: 1000, width: 640, height: 360, frameRate: 30, codec: "h264", fileSize: 0, sampleRate: 0, channels: 0 } };
// Three story-cut style clips from source 100-110, 200-210, 300-310, laid out back to back.
const clips: Clip[] = [0, 1, 2].map((i) => ({ ...base, id: `c${i}`, startTime: i * 10, inPoint: 100 * (i + 1), outPoint: 100 * (i + 1) + 10 }));
const subs: Subtitle[] = [
  { id: "s0", text: "zero", startTime: 1, endTime: 3 },
  { id: "s1", text: "one", startTime: 12, endTime: 14 },
  { id: "s2", text: "two", startTime: 25, endTime: 27 },
];

beforeEach(() => {
  const project = createEmptyProject("simple");
  const track: Track = { id: "main", name: "Main", type: "video", clips, transitions: [], locked: false, hidden: false, muted: false, solo: false };
  useProjectStore.getState().loadProject({ ...project, timeline: { ...project.timeline, tracks: [track], subtitles: subs }, mediaLibrary: { items: [media] } });
});

const layout = () => orderedClips(mainTrack(useProjectStore.getState().project)).map((c) => [c.id, c.startTime, c.duration]);
const subTimes = () => useProjectStore.getState().project.timeline.subtitles.map((s) => [s.id, s.startTime, s.endTime]);

describe("simple mode edits", () => {
  it("reorders clips gap-free, moves the captions along, and undoes in one step", async () => {
    await reorderClips(0, 2);
    expect(layout()).toEqual([["c1", 0, 10], ["c2", 10, 10], ["c0", 20, 10]]);
    expect(subTimes()).toEqual([["s1", 2, 4], ["s2", 15, 17], ["s0", 21, 23]]);
    await useProjectStore.getState().undo();
    expect(layout()).toEqual([["c0", 0, 10], ["c1", 10, 10], ["c2", 20, 10]]);
    expect(subTimes()).toEqual([["s0", 1, 3], ["s1", 12, 14], ["s2", 25, 27]]);
  });

  it("deleting a clip closes the gap and drops its captions", async () => {
    await deleteClip("c1");
    expect(layout()).toEqual([["c0", 0, 10], ["c2", 10, 10]]);
    expect(subTimes()).toEqual([["s0", 1, 3], ["s2", 15, 17]]);
    await useProjectStore.getState().undo();
    expect(layout()).toHaveLength(3);
    expect(subTimes()).toHaveLength(3);
  });

  it("trimming the start shortens the clip and pulls later clips in", async () => {
    await setClipRange("c0", 102, 110);
    expect(layout()).toEqual([["c0", 0, 8], ["c1", 8, 10], ["c2", 18, 10]]);
    // s0 was at source 101-103: its start was cut, the rest survives at the new clip start
    expect(subTimes()[0]).toEqual(["s0", 0, 1]);
    expect(subTimes()[1]).toEqual(["s1", 10, 12]);
  });

  it("growing a clip pushes the later clips right", async () => {
    await setClipRange("c1", 200, 215);
    expect(layout()).toEqual([["c0", 0, 10], ["c1", 10, 15], ["c2", 25, 10]]);
    expect(subTimes()[2]).toEqual(["s2", 30, 32]);
  });

  it("splitting keeps captions where they are", async () => {
    await splitAt("c1", 15);
    expect(layout().map((x) => x.slice(1))).toEqual([[0, 10], [10, 5], [15, 5], [20, 10]]);
    expect(subTimes()).toEqual([["s0", 1, 3], ["s1", 12, 14], ["s2", 25, 27]]);
  });

  it("a caption across the split point survives", async () => {
    useProjectStore.getState().updateSubtitle("s1", { startTime: 14, endTime: 17 });
    await splitAt("c1", 14.001);
    expect(subTimes()[1]).toEqual(["s1", 14, 17]);
  });

  it("remapSubtitles returns null when nothing moved", () => {
    expect(remapSubtitles(subs, clips, clips)).toBeNull();
  });
});
