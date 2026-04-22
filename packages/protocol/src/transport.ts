/**
 * Transport interface — how SQ/EQ are carried between consumer and engine.
 *
 * Three transport modes:
 * 1. In-process — direct function calls (TUI + engine same process)
 * 2. WebSocket — TUI connects to remote engine daemon
 * 3. Mesh — TUI connects through WireGuard mesh to any device
 *
 * Behavioral interfaces only — no Zod schemas (these are contracts, not data).
 * The Submission and Event schemas handle validation at the boundary.
 */

import type { SessionID } from "./id.js";
import type { Submission } from "./submission.js";
import type { Event } from "./event.js";

export type Unsubscribe = () => void;

export interface Transport {
  submit(submission: Submission): void;
  emit(event: Event): void;
  onEvent(handler: (event: Event) => void): Unsubscribe;
  onSubmission(handler: (submission: Submission) => void): Unsubscribe;
  dispose(): void;
}

export interface TransportFactory {
  inProcess(): { consumer: Transport; engine: Transport };
  webSocket(url: string): Promise<Transport>;
  mesh(deviceID: string): Promise<Transport>;
}

export interface SessionTransport {
  readonly sessionID: SessionID;
  submit(submission: Submission): void;
  onEvent(handler: (event: Event) => void): Unsubscribe;
  dispose(): void;
}
