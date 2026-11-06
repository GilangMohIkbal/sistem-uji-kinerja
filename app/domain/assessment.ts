import source from '../data/rubric-demo.v1.json' with { type: 'json' }
import { checklistFor, normalizeYouTubeUrl } from './evidence.ts'
import type { Assessment, AssessmentContent, AssessmentDraft, RubricVersion } from './assessment-types.ts'
import type { Assignment, ComponentId, EvidenceData, EvidenceFile, EvidenceVersion, Period, Stage3Data, UkinData } from './types.ts'

export const ASSESSMENT_COMPONENTS: ComponentId[] = ['perangkat', 'video', 'studi_kasus']
export const STAGE3_SEED_VERSION = '2026-11-stage3'
export const ASSESSMENT_TEXT_LIMIT = 5000
export function getRubric(id: string): RubricVersion {
  if (!['demo-12-v1', source.id].includes(id)) throw new Error('Versi instrumen tidak tersedia. Penilaian ditahan; hubungi pengelola demo.')
  return structuredClone({ id, sourceId: source.id, version: source.version, label: source.label, isOfficial: false, components: source.components }) as RubricVersion
}
export function evidenceChoices(version: EvidenceVersion, component: ComponentId) {
  const c = version.content
  if (component === 'perangkat') return [c.mainDocument, ...c.attachments].filter((f): f is EvidenceFile => !!f).map(f => ({ id: f.id, label: f.name, videoId: '' }))
  if (component === 'video') return (['full', 'summary'] as const).flatMap(slot => {
    const video = normalizeYouTubeUrl(c.video[slot])
    return video ? [{ id: `${version.id}:video:${slot}`, label: slot === 'full' ? 'Video utuh' : 'Video ringkasan', videoId: video.videoId }] : []
  })
  return c.caseStudy.mode === 'document'
    ? c.caseStudy.document ? [{ id: c.caseStudy.document.id, label: c.caseStudy.document.name, videoId: '' }] : []
    : [{ id: `${version.id}:case-text`, label: c.caseStudy.mode === 'exam_snapshot' ? 'Snapshot ujian simulasi' : 'Laporan teks empat bagian', videoId: '' }]
}
export function emptyAssessment(rubric: RubricVersion, evidence: EvidenceVersion): AssessmentContent {
  return {
    ratings: Object.fromEntries(rubric.components.flatMap(c => c.indicators.map(i => [i.id, { score: null, note: '', evidenceId: evidenceChoices(evidence, c.id)[0]?.id ?? '' }]))),
    feedback: { perangkat: '', video: '', studi_kasus: '' }, reviewed: { perangkat: false, video: false, studi_kasus: false }, videoNotes: [],
  }
}
export function initialAssessmentDraft(rubric: RubricVersion, evidence: EvidenceVersion, now: string): AssessmentDraft {
  return { revision: 0, updatedAt: now, content: emptyAssessment(rubric, evidence), basedOnFinal: null, revisionReason: '', permissionId: null }
}
export function newAssessment(assignment: Assignment, evidence: EvidenceVersion, rubric: RubricVersion): Assessment {
  return { id: `assessment-${assignment.id}`, assignmentId: assignment.id, examinerId: assignment.examinerId, evidenceVersionId: evidence.id, rubricVersionId: rubric.id, rubric: structuredClone(rubric), draft: null, finals: [], permissions: [], technicalIssues: [], events: [] }
}
export function assessmentStatus(data: Pick<UkinData, 'assessments'>, assignment: Assignment) {
  const a = data.assessments.find(item => item.assignmentId === assignment.id)
  return a?.draft ? 'draft' as const : a?.finals.length ? 'final' as const : 'not_started' as const
}
export function parseTimestamp(input: string): number {
  const s = input.trim()
  if (!/^\d+(?::[0-5]\d){0,2}$/.test(s)) throw new Error('Gunakan detik bulat, mm:ss, atau hh:mm:ss. Contoh: 90 atau 01:30.')
  const n = s.split(':').reduce((total, part) => total * 60 + Number(part), 0)
  if (!Number.isSafeInteger(n) || n < 0) throw new Error('Timestamp harus berupa detik bulat nonnegatif.')
  return n
}
export function formatTimestamp(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
function object(v: unknown): v is Record<string, unknown> { return !!v && typeof v === 'object' && !Array.isArray(v) }
function boundedText(v: unknown, required = false): v is string { return typeof v === 'string' && v.length <= ASSESSMENT_TEXT_LIMIT && (!required || !!v.trim()) }
export function normalizeAssessment(input: AssessmentContent, rubric: RubricVersion, evidence: EvidenceVersion): AssessmentContent {
  if (!object(input) || !object(input.ratings) || !object(input.feedback) || !object(input.reviewed) || !Array.isArray(input.videoNotes)) throw new Error('Struktur draf penilaian tidak valid.')
  const ids = rubric.components.flatMap(c => c.indicators.map(i => i.id))
  if (Object.keys(input.ratings).length !== ids.length || Object.keys(input.ratings).some(id => !ids.includes(id))) throw new Error('Indikator harus sesuai versi rubrik yang ditugaskan.')
  for (const c of rubric.components) {
    if (!boundedText(input.feedback[c.id]) || typeof input.reviewed[c.id] !== 'boolean') throw new Error('Feedback/konfirmasi komponen tidak valid. Batas teknis 5.000 karakter.')
    for (const i of c.indicators) {
      const rating = input.ratings[i.id]
      if (!rating || !(rating.score === null || Number.isInteger(rating.score) && rating.score >= 1 && rating.score <= 4)) throw new Error('Skor demo harus bilangan bulat 1–4; kosong adalah null, bukan nol.')
      if (!boundedText(rating.note) || typeof rating.evidenceId !== 'string' || rating.evidenceId && !evidenceChoices(evidence, c.id).some(e => e.id === rating.evidenceId)) throw new Error(`Catatan atau rujukan bukti ${i.id} tidak sesuai komponen/versi paket.`)
    }
  }
  if (input.videoNotes.length > 100 || new Set(input.videoNotes.map(n => n?.id)).size !== input.videoNotes.length) throw new Error('Catatan video duplikat atau melebihi batas teknis 100 catatan.')
  const choices = evidenceChoices(evidence, 'video'), videoIndicators = rubric.components.find(c => c.id === 'video')!.indicators
  for (const n of input.videoNotes) {
    if (!object(n) || !boundedText(n.id, true) || n.evidenceVersionId !== evidence.id || !choices.some(v => v.id === n.evidenceId && v.videoId === n.videoId)
      || !Number.isSafeInteger(n.seconds) || n.seconds < 0 || !['manual', 'player'].includes(n.source) || !boundedText(n.text, true)
      || !(n.indicatorId === null || videoIndicators.some(i => i.id === n.indicatorId))
      || !(n.durationSeconds === null || Number.isFinite(n.durationSeconds) && n.durationSeconds > 0 && n.seconds <= n.durationSeconds)) throw new Error('Catatan video harus terkait video/versi/indikator yang tepat, dengan timestamp valid dan tidak melebihi durasi yang diketahui.')
  }
  // Return only supported fields; arbitrary caller fields never enter final snapshots.
  return { ratings: Object.fromEntries(ids.map(id => { const r = input.ratings[id]!; return [id, { score: r.score, note: r.note, evidenceId: r.evidenceId }] })),
    feedback: Object.fromEntries(ASSESSMENT_COMPONENTS.map(c => [c, input.feedback[c]])) as AssessmentContent['feedback'],
    reviewed: Object.fromEntries(ASSESSMENT_COMPONENTS.map(c => [c, input.reviewed[c]])) as AssessmentContent['reviewed'],
    videoNotes: input.videoNotes.map(n => ({ id: n.id, evidenceVersionId: n.evidenceVersionId, evidenceId: n.evidenceId, videoId: n.videoId, seconds: n.seconds, durationSeconds: n.durationSeconds, source: n.source, indicatorId: n.indicatorId, text: n.text })) }
}
export function assessmentSummary(content: AssessmentContent, rubric: RubricVersion) {
  return rubric.components.map(c => {
    const values = c.indicators.map(i => content.ratings[i.id]?.score ?? null)
    return { id: c.id, title: c.title, filled: values.filter(v => v !== null).length, count: values.length, score: values.every(v => v !== null) ? values.reduce<number>((sum, v) => sum + (v ?? 0), 0) : null, maximum: values.length * 4 }
  })
}
export function assessmentProblems(content: AssessmentContent, rubric: RubricVersion, evidence: EvidenceVersion, period: Period, available: (file: EvidenceFile) => boolean) {
  const normalized = normalizeAssessment(content, rubric, evidence)
  const problems = checklistFor(evidence.content, period, available).flatMap(c => c.issues)
  for (const c of rubric.components) {
    for (const i of c.indicators) {
      if (normalized.ratings[i.id]!.score === null) problems.push(`${i.id}: skor belum diisi.`)
      if (!normalized.ratings[i.id]!.evidenceId) problems.push(`${i.id}: rujukan bukti belum dipilih.`)
    }
    if (!normalized.feedback[c.id].trim()) problems.push(`${c.title}: feedback belum diisi.`)
    if (!normalized.reviewed[c.id]) problems.push(`${c.title}: konfirmasi bahwa bukti telah ditinjau diperlukan.`)
  }
  return problems
}
export function hydrateAssessments(base: EvidenceData): Stage3Data {
  const data: Stage3Data = { ...structuredClone(base), assessments: [] }
  for (const assignment of data.assignments) {
    const attempt = data.attempts.find(a => a.id === assignment.attemptId)!
    const evidence = data.evidenceVersions.find(e => e.attemptId === attempt.id && e.version === assignment.evidenceVersion)
    const period = data.periods.find(p => p.id === attempt.periodId)!
    if (!evidence) continue
    let rubric: RubricVersion
    try { rubric = getRubric(period.rubricVersionId) } catch { continue }
    if (assignment.assessmentStatus === 'not_started') continue
    const a = newAssessment(assignment, evidence, rubric)
    const draft = initialAssessmentDraft(rubric, evidence, data.clockNow)
    if (assignment.assessmentStatus === 'draft') { draft.revision = 1; a.draft = draft }
    else {
      for (const r of Object.values(draft.content.ratings)) r.score = 3
      for (const c of ASSESSMENT_COMPONENTS) { draft.content.feedback[c] = 'Contoh feedback simulasi dari metadata skenario lama; bukan penilaian pengguna.'; draft.content.reviewed[c] = true }
      const version = assignment.finalVersion ?? 1
      a.finals.push({ id: `${a.id}-final-${version}`, version, sourceDraftRevision: 0, actorId: a.examinerId, finalizedAt: data.clockNow, evidenceVersionId: evidence.id, rubricVersionId: rubric.id, content: draft.content, revisionReason: '', permissionId: null, fixture: true })
    }
    a.events.push({ id: `${a.id}-event-1`, action: 'Contoh assessment dari metadata lama', actorId: a.examinerId, at: data.clockNow, reason: 'Isi skor/feedback contoh dibuat untuk simulasi; bukan rekonstruksi penilaian lama.', fixture: true })
    data.assessments.push(a)
  }
  return data
}

export function validAssessmentState(data: Stage3Data): boolean {
  if (!Array.isArray(data.assessments) || new Set(data.assessments.map(a => a?.id)).size !== data.assessments.length || new Set(data.assessments.map(a => a?.assignmentId)).size !== data.assessments.length) return false
  const date = (x: unknown) => typeof x === 'string' && Number.isFinite(Date.parse(x))
  try {
    return data.assessments.every(a => {
      const assignment = data.assignments.find(x => x.id === a.assignmentId), evidence = data.evidenceVersions.find(v => v.id === a.evidenceVersionId)
      if (!assignment || !evidence || a.examinerId !== assignment.examinerId || evidence.attemptId !== assignment.attemptId || evidence.version !== assignment.evidenceVersion || !boundedText(a.id, true) || JSON.stringify(getRubric(a.rubricVersionId)) !== JSON.stringify(a.rubric)) return false
      if (!Array.isArray(a.finals) || !Array.isArray(a.permissions) || !Array.isArray(a.technicalIssues) || !Array.isArray(a.events)) return false
      if (new Set(a.finals.map(f => f.version)).size !== a.finals.length || new Set(a.finals.map(f => f.sourceDraftRevision)).size !== a.finals.length) return false
      const contentValid = (c: AssessmentContent) => JSON.stringify(normalizeAssessment(c, a.rubric, evidence)) === JSON.stringify(c)
      const permitValid = (reason: string, permission: string | null) => boundedText(reason) && (permission === null || a.permissions.some(p => p.id === permission && p.consumed))
      if (a.draft !== null && (!Number.isInteger(a.draft.revision) || a.draft.revision < 0 || !date(a.draft.updatedAt) || !contentValid(a.draft.content) || !permitValid(a.draft.revisionReason, a.draft.permissionId) || (a.draft.basedOnFinal !== null && !a.finals.some(f => f.version === a.draft!.basedOnFinal)))) return false
      if (!a.finals.every(f => boundedText(f.id, true) && Number.isInteger(f.version) && f.version > 0 && Number.isInteger(f.sourceDraftRevision) && f.sourceDraftRevision >= 0 && f.actorId === a.examinerId && date(f.finalizedAt) && f.evidenceVersionId === evidence.id && f.rubricVersionId === a.rubricVersionId && typeof f.fixture === 'boolean' && contentValid(f.content) && permitValid(f.revisionReason, f.permissionId))) return false
      if (!a.permissions.every(p => boundedText(p.id, true) && a.finals.some(f => f.version === p.finalVersion) && boundedText(p.reason, true) && data.users.some(u => u.id === p.actorId && u.role === 'pengelola') && date(p.at) && typeof p.consumed === 'boolean')) return false
      if (!a.technicalIssues.every(i => boundedText(i.id, true) && ASSESSMENT_COMPONENTS.includes(i.component) && boundedText(i.reason, true) && i.actorId === a.examinerId && date(i.reportedAt) && (i.resolvedAt === null || date(i.resolvedAt) && boundedText(i.resolution, true)))) return false
      return a.events.every(e => boundedText(e.id, true) && boundedText(e.action, true) && data.users.some(u => u.id === e.actorId) && date(e.at) && boundedText(e.reason) && typeof e.fixture === 'boolean')
    })
  } catch { return false }
}
