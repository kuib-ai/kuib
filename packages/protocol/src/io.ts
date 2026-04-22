/**
 * I/O interfaces — filesystem, shell, and network.
 *
 * These are purely behavioral interfaces (methods, not data), so they
 * remain as TypeScript interfaces. No Zod schemas here — these are
 * contracts that implementations must satisfy, not data to validate.
 *
 * Implementations are injected by the consumer:
 *   TUI:   LocalFS + LocalShell
 *   Web:   PostgresFS + NsjailShell
 *   Tests: MemoryFS + MockShell
 */

// ---------------------------------------------------------------------------
// Filesystem
// ---------------------------------------------------------------------------

export interface FileSystem {
  read(path: string): Promise<string>
  readBytes(path: string): Promise<Uint8Array>
  write(path: string, content: string): Promise<void>
  writeBytes(path: string, content: Uint8Array): Promise<void>
  exists(path: string): Promise<boolean>
  stat(path: string): Promise<FileStat>
  readdir(path: string): Promise<DirEntry[]>
  mkdir(path: string, options?: { recursive?: boolean }): Promise<void>
  remove(path: string, options?: { recursive?: boolean }): Promise<void>
  rename(oldPath: string, newPath: string): Promise<void>
  resolve(...segments: string[]): string
  watch?(path: string, callback: (event: FileWatchEvent) => void): Disposable
}

export interface FileStat {
  readonly isFile: boolean
  readonly isDirectory: boolean
  readonly size: number
  readonly modifiedAt: number
  readonly createdAt: number
}

export interface DirEntry {
  readonly name: string
  readonly isFile: boolean
  readonly isDirectory: boolean
}

export interface FileWatchEvent {
  readonly type: "create" | "modify" | "delete"
  readonly path: string
}

export interface Disposable {
  dispose(): void
}

// ---------------------------------------------------------------------------
// Shell
// ---------------------------------------------------------------------------

export interface Shell {
  exec(command: string, options?: ShellOptions): Promise<ShellResult>
  spawn(command: string, options?: ShellOptions): ShellProcess
}

export interface ShellOptions {
  readonly cwd?: string
  readonly env?: Record<string, string>
  readonly timeout?: number
  readonly signal?: AbortSignal
}

export interface ShellResult {
  readonly exitCode: number
  readonly stdout: string
  readonly stderr: string
}

export interface ShellProcess {
  readonly stdout: AsyncIterable<string>
  readonly stderr: AsyncIterable<string>
  readonly exitCode: Promise<number>
  kill(signal?: string): void
}

// ---------------------------------------------------------------------------
// Network (mesh operations)
// ---------------------------------------------------------------------------

export interface Network {
  ping(deviceID: string): Promise<boolean>
  remoteExec(deviceID: string, command: string, options?: ShellOptions): Promise<ShellResult>
  remoteSpawn(deviceID: string, command: string, options?: ShellOptions): ShellProcess
}

// ---------------------------------------------------------------------------
// I/O context — the bundle injected into the engine
// ---------------------------------------------------------------------------

export interface IOContext {
  readonly fs: FileSystem
  readonly shell: Shell
  readonly network?: Network
  readonly cwd: string
}
