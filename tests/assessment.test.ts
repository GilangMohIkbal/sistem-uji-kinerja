import assert from 'node:assert/strict'
import test from 'node:test'
import { createSeed, createStage2Seed, DEMO_PASSWORD } from '../app/data/fixtures.ts'
import { assessmentSummary, evidenceChoices, normalizeAssessment, parseTimestamp } from '../app/domain/assessment.ts'
import { fixtureContent } from '../app/domain/evidence-seed.ts'
import { decodeSnapshot, isSnapshot } from '../app/domain/snapshot.ts'
import { createMockService, STATE_KEY, SESSION_KEY } from '../app/services/mock.ts'
import type { Snapshot, StorageLike } from '../app/domain/types.ts'

function storage(): StorageLike { const m = new Map<string, string>(); return { getItem: k => m.get(k) ?? null, setItem: (k,v) => { m.set(k,v) }, removeItem: k => { m.delete(k) } } }
function setup(seed: Snapshot = createSeed()) {
  const local = storage(), tab = storage(); local.setItem(STATE_KEY, JSON.stringify(seed))
  const service = createMockService({ localStorage: local, sessionStorage: tab }); service.login('dosen@demo.invalid', DEMO_PASSWORD)
  return { service, local, tab }
}
type Service = ReturnType<typeof createMockService>
function complete(s: Service, id = 'attempt-3-dosen', marker = 'Pengamatan pribadi dosen') {
  const v = s.getAssessment(id), content = v.draft.content
  for (const r of Object.values(content.ratings)) { r.score = 1; r.note = marker }
  for (const c of v.rubric.components) { content.feedback[c.id] = marker; content.reviewed[c.id] = true }
  return s.saveAssessmentDraft(id, content, v.draft.revision)
}
test('examiner drafts, private projections, manager progress and participant output stay isolated by actor', () => {
  const { service: s } = setup(), marker = 'PRIVATE-DOSEN-ONLY'
  const draft = complete(s, 'attempt-3-dosen', marker)
  assert.equal(s.getDashboard().rows.find(r => r.id === 'attempt-3')!.assessmentStatus, 'draft')
  assert.throws(() => s.getAssessment('attempt-3-guru'))
  assert.throws(() => s.saveAssessmentDraft('attempt-3-guru', draft.content, 0))
  s.switchAccount('penguji-guru')
  assert.equal(s.getAssessment('attempt-3-guru').draft.content.ratings.P1!.score, null)
  assert.equal(JSON.stringify(s.getClientSnapshot()).includes(marker), false)
  assert.equal(JSON.stringify(s.getAssessmentHistory()).includes(marker), false)
  complete(s, 'attempt-3-guru', 'PRIVATE-GURU-ONLY')
  s.switchAccount('pengelola-1')
  assert.throws(() => s.getAssessment('attempt-3-dosen'))
  assert.equal(JSON.stringify(s.listAssessmentProgress()).includes(marker), false)
  assert.equal(JSON.stringify(s.getClientSnapshot()).includes(marker), false)
  s.switchAccount('peserta-1')
  assert.throws(() => s.getAssessment('attempt-3-dosen'))
  assert.equal(JSON.stringify(s.getClientSnapshot()).includes(marker), false)
  assert.equal(s.getDashboard().publishedFeedback, null)
  s.switchAccount('penguji-dosen')
  assert.equal(s.getAssessment('attempt-3-dosen').draft.content.feedback.video, marker)
  assert.equal(JSON.stringify(s.getClientSnapshot()).includes('PRIVATE-GURU-ONLY'), false)
})
test('draft persistence survives switch and same-origin refresh; stale revision and returned-copy mutation cannot overwrite', () => {
  const { service: s, local, tab } = setup(), v = s.getAssessment('attempt-3-dosen')
  v.draft.content.ratings.P1!.score = 2
  const saved = s.saveAssessmentDraft(v.assignment.id, v.draft.content, 0)
  saved.content.ratings.P1!.score = 4
  assert.throws(() => s.saveAssessmentDraft(v.assignment.id, v.draft.content, 0), /berubah/)
  s.switchAccount('penguji-guru'); s.switchAccount('penguji-dosen')
  const restored = createMockService({ localStorage: local, sessionStorage: tab })
  assert.equal(restored.getUser()!.id, 'penguji-dosen')
  assert.equal(restored.getAssessment(v.assignment.id).draft.content.ratings.P1!.score, 2)
  assert.equal(restored.getAssessment(v.assignment.id).draft.content.ratings.P2!.score, null)
  assert.ok(isSnapshot(restored.getSnapshot()))
})
test('rubric null is unscored, minimum is 1; invalid scales, references, missing feedback and review confirmation block final', () => {
  const { service: s } = setup(), v = s.getAssessment('attempt-3-dosen'), c = v.draft.content
  assert.equal(assessmentSummary(c, v.rubric)[0]!.score, null)
  for (const score of [0, 5, 1.5, NaN]) { c.ratings.P1!.score = score; assert.throws(() => normalizeAssessment(c, v.rubric, v.evidence), /Skor/) }
  c.ratings.P1!.score = null
  c.ratings.P1!.evidenceId = 'foreign-packet'; assert.throws(() => normalizeAssessment(c, v.rubric, v.evidence), /rujukan/)
  c.ratings.P1!.evidenceId = evidenceChoices(v.evidence, 'perangkat')[0]!.id
  let draft = s.saveAssessmentDraft(v.assignment.id, c, 0)
  assert.throws(() => s.finalizeAssessment(v.assignment.id, draft.revision, true), /skor belum diisi/)
  draft = complete(s)
  draft.content.feedback.video = ' '; draft.content.reviewed.perangkat = false
  draft = s.saveAssessmentDraft(v.assignment.id, draft.content, draft.revision)
  const preview = s.previewAssessmentFinal(v.assignment.id, draft.revision)
  assert.ok(preview.problems.some(p => p.includes('feedback')))
  assert.ok(preview.problems.some(p => p.includes('konfirmasi')))
  assert.throws(() => s.finalizeAssessment(v.assignment.id, draft.revision, true))
})
test('finalization is confirmed, exact-retry idempotent and immutable with actor, clock and version bindings', () => {
  const { service: s, local, tab } = setup(), draft = complete(s)
  assert.throws(() => s.finalizeAssessment('attempt-3-dosen', draft.revision, false), /Konfirmasi/)
  const before = s.getSnapshot(), final = s.finalizeAssessment('attempt-3-dosen', draft.revision, true)
  assert.equal(final.actorId, 'penguji-dosen'); assert.equal(final.finalizedAt, before.data.clockNow)
  assert.equal(final.evidenceVersionId, s.getAssessment('attempt-3-dosen').evidence.id)
  assert.equal(final.rubricVersionId, 'demo-12-v1')
  assert.equal(assessmentSummary(final.content, s.getAssessment('attempt-3-dosen').rubric)[0]!.score, 4)
  assert.deepEqual(s.finalizeAssessment('attempt-3-dosen', draft.revision, true), final)
  assert.equal(s.getAssessment('attempt-3-dosen').assessment!.finals.length, 1)
  assert.throws(() => s.saveAssessmentDraft('attempt-3-dosen', draft.content, draft.revision), /final/)
  assert.equal(s.getDashboard().metrics[2]!.value, 3)
  assert.equal(s.getSnapshot().data.attempts.find(a => a.id === 'attempt-3')!.publication.status, 'unpublished')
  const restored = createMockService({ localStorage: local, sessionStorage: tab })
  assert.deepEqual(restored.finalizeAssessment('attempt-3-dosen', draft.revision, true), final)
  final.content.ratings.P1!.score = 4
  assert.equal(restored.getAssessment('attempt-3-dosen').assessment!.finals[0]!.content.ratings.P1!.score, 1)
})
test('revision requires scoped manager permission and owner reason, preserves prior final, resets reviewed flags and is retry-safe', () => {
  const { service: s } = setup(), draft = complete(s), id = 'attempt-3-dosen'
  const original = s.finalizeAssessment(id, draft.revision, true)
  assert.throws(() => s.beginAssessmentRevision(id, 1, 'Koreksi catatan'), /izin/)
  assert.throws(() => s.grantAssessmentRevision(id, 1, 'Izin sendiri'))
  s.switchAccount('pengelola-1')
  assert.throws(() => s.grantAssessmentRevision(id, 1, ' '), /Alasan/)
  const permission = s.grantAssessmentRevision(id, 1, 'Penguji meminta koreksi rujukan')
  assert.deepEqual(s.grantAssessmentRevision(id, 1, 'Penguji meminta koreksi rujukan'), permission)
  assert.throws(() => s.beginAssessmentRevision(id, 1, 'Tidak boleh mengganti nilai penguji'))
  s.switchAccount('penguji-dosen')
  assert.throws(() => s.beginAssessmentRevision(id, 1, ''), /Alasan/)
  const revision = s.beginAssessmentRevision(id, 1, 'Memperbaiki catatan berdasarkan bukti yang sama')
  assert.deepEqual(s.beginAssessmentRevision(id, 1, revision.revisionReason), revision)
  assert.ok(Object.values(revision.content.reviewed).every(v => v === false))
  assert.throws(() => s.finalizeAssessment(id, revision.revision, true), /konfirmasi/)
  const updated = complete(s, id, 'Feedback revisi'), final2 = s.finalizeAssessment(id, updated.revision, true)
  assert.equal(final2.version, 2); assert.equal(final2.permissionId, permission.id)
  assert.deepEqual(s.getAssessment(id).assessment!.finals[0], original)
  assert.throws(() => s.beginAssessmentRevision(id, 2, 'Coba lagi'), /izin/)
  assert.ok(isSnapshot(s.getSnapshot()))
})
test('technical issues with reasons block finalization without changing scores; owner resolution is required', () => {
  const { service: s } = setup(), id = 'attempt-3-dosen', draft = complete(s)
  assert.throws(() => s.reportAssessmentIssue(id, 'video', ''), /Alasan/)
  s.reportAssessmentIssue(id, 'video', 'Video tidak dapat diputar')
  assert.throws(() => s.finalizeAssessment(id, draft.revision, true), /kendala teknis/)
  const view = s.getAssessment(id), issue = view.assessment!.technicalIssues[0]!
  assert.equal(view.draft.content.ratings.V1!.score, 1)
  s.switchAccount('pengelola-1')
  assert.equal(s.listAssessmentProgress().find(r => r.id === id)!.issues[0]!.reason, issue.reason)
  assert.throws(() => s.resolveAssessmentIssue(id, issue.id, 'Manager tidak mengedit penilaian'))
  s.switchAccount('penguji-dosen')
  assert.throws(() => s.resolveAssessmentIssue(id, issue.id, ' '), /Alasan/)
  s.resolveAssessmentIssue(id, issue.id, 'Video dapat diperiksa langsung di YouTube')
  assert.equal(s.finalizeAssessment(id, draft.revision, true).version, 1)
})
test('video notes bind exact package, video and optional video indicator with safe timestamps and duration fallback', () => {
  const { service: s } = setup(), v = s.getAssessment('attempt-3-dosen'), choice = evidenceChoices(v.evidence, 'video')[0]!
  assert.equal(parseTimestamp('01:30'), 90); assert.equal(parseTimestamp('1:02:03'), 3723); assert.equal(parseTimestamp('90'), 90)
  for (const invalid of ['-1', '01:60', '1.5', 'NaN', 'Infinity', '1:2', '999999999999999999999']) assert.throws(() => parseTimestamp(invalid))
  const n = { id: 'note-1', evidenceVersionId: v.evidence.id, evidenceId: choice.id, videoId: choice.videoId, seconds: 90, durationSeconds: null, source: 'manual' as const, indicatorId: 'V1', text: 'Instruksi pada momen ini' }
  for (const change of [{ evidenceVersionId: 'other' }, { evidenceId: 'other' }, { videoId: 'other' }, { indicatorId: 'P1' }, { seconds: -1 }, { seconds: 1.2 }, { durationSeconds: 30 }]) {
    const c = structuredClone(v.draft.content); c.videoNotes = [{ ...n, ...change }]
    assert.throws(() => s.saveAssessmentDraft(v.assignment.id, c, 0), /Catatan video/)
  }
  v.draft.content.videoNotes = [n]
  const draft = s.saveAssessmentDraft(v.assignment.id, v.draft.content, 0)
  assert.equal(draft.content.videoNotes[0]!.seconds, 90)
  assert.ok(isSnapshot(s.getSnapshot()))
})
test('assignment, completeness, package version, instrument version and DemoClock are enforced at service boundaries', () => {
  for (const mutate of [
    (x: Snapshot) => { x.data.assignments.find(a => a.id === 'attempt-3-dosen')!.active = false },
    (x: Snapshot) => { x.data.attempts.find(a => a.id === 'attempt-3')!.completeness = 'pending' },
    (x: Snapshot) => { x.data.reviews.find(r => r.evidenceVersionId === 'attempt-3-evidence-1')!.outcome = 'needs_correction' },
    (x: Snapshot) => { x.data.periods[0]!.rubricVersionId = 'unknown-version' },
    (x: Snapshot) => { x.data.clockNow = '2027-01-01T00:00:00.000Z' },
    (x: Snapshot) => { x.data.clockNow = '2026-10-01T00:00:00.000Z' },
  ]) {
    const first = setup(), draft = complete(first.service), seed = first.service.getSnapshot(); mutate(seed)
    const { service: s } = setup(seed)
    assert.throws(() => s.saveAssessmentDraft('attempt-3-dosen', draft.content, draft.revision))
    assert.throws(() => s.finalizeAssessment('attempt-3-dosen', draft.revision, true))
    assert.equal(s.getAssessment('attempt-3-dosen').draft.revision, draft.revision)
  }
})
test('package correction archives old assessment, rejects stale finalization and starts fresh on the new evidence', () => {
  const { service: s } = setup(); s.switchAccount('peserta-1')
  const d = s.saveDraft('attempt-1', fixtureContent('participant_report'), 0), v1 = s.submitPackage('attempt-1', d.revision, true)
  s.switchAccount('pengelola-1'); const checks = { perangkat: true, video: true, studi_kasus: true }
  s.reviewPackage(v1.id, { outcome: 'complete', checks, issues: {} })
  s.switchAccount('penguji-dosen'); const a1 = s.listAssignments().find(a => a.participant === 'Alya Prameswari')!, draft = complete(s, a1.id)
  const final = s.finalizeAssessment(a1.id, draft.revision, true)
  s.switchAccount('penguji-guru'); const guruId = s.listAssignments().find(a => a.participant === 'Alya Prameswari')!.id, guruDraft = complete(s, guruId)
  s.switchAccount('pengelola-1'); s.reviewPackage(v1.id, { outcome: 'needs_correction', checks, issues: { video: 'Tautan berubah' } })
  s.switchAccount('penguji-guru'); assert.throws(() => s.finalizeAssessment(guruId, guruDraft.revision, true), /diarsipkan|belum/)
  s.switchAccount('peserta-1'); const next = s.getPackage().draft!, v2 = s.submitPackage('attempt-1', next.revision, true)
  s.switchAccount('pengelola-1'); s.reviewPackage(v2.id, { outcome: 'complete', checks, issues: {} })
  s.switchAccount('penguji-dosen'); const a2 = s.listAssignments().find(a => a.participant === 'Alya Prameswari')!
  assert.notEqual(a2.id, a1.id); assert.equal(s.getAssessment(a2.id).draft.content.ratings.P1!.score, null)
  assert.deepEqual(s.getAssessment(a1.id).assessment!.finals[0], final)
  assert.equal(s.getAssessment(a1.id).editable, false)
  assert.ok(s.getAssessmentHistory().some(r => r.id === a1.id))
  assert.ok(isSnapshot(s.getSnapshot()))
})
test('schema2 migration preserves all existing state and session; fixture finals are explicitly labeled and corrupt current schema is retained', () => {
  const old = createStage2Seed(), local = storage(), tab = storage()
  old.data.clockNow = '2026-11-20T05:00:00.000Z'; old.data.users[0]!.displayName = 'Nama khusus'
  old.data.drafts[0]!.revision = 7; old.data.drafts[0]!.content.caseStudy.reflection = 'Draf belum selesai'
  old.data.readMarkers.push({ userId: 'penguji-dosen', announcementId: 'welcome', readAt: old.data.clockNow })
  local.setItem(STATE_KEY, JSON.stringify(old)); tab.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, userId: 'penguji-dosen' }))
  const s = createMockService({ localStorage: local, sessionStorage: tab }), migrated = s.getSnapshot()
  assert.equal(migrated.schemaVersion, 4); const { assessments, moderations, publications, interviews, adminEvents, ...preserved } = migrated.data
  assert.deepEqual(preserved, old.data); assert.ok(assessments.flatMap(a => a.finals).every(f => f.fixture))
  assert.equal(s.getUser()!.id, 'penguji-dosen'); assert.ok(isSnapshot(migrated)); assert.ok(decodeSnapshot(migrated))
  const corrupt = structuredClone(migrated); corrupt.data.assessments[0]!.examinerId = 'penguji-guru'
  assert.equal(decodeSnapshot(corrupt), null)
  local.setItem(STATE_KEY, JSON.stringify(corrupt)); const broken = createMockService({ localStorage: local, sessionStorage: tab }); broken.markAnnouncementRead('welcome')
  assert.equal(local.getItem(STATE_KEY), JSON.stringify(corrupt))
})
test('local file unavailability blocks final without becoming zero; dashboard derives status from records, not legacy metadata', () => {
  const { service: s } = setup(), draft = complete(s), seed = s.getSnapshot()
  const evidence = seed.data.evidenceVersions.find(v => v.id === 'attempt-3-evidence-1')!
  const file = evidence.content.mainDocument!; file.source = 'local'; delete file.sampleId
  file.sha256 = 'a'.repeat(64)
  seed.data.assignments.find(a => a.id === 'attempt-3-dosen')!.assessmentStatus = 'final'
  seed.data.assignments.find(a => a.id === 'attempt-3-dosen')!.finalVersion = 99
  const { service: restored } = setup(seed)
  assert.equal(restored.getDashboard().rows.find(r => r.id === 'attempt-3')!.assessmentStatus, 'draft')
  assert.throws(() => restored.finalizeAssessment('attempt-3-dosen', draft.revision, true), /tersedia|dipilih/)
  assert.equal(restored.getAssessment('attempt-3-dosen').draft.content.ratings.P1!.score, 1)
})
test('quota is inactive by default; configured daily quota counts initial finals once and permits authorized revisions', () => {
  const seed = createSeed(); seed.data.periods[0]!.quota = 1
  const { service: s } = setup(seed), d = complete(s)
  s.finalizeAssessment('attempt-3-dosen', d.revision, true)
  assert.equal(s.finalizeAssessment('attempt-3-dosen', d.revision, true).version, 1)
  const other = complete(s, 'attempt-6-dosen')
  assert.throws(() => s.finalizeAssessment('attempt-6-dosen', other.revision, true), /Kuota/)
  s.switchAccount('pengelola-1'); s.grantAssessmentRevision('attempt-3-dosen', 1, 'Perbaikan catatan')
  s.switchAccount('penguji-dosen'); s.beginAssessmentRevision('attempt-3-dosen', 1, 'Koreksi catatan')
  const revision = complete(s)
  assert.equal(s.finalizeAssessment('attempt-3-dosen', revision.revision, true).version, 2)
})
