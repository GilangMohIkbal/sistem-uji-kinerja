import type { Assessment } from './assessment-types.ts';
import type { AdminEvent, Interview, ModerationCase, Publication } from './operations-types.ts';
export type Role = 'peserta' | 'penguji' | 'pengelola';
export type ExaminerKind = 'dosen' | 'guru';
export type ComponentId = 'perangkat' | 'video' | 'studi_kasus';
export type PackageStatus = 'draft' | 'submitted' | 'revision_requested' | 'resubmitted';
export type Completeness = 'pending' | 'complete' | 'needs_correction';
export type AssessmentStatus = 'not_started' | 'draft' | 'final';
export interface User {
    id: string;
    email: string;
    displayName: string;
    role: Role;
    examinerKind?: ExaminerKind;
    active: boolean;
    interactive: boolean;
    managedPeriodIds?: string[];
}
export interface Period {
    track?: string;
    subjects?: string[];
    archived?: boolean;
    revision?: number;
    moderationWindow?: { opensAt: string; closesAt: string; reason: string; actorId: string; at: string };
    id: string;
    name: string;
    year: number;
    collectionOpensAt: string;
    collectionClosesAt: string;
    assessmentOpensAt: string;
    assessmentClosesAt: string;
    rubricVersionId: string;
    caseStudySource: 'participant_report' | 'exam_snapshot';
    requirements: {
        fullVideo: boolean;
        summaryVideo: boolean;
    };
    interviewEnabled: boolean;
    interviewRequiredForRelease: boolean;
    quota: number | null;
}
export interface Attempt {
    id: string;
    participantId: string;
    periodId: string;
    subject: string;
    attemptNumber: number;
    previousAttemptId: string | null;
    archived: boolean;
    packageStatus: PackageStatus;
    completeness: Completeness;
    components: Record<ComponentId, boolean>;
    evidenceVersion: number | null;
    publication: {
        status: 'unpublished' | 'published' | 'withdrawn';
        version: number | null;
        feedback: string | null;
    };
    moderation: 'none' | 'open' | 'resolved';
}
export interface Assignment {
    id: string;
    attemptId: string;
    examinerId: string;
    kind: ExaminerKind;
    active: boolean;
    evidenceVersion: number;
    assessmentStatus: AssessmentStatus;
    finalVersion: number | null;
}
export interface Announcement {
    status?: 'draft' | 'published' | 'archived';
    periodIds?: string[];
    revision?: number;
    id: string;
    title: string;
    body: string;
    publishedAt: string;
    audience: Role[];
}
export interface ReadMarker {
    userId: string;
    announcementId: string;
    readAt: string;
}
export interface EvidenceFile {
    id: string;
    source: 'sample' | 'local';
    name: string;
    mime: string;
    size: number;
    sampleId?: string;
    sha256: string | null;
}
export interface EvidenceContent {
    mainDocument: EvidenceFile | null;
    attachments: EvidenceFile[];
    video: {
        full: string;
        summary: string;
    };
    caseStudy: {
        mode: 'text' | 'document' | 'exam_snapshot';
        context: string;
        action: string;
        result: string;
        reflection: string;
        document: EvidenceFile | null;
        provenance: string | null;
    };
}
export interface EvidenceDraft {
    attemptId: string;
    revision: number;
    updatedAt: string;
    content: EvidenceContent;
}
export interface EvidenceVersion {
    id: string;
    attemptId: string;
    version: number;
    receipt: string;
    submittedAt: string;
    submittedBy: string;
    content: EvidenceContent;
    sourceDraftRevision: number;
    fixture: boolean;
}
export interface CompletenessReview {
    id: string;
    evidenceVersionId: string;
    outcome: 'complete' | 'needs_correction';
    checks: Record<ComponentId, boolean>;
    issues: Partial<Record<ComponentId, string>>;
    actorId: string;
    actorName: string;
    reviewedAt: string;
    fixture: boolean;
}
export interface ActivityEvent {
    id: string;
    attemptId: string;
    evidenceVersionId: string | null;
    actorId: string;
    actorName: string;
    action: string;
    at: string;
    reason: string;
    fixture: boolean;
    previousState?: {
        moderation: Attempt['moderation'];
        publication: Attempt['publication'];
        assignmentIds: string[];
    };
}
export interface ChecklistItem {
    id: ComponentId;
    label: string;
    complete: boolean;
    issues: string[];
}
export interface PackageView {
    attempt: Attempt;
    period: Period;
    participant: User;
    draft: EvidenceDraft | null;
    versions: EvidenceVersion[];
    reviews: CompletenessReview[];
    history: ActivityEvent[];
    editable: boolean;
    collectionOpen: boolean;
    checklist: ChecklistItem[];
    ready: boolean;
    attemptHistory: AttemptHistoryRow[];
}
export interface AttemptHistoryRow {
    attemptId: string;
    attemptNumber: number;
    periodName: string;
    archived: boolean;
    evidenceVersionId: string;
    version: number;
}
export interface EvidenceView {
    version: EvidenceVersion;
    attempt: Attempt;
    period: Period;
    participant: User;
    reviews: CompletenessReview[];
    history: ActivityEvent[];
    canRestore: boolean;
    isCurrent: boolean;
    canReview: boolean;
    checklist: ChecklistItem[];
    attemptHistory: AttemptHistoryRow[];
}
export interface SubmittedPackageRow {
    id: string;
    attemptId: string;
    participantName: string;
    periodId: string;
    periodName: string;
    subject: string;
    attemptNumber: number;
    version: number;
    receipt: string;
    submittedAt: string;
    packageStatus: PackageStatus;
    completeness: Completeness;
    fixture: boolean;
}
export interface ReviewInput {
    outcome: 'complete' | 'needs_correction';
    checks: Record<ComponentId, boolean>;
    issues: Partial<Record<ComponentId, string>>;
}
export interface BaseData {
    clockNow: string;
    users: User[];
    periods: Period[];
    attempts: Attempt[];
    assignments: Assignment[];
    announcements: Announcement[];
    readMarkers: ReadMarker[];
}
export interface EvidenceData extends BaseData {
    drafts: EvidenceDraft[];
    evidenceVersions: EvidenceVersion[];
    reviews: CompletenessReview[];
    activities: ActivityEvent[];
}
export interface Stage3Data extends EvidenceData {
    assessments: Assessment[];
}
export interface UkinData extends Stage3Data {
    moderations: ModerationCase[];
    publications: Publication[];
    interviews: Interview[];
    adminEvents: AdminEvent[];
}
export interface LegacySnapshot {
    schemaVersion: 1;
    seedVersion: string;
    savedAt: string;
    data: BaseData;
}
export interface Stage2Snapshot {
    schemaVersion: 2;
    seedVersion: string;
    savedAt: string;
    data: EvidenceData;
}
export interface Stage3Snapshot {
    schemaVersion: 3;
    seedVersion: string;
    savedAt: string;
    data: Stage3Data;
}
export interface Snapshot {
    schemaVersion: 4;
    seedVersion: string;
    savedAt: string;
    data: UkinData;
}
export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
    removeItem(key: string): void;
}
export interface FileRuntime {
    register(file: File): Promise<EvidenceFile>;
    restore(meta: EvidenceFile, file: File): Promise<void>;
    available(meta: EvidenceFile): boolean;
    url(meta: EvidenceFile): string | null;
    retain(ids: string[]): void;
    clear(): void;
}
