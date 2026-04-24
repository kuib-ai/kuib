// ---------------------------------------------------------------------------
// @kuib/protocol — schemas, events, and interfaces
//
// Zod schemas for runtime validation. Types inferred from schemas.
// Behavioral interfaces (with methods) remain as TypeScript interfaces.
// ---------------------------------------------------------------------------

// IDs — schemas + types
export * from "./id.js";

// Messages — schemas + types
export * from "./message.js";

// Session — schemas + types
export * from "./session.js";

// Provider — schemas + types + interfaces
export * from "./provider.js";

// Submissions (SQ — user → engine) — schemas + types
export * from "./submission.js";

// Events (EQ — engine → user) — schemas + types
export * from "./event.js";

// Tools — schemas + types + interfaces
export * from "./tool.js";

// I/O — interfaces only (behavioral contracts, no schemas)
export * from "./io.js";

// Security — schemas + types + interfaces
export * from "./security.js";

// State — schemas + types + utilities
export * from "./state.js";

// Transport — interfaces only
export * from "./transport.js";
