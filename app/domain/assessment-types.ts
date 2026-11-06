import type { Assignment, Attempt, ComponentId, EvidenceVersion, Period, User } from './types.ts'

export interface RubricIndicator { id: string; title: string; focus: string; required: boolean; descriptors: Record<string, string> }
export interface RubricComponent { id: ComponentId; title: string; required: boolean; indicators: RubricIndicator[] }
export interface RubricVersion {
  id: string; sourceId: string; version: string; label: string; isOfficial: false
  components: RubricComponent[]
}
export interface IndicatorRating { score: number | null; note: string; evidenceId: string }
export interface VideoNote {
  id: string; evidenceVersionId: string; evidenceId: string; videoId: string
  seconds: number; durationSeconds: number | null; source: 'manual' | 'player'; indicatorId: string | null; text: string
}
export interface AssessmentContent {
  ratings: Record<string, IndicatorRating>
  feedback: Record<ComponentId, string>
  reviewed: Record<ComponentId, boolean>
  videoNotes: VideoNote[]
}
export interface AssessmentDraft {
  revision: number; updatedAt: string; content: AssessmentContent
  basedOnFinal: number | null; revisionReason: string; permissionId: string | null
}
export interface AssessmentFinal {
  id: string; version: number; sourceDraftRevision: number; actorId: string; finalizedAt: string
  evidenceVersionId: string; rubricVersionId: string; content: AssessmentContent
  revisionReason: string; permissionId: string | null; fixture: boolean
}
export interface RevisionPermission {
  moderationCaseId?: string;
  id: string; finalVersion: number; reason: string; actorId: string; at: string; consumed: boolean
}
export interface TechnicalIssue {
  id: string; component: ComponentId; reason: string; actorId: string; reportedAt: string
  resolvedAt: string | null; resolution: string
}
export interface AssessmentEvent { id: string; action: string; actorId: string; at: string; reason: string; fixture: boolean }
export interface Assessment {
  id: string; assignmentId: string; examinerId: string; evidenceVersionId: string; rubricVersionId: string
  rubric: RubricVersion; draft: AssessmentDraft | null; finals: AssessmentFinal[]
  permissions: RevisionPermission[]; technicalIssues: TechnicalIssue[]; events: AssessmentEvent[]
}
export interface AssessmentView {
  assignment: Assignment; attempt: Attempt; period: Period; participant: User; examiner: User
  evidence: EvidenceVersion; rubric: RubricVersion; assessment: Assessment | null
  draft: AssessmentDraft; editable: boolean; blockers: string[]; canBeginRevision: boolean; partnerName: string
}
export interface AssignmentRow {
  id: string; participant: string; subject: string; periodId: string; periodName: string
  attemptNumber: number; evidenceVersion: number; rubricVersionId: string; completeness: Attempt['completeness']
  status: 'not_started' | 'draft' | 'final'; revisionDraft: boolean; blocked: boolean; blocker: string
  openIssues: number; finalizedAt: string | null; fixture: boolean
}
