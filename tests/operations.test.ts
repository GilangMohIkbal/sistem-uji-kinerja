import assert from 'node:assert/strict'
import test from 'node:test'
import { createSeed, createStage3Seed, DEMO_PASSWORD } from '../app/data/fixtures.ts'
import { fixtureContent } from '../app/domain/evidence-seed.ts'
import { decodeSnapshot, isSnapshot } from '../app/domain/snapshot.ts'
import { csvText } from '../app/domain/operations.ts'
import { createMockService, STATE_KEY, SESSION_KEY } from '../app/services/mock.ts'
import type { Snapshot, StorageLike } from '../app/domain/types.ts'
import type { PublicFeedback } from '../app/domain/operations-types.ts'

function storage(): StorageLike { const m = new Map<string, string>(); return { getItem: k => m.get(k) ?? null, setItem: (k, v) => { m.set(k, v) }, removeItem: k => { m.delete(k) } } }
function setup(seed = createSeed()) { const local = storage(), session = storage(); local.setItem(STATE_KEY, JSON.stringify(seed)); const s = createMockService({ localStorage: local, sessionStorage: session }); s.login('pengelola@demo.invalid', DEMO_PASSWORD); return { s, local, session } }
type Service = ReturnType<typeof createMockService>
function final(s: Service, id: string, score = 3) {
  const v = s.getAssessment(id), content = v.draft.content
  for (const [key, r] of Object.entries(content.ratings)) { r.score = score; r.note = `PRIVATE-${key}-${v.examiner.id}` }
  for (const c of v.rubric.components) { content.feedback[c.id] = `INTERNAL-${c.id}-${v.examiner.id}`; content.reviewed[c.id] = true }
  const d = s.saveAssessmentDraft(id, content, v.draft.revision); return s.finalizeAssessment(id, d.revision, true)
}
function both(s: Service, attempt = 'attempt-3') { s.switchAccount('penguji-dosen'); final(s, `${attempt}-dosen`); s.switchAccount('penguji-guru'); final(s, `${attempt}-guru`, 2); s.switchAccount('pengelola-1') }
function open(s: Service, attempt = 'attempt-3') { const r = s.getMonitoring().find(r => r.id === attempt)!; return s.openModeration(attempt, ['P1'], 'Tinjau kesesuaian tujuan dengan bukti', r.token, true) }
const publicContent: PublicFeedback = { strengths: 'Kekuatan publik', improvements: 'Saran publik', feedback: { perangkat: 'Feedback perangkat publik', video: 'Feedback video publik', studi_kasus: 'Feedback kasus publik' }, showComponentScores: false }
function publish(s: Service, id: string, key = crypto.randomUUID(), content = publicContent) { const p = s.previewPublication(id, content); return s.publishResult(id, content, p.token, key, 'Publikasi yang telah ditinjau', true) }

test('schema3 migration retains every prior collection, draft/final, session and clock; malformed schema4 stays on disk', () => {
  const old = createStage3Seed(); old.data.clockNow = '2026-11-20T05:00:00.000Z'; old.data.users[0]!.displayName = 'Nama tersimpan'
  const migrated = decodeSnapshot(old)!.snapshot
  const { moderations, publications, interviews, adminEvents, ...preserved } = migrated.data
  assert.deepEqual(preserved, old.data); assert.equal(migrated.schemaVersion, 4); assert.ok(isSnapshot(migrated)); assert.ok(moderations.every(m => m.fixture)); assert.equal(publications.length, 0); assert.equal(interviews.length + adminEvents.length, 0)
  const local = storage(), session = storage(); local.setItem(STATE_KEY, JSON.stringify(old)); session.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, userId: 'penguji-dosen' }))
  const s = createMockService({ localStorage: local, sessionStorage: session }); assert.equal(s.getUser()!.id, 'penguji-dosen'); assert.equal(s.getSnapshot().data.clockNow, old.data.clockNow)
  const invalid = structuredClone(migrated); (invalid.data as unknown as Record<string, unknown>).moderations = [{ id: 'bad' }]
  assert.equal(decodeSnapshot(invalid), null); const raw = JSON.stringify(invalid); local.setItem(STATE_KEY, raw); createMockService({ localStorage: local }).login('pengelola@demo.invalid', DEMO_PASSWORD); assert.equal(local.getItem(STATE_KEY), raw)
})

test('management roles, pair completeness, wrong kind and stale assignment tokens are enforced', () => {
  const { s } = setup(); const p = s.previewAssignment('attempt-1')
  assert.throws(() => s.assignPair('attempt-1', 'penguji-dosen', 'penguji-guru', p.token, 'Assign', true), /lengkap/)
  const ready = s.previewAssignment('attempt-3')
  assert.throws(() => s.assignPair('attempt-3', 'penguji-guru', 'penguji-guru', ready.token, 'Assign', true), /berbeda/)
  assert.throws(() => s.assignPair('attempt-3', 'penguji-dosen', 'penguji-guru', 'stale', 'Assign', true), /terbaru/)
  s.switchAccount('penguji-dosen'); assert.throws(() => s.getManagement()); assert.throws(() => s.getMonitoring()); assert.throws(() => s.exportMonitoring()); assert.throws(() => s.previewAssignment('attempt-3'))
  s.switchAccount('peserta-1'); assert.throws(() => s.listModerations()); assert.throws(() => s.getPublications()); assert.throws(() => s.listAssessmentProgress())
})

test('moderation opens only after two finals; selected-indicator disclosure excludes private feedback and unrelated notes', () => {
  const { s } = setup(); assert.throws(() => open(s), /final/); both(s)
  const m = open(s); assert.throws(() => open(s), /terbuka/)
  s.switchAccount('penguji-dosen'); const view = s.getModeration(m.id), encoded = JSON.stringify(view)
  assert.ok(encoded.includes('PRIVATE-P1-penguji-guru')); assert.ok(!encoded.includes('PRIVATE-P2-penguji-guru')); assert.ok(!encoded.includes('INTERNAL-'))
  assert.equal(view.comparisons[1]!.indicators.length, 1); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('PRIVATE-P1-penguji-guru'))
  assert.throws(() => s.respondModeration(m.id, 'retain', view.comparisons.find(c => !c.own)!.finalId, 'Wrong final'), /terkini/)
  s.switchAccount('peserta-1'); assert.throws(() => s.getModeration(m.id)); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('PRIVATE-'))
})

test('moderation revision remains own, reasoned and versioned; stale responses block closure until both latest finals are acknowledged', () => {
  const { s } = setup(); both(s); const m = open(s)
  s.switchAccount('penguji-dosen'); const first = s.getAssessment('attempt-3-dosen').assessment!.finals[0]!
  s.respondModeration(m.id, 'retain', first.id, 'Bukti sudah sesuai')
  assert.throws(() => s.beginAssessmentRevision('attempt-3-guru', 1, 'Cannot edit partner'))
  s.beginAssessmentRevision('attempt-3-dosen', 1, 'Perjelas pembacaan indikator')
  assert.throws(() => s.respondModeration(m.id, 'retain', first.id, 'Draft exists'), /revisi/)
  const revised = final(s, 'attempt-3-dosen', 4); assert.equal(revised.version, 2); assert.equal(s.getAssessment('attempt-3-dosen').assessment!.finals[0]!.content.ratings.P1!.score, 3)
  s.switchAccount('penguji-guru'); const gf = s.getAssessment('attempt-3-guru').assessment!.finals.at(-1)!
  s.respondModeration(m.id, 'retain', gf.id, 'Mempertahankan dengan bukti')
  s.switchAccount('pengelola-1'); assert.throws(() => s.closeModeration(m.id, 'Close', true), /terkini/)
  s.switchAccount('penguji-dosen'); s.respondModeration(m.id, 'revise', revised.id, 'Penjelasan diperbarui')
  s.switchAccount('pengelola-1'); s.closeModeration(m.id, 'Dua penjelasan diterima; skor independen tetap berbeda', true)
  assert.equal(s.getModeration(m.id).status, 'resolved'); assert.equal(s.previewPublication('attempt-3', publicContent).problems.length, 0)
  assert.ok(isSnapshot(s.getSnapshot()))
})

test('period closure requires an explicit moderation window; it never unlocks first assessment', () => {
  const { s } = setup(); both(s); s.setClock('closed'); assert.throws(() => open(s), /jendela/)
  s.setModerationWindow('periode-2026', '2026-12-11T00:00:00Z', '2026-12-12T00:00:00Z', 'Menuntaskan kasus tertunda')
  const m = open(s); s.switchAccount('penguji-dosen'); s.beginAssessmentRevision('attempt-3-dosen', 1, 'Review bukti dalam jendela'); final(s, 'attempt-3-dosen')
  assert.throws(() => s.saveAssessmentDraft('attempt-6-dosen', s.getAssessment('attempt-6-dosen').draft.content, 0), /tertutup/)
  assert.equal(s.getModeration(m.id).status, 'open')
})

test('publication is explicit, optimistic, idempotent, immutable by version and withdrawn with reasons', () => {
  const { s } = setup(); both(s); const p = s.previewPublication('attempt-3', publicContent)
  assert.throws(() => s.publishResult('attempt-3', publicContent, p.token, 'key', 'Reason', false), /Konfirmasi/)
  const first = s.publishResult('attempt-3', publicContent, p.token, 'key', 'Reason', true)
  assert.equal(first.scores.length, 0); assert.deepEqual(s.publishResult('attempt-3', publicContent, p.token, 'key', 'Reason', true), first)
  assert.throws(() => s.publishResult('attempt-3', { ...publicContent, strengths: 'Changed' }, p.token, 'key', 'Reason', true), /Kunci/)
  assert.throws(() => s.publishResult('attempt-3', publicContent, p.token, 'new', 'Reason', true), /berubah/)
  const second = publish(s, 'attempt-3', 'v2', { ...publicContent, strengths: 'Koreksi versi dua', showComponentScores: true })
  assert.equal(second.version, 2); assert.equal(second.scores.length, 2); assert.equal(s.getPublications().find(p => p.id === first.id)!.strengths, publicContent.strengths)
  assert.throws(() => s.withdrawPublication(second.id, ' ', true)); assert.equal(s.getPublications().at(-1)!.status, 'published')
  s.withdrawPublication(second.id, 'Perlu koreksi', true); assert.equal(s.getSnapshot().data.attempts.find(a => a.id === 'attempt-3')!.publication.status, 'withdrawn'); assert.ok(isSnapshot(s.getSnapshot()))
})

test('a full participant-to-two-examiners-to-moderation-to-publication flow persists and exposes only public payload', () => {
  const { s, local, session } = setup(); s.switchAccount('peserta-1'); const view = s.getPackage(); const d = s.saveDraft(view.attempt.id, fixtureContent('participant_report'), view.draft!.revision); const e = s.submitPackage(view.attempt.id, d.revision, true)
  s.switchAccount('pengelola-1'); s.reviewPackage(e.id, { outcome: 'complete', checks: { perangkat: true, video: true, studi_kasus: true }, issues: {} })
  const pair = s.getSnapshot().data.assignments.filter(a => a.active && a.attemptId === view.attempt.id)
  for (const a of pair) { s.switchAccount(a.examinerId); final(s, a.id) }
  s.switchAccount('pengelola-1'); const m = open(s, view.attempt.id)
  for (const a of pair) { s.switchAccount(a.examinerId); if (a.kind === 'dosen') { s.beginAssessmentRevision(a.id, 1, 'Revisi setelah membandingkan bukti'); const f = final(s, a.id, 4); s.respondModeration(m.id, 'revise', f.id, 'Perbaikan interpretasi') } else s.respondModeration(m.id, 'retain', s.getAssessment(a.id).assessment!.finals[0]!.id, 'Bukti cukup') }
  s.switchAccount('pengelola-1'); s.closeModeration(m.id, 'Diskusi dituntaskan', true)
  s.switchAccount('peserta-1'); assert.equal(s.getPublishedResults()[0]!.result, null)
  s.switchAccount('pengelola-1'); const publication = publish(s, view.attempt.id)
  s.switchAccount('peserta-1'); const restored = createMockService({ localStorage: local, sessionStorage: session }), result = restored.getPublishedResults().find(r => r.attemptId === view.attempt.id)!.result!
  assert.equal(result.version, publication.version); assert.equal(result.strengths, publicContent.strengths); assert.equal(result.scores.length, 0)
  assert.equal(restored.getDashboard().metrics[2]!.value, 1); assert.equal(restored.getDashboard().publishedFeedback, publicContent.strengths + '\n' + publicContent.improvements)
  assert.ok(!JSON.stringify(result).includes('INTERNAL-')); assert.ok(!JSON.stringify(restored.getClientSnapshot()).includes('PRIVATE-')); assert.ok(isSnapshot(restored.getSnapshot()))
})

test('replacement archives cases and preserves old assessment history without transferring scores or allowing former access', () => {
  const { s } = setup(); both(s); const m = open(s); const old = s.getSnapshot().data.assessments.find(a => a.assignmentId === 'attempt-3-dosen')!
  const newUser = s.saveManagedUser({ id: '', displayName: 'Dosen Cadangan', email: 'cadangan@demo.invalid', role: 'penguji', examinerKind: 'dosen', active: true }, 'Tambahkan cadangan')
  const p = s.previewAssignment('attempt-3'); s.assignPair('attempt-3', newUser.id, 'penguji-guru', p.token, 'Penguji awal berhalangan', true)
  assert.equal(s.getModeration(m.id).status, 'archived'); assert.deepEqual(s.getSnapshot().data.assessments.find(a => a.id === old.id), old)
  const newAssignment = s.getSnapshot().data.assignments.find(a => a.active && a.examinerId === newUser.id)!; assert.ok(!s.getSnapshot().data.assessments.some(a => a.assignmentId === newAssignment.id))
  s.switchAccount('penguji-dosen'); assert.equal(s.getAssessment('attempt-3-dosen').editable, false); assert.throws(() => s.getEvidence(old.evidenceVersionId)); assert.ok(s.getAssessmentHistory().some(h => h.id === 'attempt-3-dosen'))
  s.switchAccount('pengelola-1'); assert.throws(() => s.switchAccount(newUser.id)); assert.ok(isSnapshot(s.getSnapshot()))
})

test('period editing freezes used rules, duplication preserves old period, empty CRUD and archived collection remain safe', () => {
  const { s } = setup(), old = s.getManagement().periods[0]!, subjects = [...new Set(s.getManagement().attempts.map(a => a.subject))]
  const input = { ...old, subjects, track: 'PPG', interviewEnabled: true }
  assert.throws(() => s.savePeriod(input, 0, 'Change rules'), /Duplikasi/)
  const p = s.savePeriod({ ...input, id: '', name: 'Periode wawancara' }, null, 'Periode baru')
  assert.equal(s.getManagement().periods.find(p => p.id === old.id)!.interviewEnabled, false)
  const attempt = s.enrollParticipant(p.id, 'peserta-1', subjects[0]!, 'Tambah peserta')
  s.switchAccount('peserta-1'); assert.ok(s.getPackage(attempt).editable); s.switchAccount('pengelola-1'); assert.throws(() => s.archivePeriod(p.id, ' ')); assert.equal(s.getManagement().periods.find(x => x.id === p.id)!.archived, false)
  s.archivePeriod(p.id, 'Periode selesai'); s.switchAccount('peserta-1'); assert.equal(s.getPackage(attempt).editable, false); assert.throws(() => s.saveDraft(attempt, fixtureContent(), 0), /tertutup/)
  s.switchAccount('pengelola-1'); assert.throws(() => s.deletePeriod(p.id, 'Delete'), /arsip/)
  const empty = s.savePeriod({ ...input, id: '', name: 'Kosong' }, null, 'Test'); s.deletePeriod(empty.id, 'Belum digunakan'); assert.ok(isSnapshot(s.getSnapshot()))
})

test('interview is conditional, required only by period config, version-bound, and participant never receives internal notes', () => {
  const seed = createSeed(); seed.data.periods[0]!.interviewEnabled = true; seed.data.periods[0]!.interviewRequiredForRelease = true
  const { s } = setup(seed); both(s); assert.ok(s.previewPublication('attempt-3', publicContent).problems.some(p => p.includes('Wawancara')))
  s.saveInterview('attempt-3', { scheduledAt: seed.data.clockNow, url: 'https://meet.demo.invalid/session', status: 'scheduled', notes: 'INTERNAL-INTERVIEW' }, 0, 'Jadwal contoh')
  assert.throws(() => s.saveInterview('attempt-3', { scheduledAt: seed.data.clockNow, url: 'javascript:alert(1)', status: 'completed', notes: '' }, 1, 'Test'))
  s.saveInterview('attempt-3', { scheduledAt: seed.data.clockNow, url: 'https://meet.demo.invalid/session', status: 'completed', notes: 'INTERNAL-INTERVIEW' }, 1, 'Sudah dilaksanakan dalam simulasi')
  assert.equal(s.previewPublication('attempt-3', publicContent).problems.length, 0)
  s.switchAccount('penguji-dosen'); assert.ok(JSON.stringify(s.listInterviews()).includes('INTERNAL-INTERVIEW')); s.switchAccount('peserta-1'); assert.ok(!JSON.stringify(s.listInterviews()).includes('INTERNAL-INTERVIEW')); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('INTERNAL-INTERVIEW'))
  const optional = createSeed(); optional.data.periods[0]!.interviewEnabled = true; const { s: o } = setup(optional); both(o); assert.equal(o.previewPublication('attempt-3', publicContent).problems.length, 0)
})

test('package revision invalidates published snapshot, assignments and interview without deleting finals', () => {
  const { s } = setup(); both(s); publish(s, 'attempt-3'); const before = s.getSnapshot().data.assessments
  const evidenceId = s.getMonitoring().find(r => r.id === 'attempt-3')!.evidenceVersionId!
  s.reviewPackage(evidenceId, { outcome: 'needs_correction', checks: { perangkat: true, video: false, studi_kasus: true }, issues: { video: 'Video perlu diperbaiki' } })
  assert.equal(s.getPublications().at(-1)!.status, 'withdrawn'); assert.deepEqual(s.getSnapshot().data.assessments, before); assert.ok(isSnapshot(s.getSnapshot()))
  s.switchAccount('peserta-1'); assert.equal(s.getClientSnapshot().data.attempts.find(a => a.id === 'attempt-3')!.publication.feedback, null)
})

test('announcements are drafts until published, audience and period scoped; archival preserves read markers', () => {
  const { s } = setup(); const a = s.saveAnnouncement({ id: '', title: 'Peserta saja', body: 'PUBLIC-NOTICE', audience: ['peserta'], periodIds: ['periode-2026'] }, null)
  s.switchAccount('peserta-1'); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('PUBLIC-NOTICE')); assert.throws(() => s.markAnnouncementRead(a.id)); s.switchAccount('pengelola-1'); s.setAnnouncementStatus(a.id, 'published', 'Terbitkan')
  s.switchAccount('penguji-dosen'); assert.throws(() => s.markAnnouncementRead(a.id)); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('PUBLIC-NOTICE'))
  s.switchAccount('peserta-1'); s.markAnnouncementRead(a.id); assert.ok(JSON.stringify(s.getClientSnapshot()).includes('PUBLIC-NOTICE'))
  s.switchAccount('pengelola-1'); s.setAnnouncementStatus(a.id, 'archived', 'Selesai'); s.switchAccount('peserta-1'); assert.ok(!JSON.stringify(s.getClientSnapshot()).includes('PUBLIC-NOTICE')); assert.equal(s.getSnapshot().data.readMarkers.filter(r => r.announcementId === a.id).length, 1); assert.ok(isSnapshot(s.getSnapshot()))
})

test('user deactivation blocks examiner actions; CSV output escapes formulas, quotes, and exports only manager scope', () => {
  const { s } = setup(); const guru = s.getManagement().users.find(u => u.id === 'penguji-guru')!
  s.saveManagedUser({ ...guru, active: false }, 'Guru berhalangan'); assert.throws(() => s.switchAccount(guru.id)); assert.ok(s.getMonitoring().find(r => r.id === 'attempt-3')!.problems.some(p => p.includes('aktif')))
  assert.throws(() => s.deleteManagedUser(guru.id, 'Delete')); assert.throws(() => s.saveManagedUser({ ...guru, active: true, email: 'real@example.com' }, 'Bad email'))
  const csv = csvText([[' =SUM(A1:A2)', '+formula', '-formula', '@formula', '\tvalue', 'a"b', 'a,b']]); assert.ok(csv.includes('"\' =SUM(A1:A2)"')); assert.ok(csv.includes('"a""b"')); assert.ok(csv.includes('"a,b"')); assert.ok(s.exportMonitoring().startsWith('\ufeff'))
  s.switchAccount('peserta-1'); assert.throws(() => s.exportMonitoring())
})
