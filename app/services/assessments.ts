import { assessmentProblems, assessmentStatus, assessmentSummary, ASSESSMENT_COMPONENTS, getRubric, initialAssessmentDraft, newAssessment, normalizeAssessment } from '../domain/assessment.ts'
import { allEvidenceFiles } from '../domain/evidence.ts'
import { activeCase, moderationWindowOpen } from '../domain/operations.ts'
import type { Assessment, AssessmentContent, AssessmentView, AssignmentRow } from '../domain/assessment-types.ts'
import type { Assignment, ComponentId, EvidenceFile, UkinData, User } from '../domain/types.ts'

export function createAssessmentService(ctx: { data: () => UkinData; user: () => User; save: () => void; available: (f: EvidenceFile) => boolean; fileUrl: (f: EvidenceFile) => string | null }) {
  const data = ctx.data
  function context(id: string) {
    const assignment = data().assignments.find(x => x.id === id)
    if (!assignment) throw new Error('Penugasan tidak tersedia.')
    const attempt = data().attempts.find(x => x.id === assignment.attemptId)!
    const period = data().periods.find(x => x.id === attempt.periodId)!
    const evidence = data().evidenceVersions.find(x => x.attemptId === attempt.id && x.version === assignment.evidenceVersion)
    if (!evidence) throw new Error('Snapshot paket penugasan tidak tersedia.')
    const assessment = data().assessments.find(x => x.assignmentId === id) ?? null
    const rubric = assessment?.rubric ?? getRubric(period.rubricVersionId)
    return { assignment, attempt, period, evidence, assessment, rubric }
  }
  function own(id: string) {
    const u = ctx.user(), c = context(id)
    if (u.role !== 'penguji' || c.assignment.examinerId !== u.id || (!c.assignment.active && !c.assessment)) throw new Error('Penilaian pribadi hanya tersedia bagi penguji yang ditugaskan.')
    return c
  }
  function managed(id: string) {
    const u = ctx.user(), c = context(id)
    if (u.role !== 'pengelola' || !u.managedPeriodIds?.includes(c.period.id)) throw new Error('Penugasan di luar lingkup pengelola.')
    return c
  }
  function blockers(c: ReturnType<typeof context>) {
    const reasons: string[] = [], now = Date.parse(data().clockNow)
    if (!c.assignment.active || c.attempt.archived || c.period.archived || c.attempt.evidenceVersion !== c.evidence.version) reasons.push('Penugasan atau versi paket sudah diarsipkan. Riwayat hanya dapat dibaca.')
    if (!data().users.some(u => u.id === c.assignment.examinerId && u.active)) reasons.push('Akun penguji tidak aktif.')
    const review = data().reviews.filter(r => r.evidenceVersionId === c.evidence.id).at(-1)
    if (!['submitted', 'resubmitted'].includes(c.attempt.packageStatus) || c.attempt.completeness !== 'complete' || review?.outcome !== 'complete') reasons.push('Paket belum dinyatakan lengkap melalui pemeriksaan pengelola.')
    if (c.period.rubricVersionId !== c.rubric.id) reasons.push('Versi instrumen periode berubah. Hubungi pengelola; draf lama tetap tersimpan.')
    if ((now < Date.parse(c.period.assessmentOpensAt) || now > Date.parse(c.period.assessmentClosesAt)) && !(c.assessment?.finals.length && moderationWindowOpen(data(), c.period.id))) reasons.push('Periode penilaian tertutup menurut DemoClock.')
    if (c.attempt.moderation === 'open' && !activeCase(data(), c.assignment.id)) reasons.push('Kasus moderasi tidak mencakup penugasan ini.')
    if (c.attempt.publication.status === 'published') reasons.push('Hasil sudah dipublikasikan. Pengelola harus menarik publikasi dengan alasan sebelum revisi.')
    return reasons
  }
  function writable(c: ReturnType<typeof context>) {
    const problems = blockers(c)
    if (problems.length) throw new Error(problems.join(' '))
    if (c.assessment?.finals.length && !c.assessment.draft) throw new Error('Penilaian sudah final. Revisi memerlukan izin pengelola dan alasan.')
  }
  function record(c: ReturnType<typeof context>) {
    if (c.assessment) return c.assessment
    const a = newAssessment(c.assignment, c.evidence, c.rubric)
    data().assessments.push(a)
    c.assessment = a
    return a
  }
  function event(a: Assessment, action: string, reason = '') {
    a.events.push({ id: `${a.id}-event-${a.events.length + 1}`, action, reason, actorId: ctx.user().id, at: data().clockNow, fixture: false })
  }
  function reasonText(reason: string) {
    if (typeof reason !== 'string' || !reason.trim() || reason.length > 5000) throw new Error('Alasan wajib diisi, maksimal 5.000 karakter.')
    return reason.trim()
  }
  function row(assignment: Assignment): AssignmentRow {
    const attempt = data().attempts.find(a => a.id === assignment.attemptId)!, period = data().periods.find(p => p.id === attempt.periodId)!
    const assessment = data().assessments.find(a => a.assignmentId === assignment.id), issues = assessment?.technicalIssues.filter(i => !i.resolvedAt) ?? []
    let reasons: string[]
    try { reasons = blockers(context(assignment.id)) } catch (e) { reasons = [e instanceof Error ? e.message : 'Versi paket atau rubrik tidak tersedia.'] }
    return { id: assignment.id, participant: data().users.find(u => u.id === attempt.participantId)!.displayName, subject: attempt.subject,
      periodId: period.id, periodName: period.name, attemptNumber: attempt.attemptNumber, evidenceVersion: assignment.evidenceVersion, rubricVersionId: assessment?.rubricVersionId ?? period.rubricVersionId,
      completeness: attempt.completeness, status: assessmentStatus(data(), assignment), revisionDraft: !!assessment?.draft?.basedOnFinal,
      blocked: !!(reasons.length || issues.length), blocker: [...reasons, ...(issues.length ? ['Kendala teknis belum terselesaikan.'] : [])].join(' '),
      openIssues: issues.length, finalizedAt: assessment?.finals.at(-1)?.finalizedAt ?? null, fixture: assessment?.finals.at(-1)?.fixture ?? false }
  }
  function getAssessment(id: string): AssessmentView {
    const c = own(id), reasons = blockers(c), a = c.assessment, latest = a?.finals.at(-1)
    const draft = a?.draft ?? (latest ? { ...initialAssessmentDraft(c.rubric, c.evidence, data().clockNow), revision: latest.sourceDraftRevision, content: latest.content } : initialAssessmentDraft(c.rubric, c.evidence, data().clockNow))
    return structuredClone({ ...c, participant: data().users.find(u => u.id === c.attempt.participantId)!, examiner: ctx.user(), draft,
      editable: !reasons.length && (!latest || !!a?.draft), blockers: reasons,
      canBeginRevision: !reasons.length && !!latest && !a?.draft && (!!activeCase(data(), id) || !!a?.permissions.some(p => p.finalVersion === latest.version && !p.consumed)),
      partnerName: data().users.find(u => data().assignments.some(x => x.active && x.attemptId === c.attempt.id && x.evidenceVersion === c.evidence.version && x.examinerId !== c.assignment.examinerId && x.examinerId === u.id))?.displayName ?? 'Belum ditugaskan' })
  }
  function finalProblems(c: ReturnType<typeof context>, content: AssessmentContent) {
    return [...blockers(c), ...(c.assessment?.technicalIssues.some(i => !i.resolvedAt) ? ['Selesaikan kendala teknis dengan alasan sebelum finalisasi.'] : []),
      ...assessmentProblems(content, c.rubric, c.evidence, c.period, ctx.available)]
  }
  return {
    getAssessment,
    listAssignments() { const u = ctx.user(); if (u.role !== 'penguji') throw new Error('Ruang penugasan hanya untuk penguji.'); return data().assignments.filter(a => a.active && a.examinerId === u.id).map(row) },
    getAssessmentHistory() {
      const u = ctx.user(); if (u.role !== 'penguji') throw new Error('Riwayat pribadi hanya untuk penguji.')
      return structuredClone(data().assessments.filter(a => a.examinerId === u.id && a.finals.length).map(a => ({ ...row(context(a.assignmentId).assignment), assessment: a })))
    },
    saveAssessmentDraft(id: string, input: AssessmentContent, expectedRevision: number) {
      const c = own(id); writable(c)
      const current = c.assessment?.draft ?? initialAssessmentDraft(c.rubric, c.evidence, data().clockNow)
      if (current.revision !== expectedRevision) throw new Error('Draf penilaian berubah. Muat ulang sebelum menyimpan.')
      const content = normalizeAssessment(input, c.rubric, c.evidence), a = record(c)
      a.draft = { ...current, revision: current.revision + 1, content, updatedAt: data().clockNow }
      c.assignment.assessmentStatus = 'draft'
      event(a, 'Draf penilaian disimpan'); ctx.save()
      return structuredClone(a.draft)
    },
    previewAssessmentFinal(id: string, expectedRevision: number) {
      const c = own(id), draft = c.assessment?.draft
      if (!draft || draft.revision !== expectedRevision) throw new Error('Simpan draf terbaru sebelum meninjau finalisasi.')
      return { problems: finalProblems(c, draft.content), summary: assessmentSummary(draft.content, c.rubric) }
    },
    finalizeAssessment(id: string, expectedRevision: number, confirmed: boolean) {
      const c = own(id)
      if (!confirmed) throw new Error('Konfirmasi penguji diperlukan sebelum finalisasi.')
      const existing = c.assessment?.finals.find(f => f.sourceDraftRevision === expectedRevision)
      if (existing) return structuredClone(existing)
      writable(c)
      const a = c.assessment, draft = a?.draft
      if (!a || !draft || draft.revision !== expectedRevision) throw new Error('Draf terbaru harus disimpan dan ditinjau sebelum finalisasi.')
      const problems = finalProblems(c, draft.content)
      if (problems.length) throw new Error(problems.join(' '))
      // Default quota is null. One initial final per examiner/attempt/evidence/day WIB.
      const day = (iso: string) => new Date(Date.parse(iso) + 7 * 3600000).toISOString().slice(0, 10)
      if (c.period.quota !== null && !a.finals.length) {
        const used = data().assessments.filter(x => x.examinerId === a.examinerId && data().assignments.some(t => t.id === x.assignmentId && data().attempts.some(p => p.id === t.attemptId && p.periodId === c.period.id)) && x.finals.some(f => !f.fixture && f.version === 1 && day(f.finalizedAt) === day(data().clockNow))).length
        if (used >= c.period.quota) throw new Error('Kuota finalisasi hari ini telah tercapai menurut DemoClock WIB.')
      }
      const version = Math.max(0, ...a.finals.map(f => f.version)) + 1
      const final = { id: `${a.id}-final-${version}`, version, sourceDraftRevision: draft.revision, actorId: ctx.user().id, finalizedAt: data().clockNow,
        evidenceVersionId: c.evidence.id, rubricVersionId: c.rubric.id, content: structuredClone(draft.content), revisionReason: draft.revisionReason, permissionId: draft.permissionId, fixture: false }
      a.finals.push(final); a.draft = null
      c.assignment.assessmentStatus = 'final'; c.assignment.finalVersion = version
      event(a, version === 1 ? 'Penilaian difinalisasi' : 'Revisi penilaian difinalisasi', final.revisionReason); ctx.save()
      return structuredClone(final)
    },
    reportAssessmentIssue(id: string, component: ComponentId, reason: string) {
      const c = own(id); writable(c)
      if (!ASSESSMENT_COMPONENTS.includes(component)) throw new Error('Komponen tidak valid.')
      const text = reasonText(reason), a = record(c)
      a.technicalIssues.push({ id: `${a.id}-issue-${a.technicalIssues.length + 1}`, component, reason: text, actorId: ctx.user().id, reportedAt: data().clockNow, resolvedAt: null, resolution: '' })
      event(a, 'Kendala teknis dilaporkan', text); ctx.save()
    },
    resolveAssessmentIssue(id: string, issueId: string, reason: string) {
      const c = own(id); writable(c)
      const text = reasonText(reason), issue = c.assessment?.technicalIssues.find(i => i.id === issueId)
      if (!issue) throw new Error('Kendala tidak tersedia.')
      if (issue.resolvedAt) return
      issue.resolvedAt = data().clockNow; issue.resolution = text
      event(c.assessment!, 'Kendala teknis diselesaikan', text); ctx.save()
    },
    getAssessmentFileUrl(id: string, fileId: string) {
      const c = own(id), file = allEvidenceFiles(c.evidence.content).find(f => f.id === fileId)
      if (!file) throw new Error('File di luar versi paket penilaian ini.')
      return ctx.available(file) ? ctx.fileUrl(file) : null
    },
    listAssessmentProgress() {
      const u = ctx.user(); if (u.role !== 'pengelola') throw new Error('Ringkasan hanya untuk pengelola.')
      return structuredClone(data().assignments.filter(a => a.active && data().attempts.some(t => t.id === a.attemptId && u.managedPeriodIds?.includes(t.periodId))).map(a => {
        const r = row(a), assessment = data().assessments.find(x => x.assignmentId === a.id), latest = assessment?.finals.at(-1)
        const evidence = data().evidenceVersions.find(v => v.attemptId === a.attemptId && v.version === a.evidenceVersion)
        return { ...r, examiner: data().users.find(u => u.id === a.examinerId)!.displayName, kind: a.kind, evidenceVersionId: evidence?.id ?? null,
          finalVersion: latest?.version ?? null, issues: assessment?.technicalIssues ?? [],
          permissionPending: !!latest && !!assessment?.permissions.some(p => p.finalVersion === latest.version && !p.consumed),
          canAuthorizeRevision: !!latest && !assessment?.draft && !r.blocked }
      }))
    },
    grantAssessmentRevision(id: string, expectedFinal: number, reason: string) {
      const c = managed(id), text = reasonText(reason), a = c.assessment, latest = a?.finals.at(-1)
      if (!a || !latest || latest.version !== expectedFinal || a.draft) throw new Error('Versi final berubah atau revisi sedang dikerjakan.')
      const reasons = blockers(c); if (reasons.length) throw new Error(reasons.join(' '))
      const existing = a.permissions.find(p => p.finalVersion === expectedFinal && !p.consumed)
      if (existing) return structuredClone(existing)
      const permission = { id: `${a.id}-permission-${a.permissions.length + 1}`, finalVersion: expectedFinal, reason: text, actorId: ctx.user().id, at: data().clockNow, consumed: false }
      a.permissions.push(permission); event(a, 'Revisi final diizinkan pengelola', text); ctx.save()
      return structuredClone(permission)
    },
    beginAssessmentRevision(id: string, expectedFinal: number, reason: string) {
      const c = own(id), text = reasonText(reason), a = c.assessment, latest = a?.finals.at(-1)
      if (!a || !latest || latest.version !== expectedFinal) throw new Error('Versi final berubah. Muat ulang riwayat.')
      if (a.draft?.basedOnFinal === expectedFinal) return structuredClone(a.draft)
      const reasons = blockers(c); if (reasons.length) throw new Error(reasons.join(' '))
      const moderation = activeCase(data(), id)
      let permission = a.permissions.find(p => p.finalVersion === expectedFinal && !p.consumed && (!moderation || p.moderationCaseId === moderation.id))
      if (!permission && moderation) {
        permission = { id: `${a.id}-permission-${a.permissions.length + 1}`, finalVersion: expectedFinal, reason: moderation.reason, actorId: moderation.openedBy, at: data().clockNow, consumed: false, moderationCaseId: moderation.id }
        a.permissions.push(permission)
      }
      if (!permission) throw new Error('Revisi final membutuhkan izin pengelola untuk versi ini.')
      a.draft = { revision: latest.sourceDraftRevision + 1, updatedAt: data().clockNow, content: structuredClone(latest.content), basedOnFinal: latest.version, revisionReason: text, permissionId: permission.id }
      a.draft.content.reviewed = { perangkat: false, video: false, studi_kasus: false }
      permission.consumed = true; c.assignment.assessmentStatus = 'draft'
      event(a, 'Draf revisi final dibuka', text); ctx.save()
      return structuredClone(a.draft)
    },
  }
}
