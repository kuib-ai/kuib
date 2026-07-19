// @context @journal/protocol-design
import Protocol from "@kuib-ai/protocol";
import type { EventEnvelope } from "@kuib-ai/protocol/event/event.envelope";
import type { AnyEvent } from "@kuib-ai/protocol/event/event.any";
import type { SessionID } from "@kuib-ai/protocol/id/session.id";
import type { DeviceID } from "@kuib-ai/protocol/id/device.id";
import type {
  EventHandler,
  EventLogPort,
} from "@kuib-ai/protocol/event.log.port";

const createMemoryEventLog = function (): EventLogPort {
  const logs = new Map<string, EventEnvelope[]>();
  const subscribers = new Map<string, Set<EventHandler>>();

  const append = async function (
    sessionID: SessionID,
    originDeviceID: DeviceID,
    event: AnyEvent,
  ): Promise<EventEnvelope> {
    const existing = logs.get(sessionID) ?? [];
    const envelope = Protocol.Event.EventEnvelope.parse({
      _version: 1,
      epoch: 0,
      seq: existing.length,
      sessionID,
      originDeviceID,
      createdAt: Date.now(),
      event,
    });
    existing.push(envelope);
    logs.set(sessionID, existing);
    const subs = subscribers.get(sessionID);
    if (subs) {
      for (const handler of subs) {
        handler(envelope);
      }
    }
    return envelope;
  };

  const replay = function (
    sessionID: SessionID,
    afterSeq: number,
    handler: EventHandler,
  ): void {
    const existing = logs.get(sessionID) ?? [];
    for (const envelope of existing) {
      if (envelope.seq > afterSeq) {
        handler(envelope);
      }
    }
  };

  const subscribe = function (
    sessionID: SessionID,
    handler: EventHandler,
    afterSeq?: number,
  ): () => void {
    if (afterSeq !== undefined) {
      replay(sessionID, afterSeq, handler);
    }
    const subs = subscribers.get(sessionID) ?? new Set<EventHandler>();
    subs.add(handler);
    subscribers.set(sessionID, subs);
    return function () {
      subs.delete(handler);
    };
  };

  return { append, replay, subscribe };
};

export default createMemoryEventLog;
