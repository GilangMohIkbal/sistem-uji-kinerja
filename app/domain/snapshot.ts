import { SEED_VERSION, LEGACY_SEED_VERSION } from '../data/fixtures.ts';
import { hydrateEvidence, STAGE2_SEED_VERSION } from './evidence-seed.ts';
import { hydrateAssessments, validAssessmentState, STAGE3_SEED_VERSION } from './assessment.ts';
import { hydrateOperations, validOperations } from './operations.ts';
import { isEvidenceContent, normalizeEvidenceContent } from './evidence.ts';
import type { Snapshot, LegacySnapshot, Stage2Snapshot, Stage3Snapshot } from './types.ts';
function record(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null && !Array.isArray(value); }
function text(value: unknown): value is string { return typeof value === 'string' && value.length > 0; }
function date(value: unknown): value is string { return text(value) && Number.isFinite(Date.parse(value)); }
function oneOf(value: unknown, choices: string[]): boolean { return typeof value === 'string' && choices.includes(value); }
function positive(value: unknown): boolean { return Number.isInteger(value) && (value as number) > 0; }
function unique(values: unknown[], key: string): boolean { return new Set(values.map((item) => (item as Record<string, unknown>)[key])).size === values.length; }
// Validate the previous schema before migration. Unknown or corrupt snapshots stay on disk;
// the service opens a temporary seed with a notice until an explicit reset.
function isBaseSnapshot(value: unknown, schemaVersion: number, seedVersion: string): boolean {
    if (!record(value) || value.schemaVersion !== schemaVersion || value.seedVersion !== seedVersion || !date(value.savedAt) || !record(value.data))
        return false;
    const data = value.data;
    if (!date(data.clockNow) || !Array.isArray(data.users) || !data.users.length || !Array.isArray(data.periods) || !data.periods.length || !Array.isArray(data.attempts) || !Array.isArray(data.assignments) || !Array.isArray(data.announcements) || !Array.isArray(data.readMarkers))
        return false;
    if (!data.users.every((u) => record(u) && text(u.id) && text(u.email) && text(u.displayName) && oneOf(u.role, ['peserta', 'penguji', 'pengelola']) && typeof u.active === 'boolean' && typeof u.interactive === 'boolean' && (u.role !== 'penguji' || oneOf(u.examinerKind, ['dosen', 'guru']))))
        return false;
    if (!data.periods.every((p) => record(p) && text(p.id) && text(p.name) && positive(p.year) && date(p.collectionOpensAt) && date(p.collectionClosesAt) && date(p.assessmentOpensAt) && date(p.assessmentClosesAt) && text(p.rubricVersionId) && oneOf(p.caseStudySource, ['participant_report', 'exam_snapshot']) && record(p.requirements) && typeof p.requirements.fullVideo === 'boolean' && typeof p.requirements.summaryVideo === 'boolean' && typeof p.interviewEnabled === 'boolean' && typeof p.interviewRequiredForRelease === 'boolean' && (p.quota === null || positive(p.quota))))
        return false;
    if (!data.attempts.every((a) => record(a) && text(a.id) && text(a.participantId) && text(a.periodId) && text(a.subject) && positive(a.attemptNumber) && (a.previousAttemptId === null || text(a.previousAttemptId)) && typeof a.archived === 'boolean' && oneOf(a.packageStatus, ['draft', 'submitted', 'revision_requested', 'resubmitted']) && oneOf(a.completeness, ['pending', 'complete', 'needs_correction']) && record(a.components) && ['perangkat', 'video', 'studi_kasus'].every((key) => typeof (a.components as Record<string, unknown>)[key] === 'boolean') && (a.evidenceVersion === null || positive(a.evidenceVersion)) && record(a.publication) && oneOf(a.publication.status, ['unpublished', 'published', 'withdrawn']) && (a.publication.version === null || positive(a.publication.version)) && (a.publication.feedback === null || typeof a.publication.feedback === 'string') && oneOf(a.moderation, ['none', 'open', 'resolved'])))
        return false;
    if (!data.assignments.every((a) => record(a) && text(a.id) && text(a.attemptId) && text(a.examinerId) && oneOf(a.kind, ['dosen', 'guru']) && typeof a.active === 'boolean' && positive(a.evidenceVersion) && oneOf(a.assessmentStatus, ['not_started', 'draft', 'final']) && (a.finalVersion === null || positive(a.finalVersion)) && (a.assessmentStatus !== 'final' || positive(a.finalVersion))))
        return false;
    if (!data.announcements.every((a) => record(a) && text(a.id) && text(a.title) && text(a.body) && date(a.publishedAt) && Array.isArray(a.audience) && a.audience.every((role) => oneOf(role, ['peserta', 'penguji', 'pengelola']))))
        return false;
    if (!data.readMarkers.every((r) => record(r) && text(r.userId) && text(r.announcementId) && date(r.readAt)))
        return false;
    if (![data.users, data.periods, data.attempts, data.assignments, data.announcements].every((items) => unique(items, 'id')))
        return false;
    const snapshot = value as unknown as Snapshot;
    const d = snapshot.data;
    return d.attempts.every((a) => d.users.some((u) => u.id === a.participantId && u.role === 'peserta') && d.periods.some((p) => p.id === a.periodId) && (a.previousAttemptId === null || d.attempts.some((old) => old.id === a.previousAttemptId && old.participantId === a.participantId && old.archived && old.attemptNumber < a.attemptNumber)))
        && d.assignments.every((a) => d.attempts.some((attempt) => attempt.id === a.attemptId) && d.users.some((u) => u.id === a.examinerId && u.role === 'penguji' && u.examinerKind === a.kind))
        && d.readMarkers.every((r) => d.users.some((u) => u.id === r.userId) && d.announcements.some((a) => a.id === r.announcementId));
}
export function isLegacySnapshot(value: unknown): value is LegacySnapshot { return isBaseSnapshot(value, 1, LEGACY_SEED_VERSION); }
function isEvidenceSnapshot(value: unknown, schema: number, seed: string): boolean {
    if (!isBaseSnapshot(value, schema, seed))
        return false;
    const s = value as Snapshot, d = s.data;
    if (!Array.isArray(d.drafts) || !Array.isArray(d.evidenceVersions) || !Array.isArray(d.reviews) || !Array.isArray(d.activities))
        return false;
    if (!d.users.every(u => u.role !== 'pengelola' || Array.isArray(u.managedPeriodIds) && u.managedPeriodIds.every(id => d.periods.some(p => p.id === id))))
        return false;
    if (!d.drafts.every(x => record(x) && text(x.attemptId) && Number.isInteger(x.revision) && x.revision >= 0 && date(x.updatedAt) && isEvidenceContent(x.content)))
        return false;
    if (!d.evidenceVersions.every(x => record(x) && text(x.id) && text(x.attemptId) && positive(x.version) && text(x.receipt) && date(x.submittedAt) && text(x.submittedBy) && Number.isInteger(x.sourceDraftRevision) && typeof x.fixture === 'boolean' && isEvidenceContent(x.content)))
        return false;
    if (!d.reviews.every(x => record(x) && text(x.id) && text(x.evidenceVersionId) && oneOf(x.outcome, ['complete', 'needs_correction']) && record(x.checks) && ['perangkat', 'video', 'studi_kasus'].every(k => typeof x.checks[k as keyof typeof x.checks] === 'boolean') && record(x.issues) && Object.entries(x.issues).every(([k, v]) => ['perangkat', 'video', 'studi_kasus'].includes(k) && typeof v === 'string') && text(x.actorId) && text(x.actorName) && date(x.reviewedAt) && typeof x.fixture === 'boolean'))
        return false;
    if (!d.activities.every(x => record(x) && text(x.id) && text(x.attemptId) && (x.evidenceVersionId === null || text(x.evidenceVersionId)) && text(x.actorId) && text(x.actorName) && text(x.action) && date(x.at) && typeof x.reason === 'string' && typeof x.fixture === 'boolean'))
        return false;
    if (!unique(d.drafts, 'attemptId') || !unique(d.evidenceVersions, 'id') || !unique(d.evidenceVersions, 'receipt') || !unique(d.reviews, 'id') || !unique(d.activities, 'id'))
        return false;
    if (new Set(d.evidenceVersions.map(v => v.attemptId + ':' + v.version)).size !== d.evidenceVersions.length)
        return false;
    try {
        for (const item of [...d.drafts, ...d.evidenceVersions]) {
            const attempt = d.attempts.find(a => a.id === item.attemptId);
            if (!attempt)
                return false;
            const period = d.periods.find(p => p.id === attempt.periodId)!;
            if (JSON.stringify(normalizeEvidenceContent(item.content, period)) !== JSON.stringify(item.content))
                return false;
            if ('submittedBy' in item && item.submittedBy !== attempt.participantId)
                return false;
        }
    }
    catch {
        return false;
    }
    return d.attempts.every(a => (a.evidenceVersion === null || d.evidenceVersions.some(v => v.attemptId === a.id && v.version === a.evidenceVersion)) && (!['draft', 'revision_requested'].includes(a.packageStatus) || d.drafts.some(x => x.attemptId === a.id)))
        && d.reviews.every(r => d.evidenceVersions.some(v => v.id === r.evidenceVersionId) && d.users.some(u => u.id === r.actorId))
        && d.activities.every(e => d.attempts.some(a => a.id === e.attemptId) && d.users.some(u => u.id === e.actorId) && (e.evidenceVersionId === null || d.evidenceVersions.some(v => v.id === e.evidenceVersionId && v.attemptId === e.attemptId)));
}
export function isStage2Snapshot(value: unknown): value is Stage2Snapshot { return isEvidenceSnapshot(value, 2, STAGE2_SEED_VERSION); }
export function isStage3Snapshot(value: unknown): value is Stage3Snapshot { return isEvidenceSnapshot(value, 3, STAGE3_SEED_VERSION) && validAssessmentState((value as Stage3Snapshot).data); }
export function isSnapshot(value: unknown): value is Snapshot { return isEvidenceSnapshot(value, 4, SEED_VERSION) && validAssessmentState((value as Snapshot).data) && validOperations((value as Snapshot).data); }
export function decodeSnapshot(value: unknown): {
    snapshot: Snapshot;
    migrated: boolean;
} | null {
    if (isSnapshot(value))
        return { snapshot: structuredClone(value), migrated: false };
    if (isStage3Snapshot(value))
        return { snapshot: { schemaVersion: 4, seedVersion: SEED_VERSION, savedAt: value.savedAt, data: hydrateOperations(value.data) }, migrated: true };
    if (isStage2Snapshot(value))
        return { snapshot: { schemaVersion: 4, seedVersion: SEED_VERSION, savedAt: value.savedAt, data: hydrateOperations(hydrateAssessments(value.data)) }, migrated: true };
    if (isLegacySnapshot(value))
        return { snapshot: { schemaVersion: 4, seedVersion: SEED_VERSION, savedAt: value.savedAt, data: hydrateOperations(hydrateAssessments(hydrateEvidence(value.data))) }, migrated: true };
    return null;
}
