export interface DebateConfig {
  readonly topic: string
  readonly questionerRole?: string
  readonly answererRole?: string
  readonly maxRounds: number
}

export interface DebateSession {
  readonly id: string
  readonly topic: string
  readonly questionerRole: string
  readonly answererRole: string
  readonly maxRounds: number
  readonly currentRound: number
  readonly status: DebateStatus
  readonly logFile: string
  readonly createdAt: string
}

export type DebateStatus = "pending" | "active" | "completed" | "cancelled"

export interface DebateRecord {
  readonly round: number
  readonly question: string
  readonly answer: string
  readonly timestamp: string
}

export interface DebateSummary {
  readonly summary: string
  readonly consensus: string
  readonly disagreements: string
  readonly conclusion: string
}

export interface DebateError {
  readonly code: DebateErrorCode
  readonly message: string
  readonly details?: unknown
}

export type DebateErrorCode =
  | "INIT_FAILED"
  | "RECORD_FAILED"
  | "SUMMARY_FAILED"
  | "TIMEOUT"
  | "INVALID_CONFIG"

export interface DebateContext {
  readonly directory: string
  readonly worktree?: string
}
