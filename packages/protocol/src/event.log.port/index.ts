// @context @journal/protocol-design
import type { EventEnvelope } from "../event/event.envelope";
import type { AnyEvent } from "../event/event.any";
import type { SessionID } from "../id/session.id";
import type { DeviceID } from "../id/device.id";

type EventHandler = (envelope: EventEnvelope) => void;
type Unsubscribe = () => void;

interface EventLogPort {
  append(
    sessionID: SessionID,
    originDeviceID: DeviceID,
    event: AnyEvent,
  ): Promise<EventEnvelope>;
  replay(sessionID: SessionID, afterSeq: number, handler: EventHandler): void;
  subscribe(
    sessionID: SessionID,
    handler: EventHandler,
    afterSeq?: number,
  ): Unsubscribe;
}

export type { EventLogPort, EventHandler, Unsubscribe };
