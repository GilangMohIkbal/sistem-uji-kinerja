import type { Stage3Data, UkinData, User } from './types.ts'

export const STAGE4_SEED_VERSION = '2026-11-stage4'
export const clone = <T>(x: T): T => structuredClone(x)
export function required(value: string, label = 'Alasan', max = 5000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} wajib diisi, maksimal ${max} karakter.`)
  return value.trim()
}
export function moderationWindowOpen(data: UkinData, periodId: string) {
  const w = data.periods.find(p => p.id === periodId)?.moderationWindow, now = Date.parse(data.clockNow)
  return !!w && now >= Date.parse(w.opensAt) && now <= Date.parse(w.closesAt)
}
export function activeCase(data: UkinData, assignmentId: string) {
  return data.moderations.find(m => ['open', 'awaiting_responses'].includes(m.status) && m.assignmentIds.includes(assignmentId))
}
export function periodIdsFor(data: UkinData, user: User) {
  return user.role === 'pengelola' ? user.managedPeriodIds ?? [] : data.attempts.filter(a => user.role === 'peserta' ? a.participantId === user.id : data.assignments.some(x => x.active && x.attemptId === a.id && x.examinerId === user.id)).map(a => a.periodId)
}
export function archiveWorkflow(data: UkinData, attemptId: string, actorId: string, reason: string) {
  const attempt = data.attempts.find(a => a.id === attemptId)!
  data.moderations.filter(m => m.attemptId === attemptId && ['open', 'awaiting_responses'].includes(m.status)).forEach(m => {
    m.status = 'archived'; m.resolution = reason; m.closedAt = data.clockNow; m.closedBy = actorId
  })
  data.publications.filter(p => p.attemptId === attemptId && p.status === 'published').forEach(p => {
    p.status = 'withdrawn'; p.withdrawnAt = data.clockNow; p.withdrawnBy = actorId; p.withdrawalReason = reason
  })
  data.interviews.filter(i => i.attemptId === attemptId && i.status !== 'cancelled').forEach(i => {
    i.status = 'cancelled'; i.revision++
    i.history.push({ status: 'cancelled', at: data.clockNow, actorId, reason, scheduledAt: i.scheduledAt, url: i.url, notes: i.notes })
  })
  attempt.moderation = 'none'
  if (attempt.publication.status === 'published') attempt.publication.status = 'withdrawn'
  // Preserve legacy metadata as history. Account projections hide it after withdrawal.
}
export function hydrateOperations(base: Stage3Data): UkinData {
  const data: UkinData = { ...clone(base), moderations: [], publications: [], interviews: [], adminEvents: [] }
  for (const attempt of data.attempts) {
    const assignments = data.assignments.filter(a => a.active && a.attemptId === attempt.id && a.evidenceVersion === attempt.evidenceVersion)
    const assessments = assignments.map(a => data.assessments.find(x => x.assignmentId === a.id))
    const evidence = data.evidenceVersions.find(e => e.attemptId === attempt.id && e.version === attempt.evidenceVersion)
    if (attempt.moderation === 'open' && evidence && assessments.length === 2 && assessments.every(a => a?.finals.length)) {
      const first = assessments[0]!
      data.moderations.push({ id: `moderation-legacy-${attempt.id}`, attemptId: attempt.id, evidenceVersionId: evidence.id, rubricVersionId: first.rubricVersionId,
        assignmentIds: assignments.map(a => a.id), openedFinalIds: assessments.map(a => a!.finals.at(-1)!.id), indicatorIds: first.rubric.components.flatMap(c => c.indicators.map(i => i.id)),
        reason: 'Kasus contoh yang sudah ditandai moderasi pada snapshot lama. Bukan deteksi selisih otomatis.', status: 'open', openedBy: data.users.find(u => u.role === 'pengelola')!.id,
        openedAt: data.clockNow, fixture: true, responses: [], resolution: '', closedAt: null, closedBy: null })
    }
    if (attempt.publication.status === 'published' && evidence) {
      data.publications.push({ id: `publication-legacy-${attempt.id}`, attemptId: attempt.id, evidenceVersionId: evidence.id, rubricVersionId: data.periods.find(p => p.id === attempt.periodId)!.rubricVersionId,
        version: attempt.publication.version ?? 1, sourceFinalIds: [], sourceAssignmentIds: [], scores: [], strengths: attempt.publication.feedback ?? 'Publikasi contoh dari snapshot lama.', improvements: '', feedback: { perangkat: '', video: '', studi_kasus: '' }, showComponentScores: false,
        publishedAt: data.clockNow, publishedBy: data.users.find(u => u.role === 'pengelola')!.id, status: 'published', reason: 'Migrasi metadata publikasi lama; tidak menambahkan skor.', withdrawnAt: null, withdrawnBy: null, withdrawalReason: '', requestKey: `legacy-${attempt.id}`, requestHash: '', fixture: true })
    }
  }
  return data
}
export function validOperations(data: UkinData): boolean {
  try {
    if (![data.moderations, data.publications, data.interviews, data.adminEvents].every(a => Array.isArray(a) && new Set(a.map(x => x?.id)).size === a.length)) return false
    const text = (x: unknown) => typeof x === 'string', date = (x: unknown) => text(x) && Number.isFinite(Date.parse(x as string))
    const linked = (x: { attemptId: string; evidenceVersionId: string }) => data.evidenceVersions.some(v => v.id === x.evidenceVersionId && v.attemptId === x.attemptId)
    const ids = (xs: string[]) => Array.isArray(xs) && xs.every(id => data.assignments.some(a => a.id === id))
    if (!data.moderations.every(m => linked(m) && ids(m.assignmentIds) && m.assignmentIds.length === 2 && ['open', 'awaiting_responses', 'resolved', 'archived'].includes(m.status) && date(m.openedAt) && text(m.reason) && text(m.resolution) && Array.isArray(m.indicatorIds) && m.indicatorIds.length > 0 && Array.isArray(m.openedFinalIds) && Array.isArray(m.responses) && m.responses.every(r => text(r.examinerId) && text(r.finalId) && ['retain', 'revise'].includes(r.decision) && text(r.reason) && date(r.at)))) return false
    if (!data.publications.every(p => linked(p) && ids(p.sourceAssignmentIds) && Number.isInteger(p.version) && p.version > 0 && ['published', 'superseded', 'withdrawn'].includes(p.status) && date(p.publishedAt) && text(p.strengths) && text(p.improvements) && ['perangkat', 'video', 'studi_kasus'].every(k => text(p.feedback[k as keyof typeof p.feedback])) && typeof p.showComponentScores === 'boolean' && Array.isArray(p.scores) && Array.isArray(p.sourceFinalIds) && text(p.requestKey) && text(p.requestHash))) return false
    if (!data.interviews.every(i => linked(i) && ids(i.assignmentIds) && Number.isInteger(i.revision) && i.revision > 0 && date(i.scheduledAt) && text(i.url) && text(i.notes) && ['scheduled', 'rescheduled', 'completed', 'cancelled'].includes(i.status) && Array.isArray(i.history) && i.history.every(h => date(h.at) && text(h.reason) && text(h.notes)))) return false
    if (!data.adminEvents.every(e => text(e.id) && text(e.actorId) && date(e.at) && text(e.action) && text(e.reason))) return false
    const finalFor = (id: string) => data.assessments.find(a => a.finals.some(f => f.id === id))
    if (!data.moderations.every(m => new Set(m.assignmentIds).size === 2 && m.openedFinalIds.length === 2 && m.assignmentIds.every(id => {
      const assignment = data.assignments.find(a => a.id === id)!, assessment = data.assessments.find(a => a.assignmentId === id)
      return assignment.attemptId === m.attemptId && !!assessment && assessment.evidenceVersionId === m.evidenceVersionId && assessment.rubricVersionId === m.rubricVersionId && assessment.finals.some(f => m.openedFinalIds.includes(f.id)) && m.indicatorIds.every(id => assessment.rubric.components.some(c => c.indicators.some(i => i.id === id)))
    }) && new Set(m.responses.map(r => r.examinerId)).size === m.responses.length && m.responses.every(r => {
      const a = finalFor(r.finalId); return !!a && a.examinerId === r.examinerId && m.assignmentIds.includes(a.assignmentId)
    }) && data.users.some(u => u.id === m.openedBy && u.role === 'pengelola'))) return false
    if (!data.publications.every(p => typeof p.fixture === 'boolean' && p.sourceFinalIds.every(id => {
      const a = finalFor(id); return !!a && a.evidenceVersionId === p.evidenceVersionId && a.rubricVersionId === p.rubricVersionId && p.sourceAssignmentIds.includes(a.assignmentId)
    }) && (p.fixture || p.sourceFinalIds.length === 2 && new Set(p.sourceAssignmentIds).size === 2) && p.scores.every(s => ['dosen', 'guru'].includes(s.kind) && Array.isArray(s.components) && s.components.length === 3 && s.components.every(c => ['perangkat', 'video', 'studi_kasus'].includes(c.id) && Number.isInteger(c.total) && c.total > 0 && Number.isInteger(c.maximum) && c.maximum >= c.total)) && (p.showComponentScores || p.scores.length === 0))) return false
    if (!data.assessments.every(a => a.permissions.every(p => !p.moderationCaseId || data.moderations.some(m => m.id === p.moderationCaseId && m.assignmentIds.includes(a.assignmentId))))) return false
    if (!data.announcements.every(a => (!a.status || ['draft', 'published', 'archived'].includes(a.status)) && (!a.periodIds || Array.isArray(a.periodIds) && a.periodIds.every(id => data.periods.some(p => p.id === id))))) return false
    return data.periods.every(p => (!p.subjects || Array.isArray(p.subjects) && p.subjects.every(text)) && (!p.moderationWindow || date(p.moderationWindow.opensAt) && date(p.moderationWindow.closesAt) && text(p.moderationWindow.reason)))
  } catch { return false }
}
export function csvText(rows: (string | number | null)[][]) {
  const cell = (value: string | number | null) => {
    let s = String(value ?? '')
    if (/^[\s]*[=+\-@]/.test(s) || /^[\t\r\n]/.test(s)) s = "'" + s
    return '"' + s.replaceAll('"', '""') + '"'
  }
  return '\ufeff' + rows.map(row => row.map(cell).join(',')).join('\r\n')
}
