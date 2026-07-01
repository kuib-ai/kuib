// @context @journal/host-layer
import { render } from "solid-js/web";
import { createSignal, createMemo, For, onMount } from "solid-js";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import Transcript from "@kuib-ai/transcript";

const SESSION =
  new URLSearchParams(location.search).get("sessionID") ?? "default";

const getToken = async function (): Promise<string> {
  const meta = document
    .querySelector('meta[name="kuib-token"]')
    ?.getAttribute("content");
  if (meta !== null && meta !== undefined && meta !== "__KUIB_TOKEN__") {
    return meta;
  }
  const response = await fetch("/api/token").catch(() => null);
  if (response !== null && response.ok) {
    return ((await response.json()) as { token: string }).token;
  }
  return "";
};

const App = function () {
  const [envelopes, setEnvelopes] = createSignal<EventEnvelope[]>([]);
  const [status, setStatus] = createSignal("connecting…");
  const [draft, setDraft] = createSignal("");
  const entries = createMemo(() => Transcript.foldTranscript(envelopes()));

  const bySeq = new Map<number, EventEnvelope>();
  let lastSeq = -1;
  let token = "";
  let reconciling = false;

  const commit = function (): void {
    const ordered = [...bySeq.values()].sort(
      (a, b) => a.epoch * 1e9 + a.seq - (b.epoch * 1e9 + b.seq),
    );
    setEnvelopes(ordered);
  };

  const apply = function (envelope: EventEnvelope): boolean {
    if (bySeq.has(envelope.seq)) {
      return false;
    }
    bySeq.set(envelope.seq, envelope);
    while (bySeq.has(lastSeq + 1)) {
      lastSeq += 1;
    }
    return true;
  };

  const authGet = function (url: string): Promise<Response> {
    return fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  };

  const reconcile = async function (reason: string): Promise<void> {
    if (reconciling) {
      return;
    }
    reconciling = true;
    const response = await authGet(
      `/api/events/since?sessionID=${encodeURIComponent(SESSION)}&afterSeq=${lastSeq}`,
    );
    if (response.ok) {
      const body = (await response.json()) as { events: EventEnvelope[] };
      let changed = false;
      for (const envelope of body.events) {
        changed = apply(envelope) || changed;
      }
      if (changed) {
        commit();
      }
      setStatus(`synced to seq ${lastSeq} (${reason})`);
    }
    reconciling = false;
  };

  const openStream = function (): void {
    const source = new EventSource(
      `/api/events?sessionID=${encodeURIComponent(SESSION)}&afterSeq=${lastSeq}` +
        `&token=${encodeURIComponent(token)}`,
    );
    source.onmessage = function (message) {
      const envelope = JSON.parse(message.data) as EventEnvelope;
      if (envelope.seq > lastSeq + 1) {
        void reconcile("gap");
      }
      if (apply(envelope)) {
        commit();
      }
    };
    source.onerror = function () {
      setStatus("stream dropped — resuming…");
    };
  };

  const submit = async function (event: Event): Promise<void> {
    event.preventDefault();
    const prompt = draft().trim();
    if (prompt.length === 0) {
      return;
    }
    setDraft("");
    await fetch("/api/submit", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ sessionID: SESSION, prompt }),
    });
  };

  onMount(async () => {
    token = await getToken();
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") {
        void reconcile("refocus");
      }
    });
    window.addEventListener("online", () => void reconcile("online"));
    await reconcile("initial");
    openStream();
  });

  return (
    <>
      <div id="log">
        <For each={entries()}>
          {(entry) => (
            <div class={`entry ${entry.role}`}>
              {entry.role}: {entry.text}
            </div>
          )}
        </For>
      </div>
      <div id="status">{status()}</div>
      <form onSubmit={submit}>
        <input
          placeholder="Message kuib…  (Enter to send)"
          autofocus
          autocomplete="off"
          value={draft()}
          onInput={(event) => setDraft(event.currentTarget.value)}
        />
        <button type="submit">Send</button>
      </form>
    </>
  );
};

render(() => <App />, document.getElementById("root")!);
