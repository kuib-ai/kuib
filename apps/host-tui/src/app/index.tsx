// @context @journal/host-layer
import { createSignal, onMount, onCleanup, For } from "solid-js";
import type { TextareaRenderable } from "@opentui/core";
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
};

const roleColor: Record<TranscriptEntry["role"], string> = {
  [Transcript.TranscriptRoleEnum.USER]: "#7aa2f7",
  [Transcript.TranscriptRoleEnum.ASSISTANT]: "#9ece6a",
  [Transcript.TranscriptRoleEnum.REASONING]: "#565f89",
  [Transcript.TranscriptRoleEnum.TOOL]: "#e0af68",
};

const PROMPT_PANE_WIDTH = 33;
const PROMPT_MIN_ROWS = 3;
const PROMPT_MAX_ROWS = 8;

const App = function (props: AppProps) {
  const [envelopes, setEnvelopes] = createSignal<EventEnvelope[]>([]);
  const [promptRows, setPromptRows] = createSignal(PROMPT_MIN_ROWS);
  let prompt: TextareaRenderable | undefined;

  const entries = (): TranscriptEntry[] =>
    Transcript.foldTranscript(envelopes());

  onMount(() => {
    const unsubscribe = props.eventLog.subscribe(
      props.sessionID,
      (envelope) => setEnvelopes((prev) => [...prev, envelope]),
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
            {(entry) => (
              <text fg={roleColor[entry.role]}>
                {entry.role}: {entry.text}
              </text>
            )}
          </For>
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
            ref={(renderable: TextareaRenderable) => {
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
            onContentChange={resize}
            onSubmit={submit}
          />
        </box>
        <text fg="#565f89" marginTop={1}>
          Enter sends · queues mid-turn
        </text>
      </box>
    </box>
  );
};

export default App;
export type { AppProps };
