// @context @journal/host-layer
import { createSignal, onMount, onCleanup, For, Show } from "solid-js";
import type { TextareaRenderable } from "@opentui/core";
import Protocol from "@kuib-ai/protocol";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import Transcript from "@kuib-ai/transcript";
import type { TranscriptEntry } from "@kuib-ai/transcript/transcript.entry";

type AppProps = {
  eventLog: EventLogPort;
  sessionID: SessionID;
  deviceLabel: string;
  onSubmit: (text: string) => void;
  onInterrupt: () => void;
};

const roleColor: Record<TranscriptEntry["role"], string> = {
  [Transcript.TranscriptRoleEnum.USER]: "#7aa2f7",
  [Transcript.TranscriptRoleEnum.ASSISTANT]: "#9ece6a",
  [Transcript.TranscriptRoleEnum.REASONING]: "#565f89",
  [Transcript.TranscriptRoleEnum.TOOL]: "#e0af68",
};

const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const SPINNER_INTERVAL_MS = 80;
const REASONING_TAIL = 48;

const CONTEXT_WINDOWS: Record<string, number> = {
  "mimo-v2.5-pro": 1048576,
  "mimo-v2.5": 1048576,
  "muse-spark-1.1": 1048576,
  "muse-spark-1.2": 1048576,
  "muse-spark-1.2-contributor": 1048576,
};

const formatTokens = function (count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return `${count}`;
};

const PROMPT_PANE_WIDTH = 33;
const PROMPT_MIN_ROWS = 3;
const PROMPT_MAX_ROWS = 8;

const App = function (props: AppProps) {
  const [envelopes, setEnvelopes] = createSignal<EventEnvelope[]>([]);
  const [promptRows, setPromptRows] = createSignal(PROMPT_MIN_ROWS);
  const [tick, setTick] = createSignal(0);
  const [now, setNow] = createSignal(Date.now());
  let prompt: TextareaRenderable | undefined;

  const entries = function (): TranscriptEntry[] {
    return Transcript.foldTranscript(envelopes());
  };

  const turnStartedAt = function (): number | null {
    let since: number | null = null;
    for (const envelope of envelopes()) {
      switch (envelope.event.type) {
        case Protocol.Event.EventTypeEnum.MESSAGE_STARTED:
          since = envelope.createdAt;
          break;
        case Protocol.Event.EventTypeEnum.MESSAGE_COMPLETED:
        case Protocol.Event.EventTypeEnum.MESSAGE_FAILED:
          since = null;
          break;
        default:
          break;
      }
    }
    return since;
  };

  const liveReasoning = function (): string {
    let text = "";
    for (const envelope of envelopes()) {
      const event = envelope.event;
      if (event.type === Protocol.Event.EventTypeEnum.MESSAGE_STARTED) {
        text = "";
      }
      if (event.type === Protocol.Event.EventTypeEnum.REASONING_DELTA) {
        text += event.delta;
      }
    }
    return text.replace(/\s+/g, " ").trim();
  };

  const loaderLabel = function (): string {
    const started = turnStartedAt() ?? now();
    const seconds = Math.max(0, Math.round((now() - started) / 1000));
    const frame = SPINNER_FRAMES[tick() % SPINNER_FRAMES.length];
    const reasoning = liveReasoning();
    if (reasoning.length === 0) {
      return `${frame} Working… ${seconds}s`;
    }
    const tail = reasoning.slice(-REASONING_TAIL);
    return `${frame} Thinking… ${seconds}s · ${tail}`;
  };

  const contextLabel = function (): string {
    let used = 0;
    let window: number | undefined;
    for (const envelope of envelopes()) {
      const event = envelope.event;
      if (event.type === Protocol.Event.EventTypeEnum.STEP_FINISHED) {
        used = event.tokens.input + event.tokens.output;
        window = CONTEXT_WINDOWS[event.model.modelID];
      }
    }
    if (used === 0) {
      return "Context —";
    }
    if (window === undefined) {
      return `Context ${formatTokens(used)}`;
    }
    const percent = Math.min(100, Math.round((used / window) * 100));
    return `Context ${formatTokens(used)}/${formatTokens(window)} · ${percent}%`;
  };

  onMount(function () {
    const timer = setInterval(function () {
      setTick(function (prev) {
        return prev + 1;
      });
      setNow(Date.now());
    }, SPINNER_INTERVAL_MS);
    onCleanup(function () {
      return clearInterval(timer);
    });

    const unsubscribe = props.eventLog.subscribe(
      props.sessionID,
      function (envelope) {
        return setEnvelopes(function (prev) {
          return [...prev, envelope];
        });
      },
      -1,
    );
    onCleanup(unsubscribe);
  });

  const resize = function () {
    if (prompt === undefined) {
      return;
    }
    const lines = prompt.plainText.split("\n").length;
    setPromptRows(Math.min(Math.max(lines, PROMPT_MIN_ROWS), PROMPT_MAX_ROWS));
  };

  const submit = function () {
    if (prompt === undefined) {
      return;
    }
    const trimmed = prompt.plainText.trim();
    if (trimmed.length === 0) {
      return;
    }
    props.onSubmit(trimmed);
    prompt.setText("");
    setPromptRows(PROMPT_MIN_ROWS);
  };

  return (
    <box flexDirection="row" flexGrow={1}>
      <box border title="Conversation" flexDirection="column" flexGrow={1}>
        <scrollbox flexGrow={1} stickyScroll stickyStart="bottom">
          <For each={entries()}>
            {function (entry) {
              return (
                <text fg={roleColor[entry.role]}>
                  {entry.role}: {entry.text}
                </text>
              );
            }}
          </For>
          <Show when={turnStartedAt() !== null}>
            <text fg={roleColor[Transcript.TranscriptRoleEnum.REASONING]}>
              {loaderLabel()}
            </text>
          </Show>
        </scrollbox>
      </box>
      <box
        border
        title="Prompt"
        flexDirection="column"
        width={PROMPT_PANE_WIDTH}
        paddingLeft={1}
        paddingRight={1}
      >
        <box flexDirection="row" justifyContent="flex-end">
          <text fg="#1a1b26" bg="#7aa2f7">
            {" "}
            {props.deviceLabel}{" "}
          </text>
        </box>
        <box border height={promptRows() + 2} marginTop={1}>
          <textarea
            ref={function (renderable: TextareaRenderable) {
              prompt = renderable;
            }}
            focused
            flexGrow={1}
            placeholder="Message kuib…"
            keyBindings={[
              { name: "return", action: "submit" },
              { name: "kpenter", action: "submit" },
              { name: "return", shift: true, action: "newline" },
            ]}
            onKeyDown={function (key: { name?: string }) {
              if (key.name === "escape" && turnStartedAt() !== null) {
                props.onInterrupt();
              }
            }}
            onContentChange={resize}
            onSubmit={submit}
          />
        </box>
        <text fg="#565f89" marginTop={1}>
          Enter queues · esc interrupts
        </text>
        <text fg="#565f89">{contextLabel()}</text>
      </box>
    </box>
  );
};

export default App;
export type { AppProps };
