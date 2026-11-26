/**
 * Opens a story-cut result straight from a link:  #/editor?storycut=<jobId>[&sclite=1][&scbase=<url>]
 *
 * story-cut (the local auto-edit server, github.com/Firstund/story-cut) runs on the PC. When OpenReel is
 * started with `pnpm dev:remote`, story-cut is proxied at /storycut/ on the same origin, so a phone can
 * open the draft, review/trim it here, and send the edited timeline back for a full-quality PC render.
 * Nothing runs unless the link carries `storycut=`.
 */
import { useEffect, useState } from "react";
import { createPortableEdit, materializePortableEdit, parsePortableEdit } from "@openreel/core/editing/portable-project";
import { useProjectStore } from "../../stores/project-store";
import { useChatStore } from "../../stores/chat-store";
import { toast } from "../../stores/notification-store";
import { EditingSession } from "../../services/agent/editing-session";
import { runExclusive } from "../../services/agent/host-singleton";

const SESSION_KEY = "openreel.storycut";
const handled = new Set<string>();

interface StoryCutLink { job: string; base: string; lite: boolean }

export function readStoryCutLink(hash: string): StoryCutLink | null {
  const query = hash.split("?")[1];
  if (!query) return null;
  const params = new URLSearchParams(query);
  const job = params.get("storycut");
  if (!job || !/^[\w-]{1,64}$/.test(job)) return null;
  let base = params.get("scbase") || "/storycut/";
  try {
    const url = new URL(base, window.location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    base = url.href.endsWith("/") ? url.href : url.href + "/";
  } catch {
    return null;
  }
  return { job, base, lite: params.get("sclite") === "1" };
}

function savedLink(): StoryCutLink | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as StoryCutLink) : null;
  } catch {
    return null;
  }
}

async function fetchWithProgress(url: string, onProgress: (done: number, total: number) => void): Promise<Blob> {
  const res = await fetch(url, { credentials: "include" });
  if (!res.ok) throw new Error(`story-cut answered ${res.status}`);
  const total = Number(res.headers.get("content-length") || 0);
  if (!res.body) return res.blob();
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let done = 0;
  for (;;) {
    const { value, done: finished } = await reader.read();
    if (finished) break;
    if (value) {
      chunks.push(value);
      done += value.byteLength;
      onProgress(done, total);
    }
  }
  return new Blob(chunks as BlobPart[], { type: res.headers.get("content-type") || "video/mp4" });
}

interface Progress { step: string; detail?: string; fraction?: number | null; error?: string }

export function StoryCutBridge({ ready }: { ready: boolean }) {
  const [incoming] = useState<StoryCutLink | null>(() => readStoryCutLink(window.location.hash));
  const [progress, setProgress] = useState<Progress | null>(() => (incoming ? { step: "편집기 준비 중...", fraction: null } : null));
  const [link, setLink] = useState<StoryCutLink | null>(() => incoming ?? savedLink());
  const [hidden, setHidden] = useState(false);
  const [sending, setSending] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!ready || !incoming) return;
    const key = `${incoming.base}|${incoming.job}|${attempt}`;
    if (handled.has(key)) return;
    handled.add(key);
    // Drop the parameters so a reload does not import again over the user's edits.
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#/editor`);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(incoming));
    setLink(incoming);
    const started = Date.now();
    void (async () => {
      try {
        setProgress({ step: "1/3 편집 초안 받는 중...", fraction: null });
        const res = await fetch(`${incoming.base}api/jobs/${incoming.job}/edit.json`, { credentials: "include" });
        if (res.status === 401) throw new Error("story-cut 비밀번호가 필요합니다. story-cut 화면에서 먼저 로그인하세요.");
        if (res.status === 502) throw new Error("PC의 story-cut 서버가 꺼져 있습니다. story-cut serve 창을 켜 주세요.");
        if (!res.ok) throw new Error(`편집 초안을 받지 못했습니다 (${res.status})`);
        const doc = parsePortableEdit(await res.text());
        const name = doc.project.media[0]?.name || "video.mp4";
        await runExclusive(async () => {
          const session = new EditingSession();
          const txn = session.beginTransaction();
          const restored = materializePortableEdit(doc, session.getProject());
          session.replaceDraft(restored.project);
          await session.commitTransaction(txn, "Import story-cut edit");
          useChatStore.getState().reset();
        });
        const placeholder = useProjectStore.getState().project.mediaLibrary.items.find((m) => m.isPlaceholder);
        if (placeholder) {
          const mediaUrl = `${incoming.base}api/jobs/${incoming.job}/media${incoming.lite ? "?proxy=1" : ""}`;
          setProgress({ step: "2/3 영상 받는 중...", fraction: 0 });
          const blob = await fetchWithProgress(mediaUrl, (done, total) => {
            const mb = (done / 1e6).toFixed(0);
            setProgress({
              step: "2/3 영상 받는 중...",
              detail: total ? `${mb} / ${(total / 1e6).toFixed(0)} MB` : `${mb} MB`,
              fraction: total ? done / total : null,
            });
          });
          setProgress({ step: "3/3 영상 여는 중...", detail: "길이와 장면 정보를 읽고 있습니다", fraction: null });
          const type = blob.type.startsWith("video/") ? blob.type : "video/mp4";
          const fileName = incoming.lite ? name.replace(/\.[^.]+$/, "") + ".mp4" : name;
          const file = new File([blob], fileName, { type, lastModified: Date.now() });
          await runExclusive(async () => {
            const session = new EditingSession();
            const txn = session.beginTransaction();
            // Waveforms are filled in later in the background; skipping them here opens a long video much sooner.
            await session.relinkMedia(placeholder.id, file, {
              waveform: false,
              onStage: (stage) => setProgress({ step: "3/3 영상 여는 중...", detail: stage, fraction: null }),
            });
            await session.commitTransaction(txn, "Link story-cut media");
          });
        }
        setProgress(null);
        const secs = Math.round((Date.now() - started) / 1000);
        toast.success("story-cut 초안을 열었습니다", `${secs}초 걸렸습니다.${incoming.lite ? " 가벼운 영상으로 열었습니다. 최종본은 'story-cut으로 보내기' 후 PC에서 만드세요." : ""}`);
      } catch (error) {
        setProgress({ step: "열지 못했습니다", error: error instanceof Error ? error.message : String(error) });
      }
    })();
  }, [ready, incoming, attempt]);

  const sendBack = async () => {
    if (!link) return;
    setSending(true);
    try {
      const doc = createPortableEdit(useProjectStore.getState().getFullProject());
      const res = await fetch(`${link.base}api/jobs/${link.job}/edit-json`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      if (!res.ok) throw new Error(`story-cut answered ${res.status}`);
      toast.success("story-cut으로 보냈습니다", "story-cut 화면에서 'PC에서 MP4 만들기'를 누르면 원본 화질로 만듭니다.");
    } catch (error) {
      toast.error("보내지 못했습니다", error instanceof Error ? error.message : String(error));
    } finally {
      setSending(false);
    }
  };

  if (progress) {
    const pct = progress.fraction == null ? null : Math.max(0, Math.min(1, progress.fraction));
    return (
      <div className="storycut-loading" role="dialog" aria-modal="false" aria-label="story-cut 불러오기">
        <div className="storycut-loading-card">
          <b>story-cut 초안 불러오기</b>
          <span role="status">{progress.step}</span>
          {!progress.error && (
            <div className={`storycut-loading-bar ${pct == null ? "indeterminate" : ""}`}><i style={pct == null ? undefined : { width: `${pct * 100}%` }} /></div>
          )}
          {progress.detail && <span className="storycut-loading-detail">{progress.detail}</span>}
          {progress.error && <span className="storycut-loading-error" role="alert">{progress.error}</span>}
          {progress.error && link && (
            <div className="storycut-loading-actions">
              <button type="button" className="storycut-bridge-btn" onClick={() => { setProgress({ step: "다시 시도하는 중...", fraction: null }); setAttempt((n) => n + 1); }}>다시 시도</button>
              <a className="storycut-bridge-btn" href={`${link.base}#/job/${link.job}`}>story-cut으로 돌아가기</a>
              <button type="button" className="storycut-bridge-btn" onClick={() => setProgress(null)}>닫기</button>
            </div>
          )}
        </div>
      </div>
    );
  }
  if (!link) return null;
  return (
    <div className="storycut-bridge" role="region" aria-label="story-cut">
      {hidden ? (
        <button type="button" className="storycut-bridge-btn" onClick={() => setHidden(false)} aria-label="story-cut 메뉴 보이기">SC</button>
      ) : (
        <>
          <button type="button" className="storycut-bridge-btn" disabled={sending} onClick={() => void sendBack()}>{sending ? "보내는 중..." : "story-cut으로 보내기"}</button>
          <a className="storycut-bridge-btn" href={`${link.base}#/job/${link.job}`}>story-cut</a>
          <button type="button" className="storycut-bridge-btn" onClick={() => setHidden(true)} aria-label="숨기기">×</button>
        </>
      )}
    </div>
  );
}
