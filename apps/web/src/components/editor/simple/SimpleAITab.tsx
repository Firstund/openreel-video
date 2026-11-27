import { useEffect, useRef, useState } from "react";
import { useChatStore, type ChatMessage } from "../../../stores/chat-store";
import { useAIConnectionStore } from "../../../stores/ai-connection-store";
import { useLocaleStore, useT, type MessageKey } from "../../../i18n";
import { applySimpleChatPreferences, clearSimpleChatPreferences, connectLmStudio, savedModel, setModel, simpleChatContext } from "./simple-ai";
import { simpleEdit, mainTrack, orderedClips } from "./simple-edit-ops";
import { useProjectStore } from "../../../stores/project-store";

const TOOL_KO: Record<string, string> = {
  get_editor_state: "상태 확인", list_tracks: "트랙 확인", list_clips: "클립 확인", get_clip: "클립 확인", list_media: "영상 확인",
  remove_clip: "클립 삭제", move_clip: "클립 옮기기", trim_clip: "클립 길이 조절", split_clip: "클립 나누기", set_clip_speed: "속도 바꾸기",
  set_clip_volume: "소리 크기", set_clip_fade: "페이드", add_subtitle: "자막 추가", update_subtitle: "자막 고치기", remove_subtitle: "자막 삭제",
  get_transition_options: "전환 확인", add_transition: "전환 효과", add_marker: "표시 추가",
};
const EXAMPLES: MessageKey[] = ["ai.ex1", "ai.ex2", "ai.ex3", "ai.ex4", "ai.ex5", "ai.ex6"];
const STATUS_KEY: Record<string, MessageKey> = { done: "ai.tool.done", corrected: "ai.tool.done", running: "ai.tool.running", retrying: "ai.tool.running", error: "ai.tool.error", rejected: "ai.tool.rejected" };

function hasGaps(): boolean {
  const clips = orderedClips(mainTrack(useProjectStore.getState().project));
  return clips.some((c, i) => i > 0 && Math.abs(c.startTime - (clips[i - 1].startTime + clips[i - 1].duration)) > 1e-3);
}

function Message({ m }: { m: ChatMessage }) {
  const t = useT();
  const ko = useLocaleStore((s) => s.locale) === "ko";
  return (
    <li className={`sm-msg ${m.role}`}>
      <span className="sm-msg-who">{m.role === "user" ? t("ai.you") : t("ai.bot")}</span>
      {m.toolCalls.length > 0 && (
        <span className="sm-tools">
          {m.toolCalls.map((c) => <span key={c.id} className={`sm-tool ${c.status}`}>{(ko && TOOL_KO[c.name]) || c.name} · {t(STATUS_KEY[c.status] ?? "ai.tool.running")}</span>)}
        </span>
      )}
      {m.text && <p>{m.text}</p>}
      {m.notice && <p className="sm-hint">{m.notice}</p>}
    </li>
  );
}

export function SimpleAITab() {
  const t = useT();
  const locale = useLocaleStore((s) => s.locale);
  const messages = useChatStore((s) => s.messages);
  const status = useChatStore((s) => s.status);
  const error = useChatStore((s) => s.error);
  const pending = useChatStore((s) => s.pendingConfirm);
  const lastCommitted = useChatStore((s) => s.lastTurnCommitted);
  const provider = useAIConnectionStore((s) => s.provider);
  const model = useAIConnectionStore((s) => s.model);
  const baseUrl = useAIConnectionStore((s) => s.baseUrl);
  const [conn, setConn] = useState<{ state: "idle" | "checking" | "ok" | "error"; models: string[]; error?: string }>({ state: "idle", models: [] });
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLOListElement>(null);
  const wasRunning = useRef(false);

  useEffect(() => { applySimpleChatPreferences(locale); return () => clearSimpleChatPreferences(); }, [locale]);

  const connect = async () => {
    setConn((c) => ({ ...c, state: "checking" }));
    try {
      const info = await connectLmStudio();
      setConn({ state: "ok", models: info.models });
    } catch (e) {
      setConn({ state: "error", models: [], error: e instanceof Error ? e.message : String(e) });
    }
  };
  // Reconnect quietly when this phone used LM Studio before.
  useEffect(() => {
    const ready = provider === "compatible" && /\/lmstudio\/v1$|localhost:1234/.test(baseUrl);
    if (ready) setConn((c) => (c.state === "idle" ? { ...c, state: "ok" } : c));
    else if (savedModel()) void connect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { listRef.current?.lastElementChild?.scrollIntoView({ block: "end" }); }, [messages, pending]);

  // The AI's remove/trim tools leave holes; close them (and carry captions along) like the clip tab does.
  useEffect(() => {
    if (status === "running" || status === "awaiting_confirm") { wasRunning.current = true; return; }
    if (wasRunning.current && status === "idle") {
      wasRunning.current = false;
      if (useChatStore.getState().lastTurnCommitted && hasGaps()) void simpleEdit("Close gaps after AI", async () => {}).catch(() => undefined);
    }
  }, [status]);

  const send = (text: string) => {
    const v = text.trim();
    if (!v || status === "running" || status === "awaiting_confirm") return;
    setDraft("");
    void useChatStore.getState().send(v, { context: simpleChatContext() });
  };
  const busy = status === "running" || status === "awaiting_confirm";
  const connected = conn.state === "ok";

  return (
    <div className="sm-tab sm-ai">
      <section className="sm-card">
        <h3>{t("ai.title")}</h3>
        <p className="sm-hint">{t("ai.intro")}</p>
        {conn.state === "ok" ? (
          <div className="sm-row">
            <span className="sm-ok">● {t("ai.connected", { m: model })}</span>
            {conn.models.length > 1 && (
              <select className="sm-select" aria-label={t("ai.model")} value={model} onChange={(e) => setModel(e.target.value)}>
                {conn.models.map((id) => <option key={id} value={id}>{id}</option>)}
              </select>
            )}
          </div>
        ) : (
          <>
            <button type="button" className="sm-primary sm-full" disabled={conn.state === "checking"} onClick={() => void connect()}>
              {conn.state === "checking" ? t("ai.connecting") : t("ai.connect")}
            </button>
            {conn.state === "error" && <p className="sm-error">{t("ai.noServer", { e: conn.error ?? "" })}</p>}
            {conn.state === "idle" && <p className="sm-hint">{t("ai.notConnected")}</p>}
          </>
        )}
      </section>

      {messages.length === 0 && (
        <section className="sm-examples" aria-label={t("ai.examples")}>
          <p className="sm-hint">{t("ai.examples")}</p>
          <div className="sm-chips">
            {EXAMPLES.map((key) => <button key={key} type="button" className="sm-chip" onClick={() => setDraft(t(key))}>{t(key)}</button>)}
          </div>
        </section>
      )}

      <ol className="sm-msgs" ref={listRef}>
        {messages.map((m) => <Message key={m.id} m={m} />)}
        {status === "running" && <li className="sm-msg assistant sm-thinking"><span className="sm-dots" />{t("ai.thinking")}</li>}
        {pending && (
          <li className="sm-card sm-confirm">
            <b>{t("ai.confirmTitle")}</b>
            <span>{(locale === "ko" && TOOL_KO[pending.call.name]) || pending.call.name}</span>
            <code>{JSON.stringify(pending.call.args).slice(0, 160)}</code>
            <div className="sm-grid3">
              <button type="button" className="sm-primary" onClick={() => useChatStore.getState().resolveConfirm("approve")}>{t("ai.approve")}</button>
              <button type="button" onClick={() => useChatStore.getState().resolveConfirm("approve_for_turn")}>{t("ai.approveAll")}</button>
              <button type="button" className="sm-danger" onClick={() => useChatStore.getState().resolveConfirm("reject")}>{t("ai.reject")}</button>
            </div>
          </li>
        )}
      </ol>
      {error && <p className="sm-error" role="alert">{error}</p>}
      {messages.length > 0 && !busy && (
        <div className="sm-row">
          {lastCommitted && <button type="button" onClick={() => void useChatStore.getState().undoLastTurn()}>↶ {t("ai.undoTurn")}</button>}
          <button type="button" onClick={() => useChatStore.getState().newChat()}>{t("ai.newChat")}</button>
        </div>
      )}

      <form className="sm-composer" onSubmit={(e) => { e.preventDefault(); send(draft); }}>
        <textarea value={draft} rows={2} placeholder={t("ai.placeholder")} aria-label={t("ai.placeholder")} disabled={!connected && conn.state !== "idle" && conn.state !== "error"}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(draft); } }} />
        {busy
          ? <button type="button" className="sm-danger" onClick={() => useChatStore.getState().stop()}>{t("ai.stop")}</button>
          : <button type="submit" className="sm-primary" disabled={!draft.trim() || !connected}>{t("ai.send")}</button>}
      </form>
    </div>
  );
}
