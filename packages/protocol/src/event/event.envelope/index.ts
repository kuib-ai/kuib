// @context @journal/protocol-design
import { z } from "zod";
import AnyEvent from "../event.any";
import SessionID from "../../id/session.id";
import DeviceID from "../../id/device.id";

const EventEnvelope = z.object({
  _version: z.literal(1),
  epoch: z.number().int(),
  seq: z.number().int(),
  sessionID: SessionID,
  originDeviceID: DeviceID,
  createdAt: z.number(),
  event: AnyEvent,
});
type EventEnvelope = z.infer<typeof EventEnvelope>;

export default EventEnvelope;
export type { EventEnvelope };
