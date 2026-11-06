import type { ComponentId } from './types.ts'

export interface ModerationCase {
  id: string; attemptId: string; evidenceVersionId: string; rubricVersionId: string
  assignmentIds: string[]; openedFinalIds: string[]; indicatorIds: string[]; reason: string
  status: 'open' | 'awaiting_responses' | 'resolved' | 'archived'
  openedBy: string; openedAt: string; fixture: boolean
  responses: { examinerId: string; finalId: string; decision: 'retain' | 'revise'; reason: string; at: string }[]
  resolution: string; closedAt: string | null; closedBy: string | null
}
export interface PublicFeedback {
  strengths: string; improvements: string
  feedback: Record<ComponentId, string>; showComponentScores: boolean
}
export interface Publication extends PublicFeedback {
  id: string; attemptId: string; evidenceVersionId: string; rubricVersionId: string; version: number
  sourceFinalIds: string[]; sourceAssignmentIds: string[]
  scores: { kind: 'dosen' | 'guru'; components: { id: ComponentId; total: number; maximum: number }[] }[]
  publishedAt: string; publishedBy: string; status: 'published' | 'superseded' | 'withdrawn'
  reason: string; withdrawnAt: string | null; withdrawnBy: string | null; withdrawalReason: string
  requestKey: string; requestHash: string; fixture: boolean
}
export interface Interview {
  id: string; attemptId: string; evidenceVersionId: string; assignmentIds: string[]
  revision: number; scheduledAt: string; url: string
  status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled'; notes: string
  history: { status: string; at: string; actorId: string; reason: string; scheduledAt: string; url: string; notes: string }[]
}
export interface AdminEvent {
  id: string; actorId: string; at: string; action: string; entityId: string; periodId: string | null; reason: string
}
