// @context @journal/host-layer
import { createSignal, onMount, onCleanup, For } from "solid-js";
import type { EventLogPort } from "@kuib-ai/protocol/event.log.port";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import Transcript from "../transcript";
import type { TranscriptEntry } from "../transcript/transcript.entry";

type AppProps = {
  eventLog: EventLogPort;
  sessionID: SessionID;
  onSubmit: (text: string) => void;
};

const roleColor: Record<TranscriptEntry["role"], string> = {
  [Transcript.TranscriptRoleEnum.USER]: "#7aa2f7",
  [Transcript.TranscriptRoleEnum.ASSISTANT]: "#9ece6a",
  [Transcript.TranscriptRoleEnum.REASONING]: "#565f89",
  [Transcript.TranscriptRoleEnum.TOOL]: "#e0af68",
};

const App = function (props: AppProps) {
  const [envelopes, setEnvelopes] = createSignal<EventEnvelope[]>([]);
  const [draft, setDraft] = createSignal("");

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

  const submit = function (value: unknown) {
    if (typeof value !== "string") {
      return;
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      return;
    }
    props.onSubmit(trimmed);
    setDraft("");
  };

  return (
    <box flexDirection="column" padding={1}>
      <scrollbox flexGrow={1} stickyScroll stickyStart="bottom">
        <For each={entries()}>
          {(entry) => (
            <text fg={roleColor[entry.role]}>
              {entry.role}: {entry.text}
            </text>
          )}
        </For>
      </scrollbox>
      <input
        focused
        placeholder="Message kuib…  (Enter to send)"
        value={draft()}
        onInput={setDraft}
        onSubmit={submit}
      />
    </box>
  );
};

export default App;
export type { AppProps };
