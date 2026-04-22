/**
 * State management — LangGraph-inspired reducer-annotated state.
 *
 * Each field in session state has a defined merge strategy.
 * When a partial update comes in, the reducer says how to merge it.
 * No ambiguity: messages append, status overwrites, usage accumulates.
 *
 * This is the state that gets checkpointed for persistence/resumption.
 */

import { z } from "zod"
import { Message } from "./message.js"
import { Discussion, SessionStatus } from "./session.js"

// ---------------------------------------------------------------------------
// Reducer — how a field merges updates
// ---------------------------------------------------------------------------

export type Reducer<T> = (current: T, update: T) => T

export const Reducers = {
  overwrite<T>(): Reducer<T> { return (_current, update) => update },
  append<T>(): Reducer<T[]> { return (current, update) => [...current, ...update] },
  merge<T extends Record<string, unknown>>(): Reducer<T> {
    return (current, update) => ({ ...current, ...update })
  },
  increment(): Reducer<number> { return (current, update) => current + update },
  max(): Reducer<number> { return (current, update) => Math.max(current, update) },
}

// ---------------------------------------------------------------------------
// State field — schema + default + reducer
// ---------------------------------------------------------------------------

export interface StateField<T> {
  readonly schema: z.ZodType<T>
  readonly default: () => T
  readonly reducer: Reducer<T>
}

export function field<T>(config: {
  schema: z.ZodType<T>
  default: () => T
  reducer: Reducer<T>
}): StateField<T> {
  return config
}

// ---------------------------------------------------------------------------
// Usage accumulator
// ---------------------------------------------------------------------------

export const UsageAccumulator = z.object({
  input: z.number(),
  output: z.number(),
  reasoning: z.number(),
  cost: z.number(),
  cache: z.object({ read: z.number(), write: z.number() }),
})
export type UsageAccumulator = z.infer<typeof UsageAccumulator>

// ---------------------------------------------------------------------------
// Session state definition
// ---------------------------------------------------------------------------

export type SessionStateDefinition = {
  status: StateField<z.infer<typeof SessionStatus>>
  messages: StateField<z.infer<typeof Message>[]>
  discussions: StateField<z.infer<typeof Discussion>[]>
  usage: StateField<UsageAccumulator>
}

export const SESSION_STATE: SessionStateDefinition = {
  status: field({
    schema: SessionStatus,
    default: () => "idle" as z.infer<typeof SessionStatus>,
    reducer: Reducers.overwrite(),
  }),
  messages: field({
    schema: z.array(Message),
    default: () => [] as z.infer<typeof Message>[],
    reducer: Reducers.append(),
  }),
  discussions: field({
    schema: z.array(Discussion),
    default: () => [] as z.infer<typeof Discussion>[],
    reducer: Reducers.append(),
  }),
  usage: field({
    schema: UsageAccumulator,
    default: () => ({ input: 0, output: 0, reasoning: 0, cost: 0, cache: { read: 0, write: 0 } }),
    reducer: (current, update) => ({
      input: current.input + update.input,
      output: current.output + update.output,
      reasoning: current.reasoning + update.reasoning,
      cost: current.cost + update.cost,
      cache: {
        read: current.cache.read + update.cache.read,
        write: current.cache.write + update.cache.write,
      },
    }),
  }),
}

// ---------------------------------------------------------------------------
// State container utilities
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyStateField = StateField<any>

type FieldValue<F> = F extends StateField<infer T> ? T : never

export type StateValues<D extends Record<string, AnyStateField>> = {
  [K in keyof D]: FieldValue<D[K]>
}

export type StateUpdate<D extends Record<string, AnyStateField>> = {
  [K in keyof D]?: FieldValue<D[K]>
}

export type SessionState = StateValues<SessionStateDefinition>
export type SessionStateUpdate = StateUpdate<SessionStateDefinition>

export function applyUpdate<D extends Record<string, AnyStateField>>(
  definition: D,
  current: StateValues<D>,
  update: StateUpdate<D>,
): StateValues<D> {
  const result = { ...current }
  for (const key in update) {
    if (key in definition && update[key] !== undefined) {
      const f = definition[key]
      ;(result as Record<string, unknown>)[key] = f.reducer(current[key], update[key])
    }
  }
  return result
}

export function createState<D extends Record<string, AnyStateField>>(
  definition: D,
): StateValues<D> {
  const state = {} as Record<string, unknown>
  for (const key in definition) {
    state[key] = definition[key].default()
  }
  return state as StateValues<D>
}

/** Validate a state snapshot against its field schemas */
export function validateState<D extends Record<string, AnyStateField>>(
  definition: D,
  state: unknown,
): StateValues<D> {
  const obj = state as Record<string, unknown>
  const result = {} as Record<string, unknown>
  for (const key in definition) {
    result[key] = definition[key].schema.parse(obj[key])
  }
  return result as StateValues<D>
}
