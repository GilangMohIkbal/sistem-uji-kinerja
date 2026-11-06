import { assessmentSummary, getRubric, assessmentStatus } from '../domain/assessment.ts'
import { emptyEvidenceContent } from '../domain/evidence.ts'
import { activeCase, archiveWorkflow, clone, csvText, moderationWindowOpen, periodIdsFor, required } from '../domain/operations.ts'
import type { Announcement, Period, UkinData, User } from '../domain/types.ts'
import type { PublicFeedback, Publication, ModerationCase } from '../domain/operations-types.ts'

export function createOperationsService(ctx: { data: () => UkinData; user: () => User; save: () => void }) {
  const data = ctx.data
  const uid = (prefix: string) => `${prefix}-${crypto.randomUUID()}`
  function manager(periodId?: string) {
    const u = ctx.user()
    if (u.role !== 'pengelola' || periodId && !u.managedPeriodIds?.includes(periodId)) throw new Error('Aksi hanya tersedia bagi pengelola periode ini.')
    return u
  }
  function audit(action: string, entityId: string, periodId: string | null, reason: string) {
    data().adminEvents.push({ id: uid('event'), actorId: ctx.user().id, at: data().clockNow, action, entityId, periodId, reason })
  }
  function attemptContext(id: string) {
    const attempt = data().attempts.find(a => a.id === id)
    if (!attempt) throw new Error('Peserta periode tidak ditemukan.')
    const period = data().periods.find(p => p.id === attempt.periodId)!
    const evidence = data().evidenceVersions.find(v => v.attemptId === id && v.version === attempt.evidenceVersion)
    const assignments = data().assignments.filter(a => a.active && a.attemptId === id && a.evidenceVersion === attempt.evidenceVersion).sort((a, b) => a.kind.localeCompare(b.kind))
    const pair = assignments.map(a => ({ assignment: a, assessment: data().assessments.find(x => x.assignmentId === a.id), user: data().users.find(u => u.id === a.examinerId)! }))
    return { attempt, period, evidence, assignments, pair }
  }
  function pairToken(id: string) {
    const c = attemptContext(id)
    return JSON.stringify([c.attempt.evidenceVersion, c.attempt.completeness, c.attempt.packageStatus, c.period.revision ?? 0, c.period.archived ?? false,
      c.pair.map(p => [p.assignment.id, p.user.active, p.assessment?.finals.at(-1)?.id, p.assessment?.draft?.revision]),
      data().moderations.filter(m => m.attemptId === id).map(m => [m.id, m.status]),
      data().interviews.filter(i => i.attemptId === id).map(i => [i.id, i.revision]),
      data().publications.filter(p => p.attemptId === id).map(p => [p.id, p.status])])
  }
  function pairProblems(id: string, finals = true) {
    const c = attemptContext(id), problems: string[] = []
    if (c.attempt.archived || c.period.archived) problems.push('Peserta atau periode sudah diarsipkan.')
    if (!data().users.find(u => u.id === c.attempt.participantId)?.active) problems.push('Akun peserta tidak aktif.')
    if (!c.evidence || c.attempt.completeness !== 'complete' || !['submitted', 'resubmitted'].includes(c.attempt.packageStatus) || data().reviews.filter(r => r.evidenceVersionId === c.evidence?.id).at(-1)?.outcome !== 'complete') problems.push('Paket versi terkini belum lolos pemeriksaan kelengkapan.')
    if (c.pair.length !== 2 || new Set(c.pair.map(p => p.assignment.kind)).size !== 2 || new Set(c.pair.map(p => p.user.id)).size !== 2 || c.pair.some(p => !p.user.active || p.user.id === c.attempt.participantId)) problems.push('Pasangan dosen dan guru aktif harus lengkap dan berbeda.')
    if (finals && c.pair.some(p => !p.assessment?.finals.length || p.assessment.draft || p.assessment.evidenceVersionId !== c.evidence?.id || p.assessment.rubricVersionId !== c.period.rubricVersionId || p.assessment.technicalIssues.some(i => !i.resolvedAt))) problems.push('Dua penilaian final harus sesuai paket dan instrumen terkini, tanpa draf revisi atau kendala terbuka.')
    return problems
  }
  function requirePair(id: string, finals = true) { const problems = pairProblems(id, finals); if (problems.length) throw new Error(problems.join(' ')); return attemptContext(id) }
  function workflowTime(period: Period) {
    const now = Date.parse(data().clockNow)
    if (!(now >= Date.parse(period.assessmentOpensAt) && now <= Date.parse(period.assessmentClosesAt)) && !moderationWindowOpen(data(), period.id)) throw new Error('Buka jendela moderasi beralasan karena periode penilaian tertutup.')
  }
  function moderation(id: string) {
    const m = data().moderations.find(m => m.id === id)
    if (!m) throw new Error('Kasus moderasi tidak tersedia.')
    const c = attemptContext(m.attemptId), u = ctx.user()
    if (u.role === 'pengelola') manager(c.period.id)
    else if (u.role !== 'penguji' || !m.assignmentIds.some(id => data().assignments.some(a => a.id === id && a.examinerId === u.id))) throw new Error('Kasus di luar penugasan Anda.')
    return { m, c, u }
  }
  function currentModeration(id: string, allowDraft = false) {
    const { m, c, u } = moderation(id)
    if (!['open', 'awaiting_responses'].includes(m.status) || m.evidenceVersionId !== c.evidence?.id || JSON.stringify(m.assignmentIds) !== JSON.stringify(c.assignments.map(a => a.id))) throw new Error('Kasus atau penugasan sudah tidak aktif.')
    requirePair(m.attemptId, !allowDraft); workflowTime(c.period)
    if (c.attempt.publication.status === 'published') throw new Error('Tarik publikasi dengan alasan sebelum melanjutkan moderasi.')
    return { m, c, u }
  }
  function publicationProblems(id: string) {
    const c = attemptContext(id), problems = pairProblems(id)
    if (c.attempt.moderation === 'open' || data().moderations.some(m => m.attemptId === id && ['open', 'awaiting_responses'].includes(m.status))) problems.push('Moderasi masih terbuka.')
    if (c.period.interviewRequiredForRelease && !data().interviews.some(i => i.attemptId === id && i.evidenceVersionId === c.evidence?.id && i.status === 'completed' && JSON.stringify(i.assignmentIds) === JSON.stringify(c.assignments.map(a => a.id)))) problems.push('Wawancara wajib untuk publikasi belum selesai.')
    return problems
  }
  function publicInput(input: PublicFeedback): PublicFeedback {
    if (typeof input?.showComponentScores !== 'boolean') throw new Error('Pilihan keterbukaan skor diperlukan.')
    return { strengths: required(input.strengths, 'Kekuatan'), improvements: required(input.improvements, 'Saran pengembangan'), showComponentScores: input.showComponentScores,
      feedback: { perangkat: required(input.feedback?.perangkat, 'Feedback perangkat'), video: required(input.feedback?.video, 'Feedback video'), studi_kasus: required(input.feedback?.studi_kasus, 'Feedback studi kasus') } }
  }
  function previewPublication(id: string, input: PublicFeedback) {
    const c = attemptContext(id); manager(c.period.id)
    const content = publicInput(input), problems = publicationProblems(id)
    const scores = content.showComponentScores && !problems.length ? c.pair.map(p => ({ kind: p.assignment.kind, components: assessmentSummary(p.assessment!.finals.at(-1)!.content, p.assessment!.rubric).map(s => ({ id: s.id, total: s.score!, maximum: s.maximum })) })) : []
    return clone({ ...content, scores, problems, token: pairToken(id), participant: data().users.find(u => u.id === c.attempt.participantId)!.displayName, evidenceVersion: c.evidence?.version, rubricVersionId: c.period.rubricVersionId })
  }
  function normalizedPeriod(input: Period): Period {
    const p = clone(input)
    p.name = required(p.name, 'Nama periode', 160); p.track = required(p.track ?? 'PPG', 'Jenis PPG', 100)
    p.subjects = [...new Set((p.subjects ?? []).map(s => required(s, 'Bidang studi', 100)))]
    if (!p.subjects.length || !Number.isInteger(p.year) || p.year < 2000 || p.year > 2100) throw new Error('Tahun atau bidang studi periode tidak valid.')
    for (const key of ['collectionOpensAt', 'collectionClosesAt', 'assessmentOpensAt', 'assessmentClosesAt'] as const) {
      if (!Number.isFinite(Date.parse(p[key]))) throw new Error('Tanggal periode tidak valid.')
      p[key] = new Date(p[key]).toISOString()
    }
    if (p.collectionOpensAt >= p.collectionClosesAt || p.assessmentOpensAt >= p.assessmentClosesAt) throw new Error('Waktu buka harus sebelum waktu tutup.')
    getRubric(p.rubricVersionId)
    if (!['participant_report', 'exam_snapshot'].includes(p.caseStudySource) || !p.requirements || typeof p.requirements.fullVideo !== 'boolean' || typeof p.requirements.summaryVideo !== 'boolean' || !p.requirements.fullVideo && !p.requirements.summaryVideo || typeof p.interviewEnabled !== 'boolean' || typeof p.interviewRequiredForRelease !== 'boolean' || p.interviewRequiredForRelease && !p.interviewEnabled || p.quota !== null && (!Number.isInteger(p.quota) || p.quota < 1)) throw new Error('Konfigurasi bukti, wawancara atau kuota tidak valid.')
    return p
  }
  const api = {
    getManagement() {
      const u = manager(), periods = data().periods.filter(p => u.managedPeriodIds?.includes(p.id))
      return clone({ periods, users: data().users, attempts: data().attempts.filter(a => u.managedPeriodIds?.includes(a.periodId)), announcements: data().announcements.filter(a => !a.periodIds || a.periodIds.every(id => u.managedPeriodIds?.includes(id))), events: data().adminEvents.filter(e => !e.periodId || u.managedPeriodIds?.includes(e.periodId)).slice().reverse() })
    },
    savePeriod(input: Period, expectedRevision: number | null, reason: string) {
      const u = manager(), text = required(reason), p = normalizedPeriod(input), old = data().periods.find(x => x.id === p.id)
      if (old) {
        manager(old.id)
        if ((old.revision ?? 0) !== expectedRevision) throw new Error('Periode berubah. Muat ulang.')
        const attempts = data().attempts.filter(a => a.periodId === old.id)
        const started = data().assessments.some(a => data().assignments.some(x => x.id === a.assignmentId && attempts.some(t => t.id === x.attemptId)))
        const submitted = data().evidenceVersions.some(e => attempts.some(a => a.id === e.attemptId)) || data().drafts.some(d => d.revision > 0 && attempts.some(a => a.id === d.attemptId))
        const keys: (keyof Period)[] = started ? ['year', 'track', 'collectionOpensAt', 'collectionClosesAt', 'assessmentOpensAt', 'assessmentClosesAt', 'rubricVersionId', 'caseStudySource', 'requirements', 'interviewEnabled', 'interviewRequiredForRelease', 'quota'] : submitted ? ['rubricVersionId', 'caseStudySource', 'requirements'] : []
        if (keys.some(k => JSON.stringify(old[k] ?? (k === 'track' ? 'PPG' : undefined)) !== JSON.stringify(p[k]))) throw new Error('Konfigurasi telah digunakan. Duplikasi periode untuk aturan baru.')
        if (attempts.some(a => !p.subjects!.includes(a.subject))) throw new Error('Bidang studi yang sudah digunakan tidak boleh dihapus.')
        Object.assign(old, p, { id: old.id, archived: old.archived ?? false, moderationWindow: old.moderationWindow, revision: (old.revision ?? 0) + 1 })
      } else {
        if (expectedRevision !== null) throw new Error('Periode tidak tersedia.')
        p.id = uid('period'); p.revision = 1; p.archived = false; delete p.moderationWindow
        data().periods.push(p); (u.managedPeriodIds ??= []).push(p.id)
      }
      audit(old ? 'Periode diperbarui' : 'Periode dibuat', p.id, p.id, text); ctx.save(); return clone(old ?? p)
    },
    archivePeriod(id: string, reason: string) { manager(id); const text = required(reason), p = data().periods.find(p => p.id === id)!; p.archived = true; p.revision = (p.revision ?? 0) + 1; audit('Periode diarsipkan', id, id, text); ctx.save() },
    deletePeriod(id: string, reason: string) {
      const u = manager(id), text = required(reason)
      if (data().attempts.some(a => a.periodId === id) || data().announcements.some(a => a.periodIds?.includes(id))) throw new Error('Periode telah direferensikan. Gunakan arsip.')
      if (data().periods.length < 2) throw new Error('Pertahankan minimal satu periode.')
      data().periods = data().periods.filter(p => p.id !== id); for (const user of data().users) if (user.managedPeriodIds) user.managedPeriodIds = user.managedPeriodIds.filter(p => p !== id)
      audit('Periode kosong dihapus', id, null, text); ctx.save(); return u.id
    },
    setModerationWindow(id: string, opensAt: string, closesAt: string, reason: string) {
      const u = manager(id), p = data().periods.find(p => p.id === id)!, text = required(reason)
      if (p.archived || !Number.isFinite(Date.parse(opensAt)) || !Number.isFinite(Date.parse(closesAt)) || Date.parse(opensAt) >= Date.parse(closesAt)) throw new Error('Jendela moderasi tidak valid.')
      p.moderationWindow = { opensAt: new Date(opensAt).toISOString(), closesAt: new Date(closesAt).toISOString(), reason: text, actorId: u.id, at: data().clockNow }
      p.revision = (p.revision ?? 0) + 1; audit('Jendela moderasi ditetapkan', id, id, text); ctx.save()
    },
    saveManagedUser(input: Pick<User, 'id' | 'email' | 'displayName' | 'role' | 'examinerKind' | 'active'>, reason: string) {
      manager(); const text = required(reason), old = data().users.find(u => u.id === input.id)
      const name = required(input.displayName, 'Nama', 120), email = required(input.email, 'Email fiktif', 160).toLowerCase()
      if (!/^[^\s@]+@[^\s@]+\.invalid$/.test(email) || data().users.some(u => u.email === email && u.id !== old?.id)) throw new Error('Gunakan email fiktif unik berakhiran .invalid.')
      if (!['peserta', 'penguji', 'pengelola'].includes(input.role) || input.role === 'penguji' && !['dosen', 'guru'].includes(input.examinerKind ?? '') || typeof input.active !== 'boolean') throw new Error('Peran atau status tidak valid.')
      if (old && (old.interactive || data().attempts.some(a => a.participantId === old.id) || data().assignments.some(a => a.examinerId === old.id)) && (old.role !== input.role || old.examinerKind !== input.examinerKind || old.interactive && old.email !== email)) throw new Error('Identitas login/peran yang telah dipakai tidak boleh diubah.')
      if (old?.role === 'pengelola' && old.interactive && !input.active) throw new Error('Pengelola demo utama harus tetap aktif.')
      const user: User = { id: old?.id ?? uid('user'), displayName: name, email, role: input.role, ...(input.role === 'penguji' ? { examinerKind: input.examinerKind } : {}), active: input.active, interactive: old?.interactive ?? false, ...(input.role === 'pengelola' ? { managedPeriodIds: old?.managedPeriodIds ?? [] } : {}) }
      if (old) Object.assign(old, user); else data().users.push(user)
      audit('Akun fiktif disimpan', user.id, null, text); ctx.save(); return clone(user)
    },
    deleteManagedUser(id: string, reason: string) {
      manager(); const text = required(reason), u = data().users.find(u => u.id === id)
      if (!u || u.interactive || data().attempts.some(a => a.participantId === id) || data().assignments.some(a => a.examinerId === id) || data().adminEvents.some(e => e.actorId === id)) throw new Error('Akun digunakan dalam riwayat. Nonaktifkan jika diperlukan.')
      data().users = data().users.filter(u => u.id !== id); audit('Akun fiktif kosong dihapus', id, null, text); ctx.save()
    },
    enrollParticipant(periodId: string, participantId: string, subject: string, reason: string) {
      manager(periodId); const p = data().periods.find(p => p.id === periodId)!, text = required(reason)
      if (p.archived || !p.subjects?.includes(subject) || !data().users.some(u => u.id === participantId && u.role === 'peserta' && u.active)) throw new Error('Periode, peserta atau bidang studi tidak tersedia.')
      if (data().attempts.some(a => a.periodId === periodId && a.participantId === participantId && !a.archived)) throw new Error('Peserta sudah tercatat aktif pada periode ini.')
      const id = uid('attempt')
      data().attempts.push({ id, participantId, periodId, subject, attemptNumber: 1, previousAttemptId: null, archived: false, packageStatus: 'draft', completeness: 'pending', components: { perangkat: false, video: false, studi_kasus: false }, evidenceVersion: null, publication: { status: 'unpublished', version: null, feedback: null }, moderation: 'none' })
      data().drafts.push({ attemptId: id, revision: 0, updatedAt: data().clockNow, content: emptyEvidenceContent(p.caseStudySource) }); audit('Peserta ditambahkan ke periode', id, periodId, text); ctx.save(); return id
    },
    previewAssignment(id: string) { const c = attemptContext(id); manager(c.period.id); return clone({ ...c, token: pairToken(id), pair: undefined, assignments: c.assignments.map(a => ({ ...a, started: data().assessments.some(x => x.assignmentId === a.id) })) }) },
    assignPair(id: string, dosenId: string, guruId: string, token: string, reason: string, confirmed: boolean) {
      const c = attemptContext(id), u = manager(c.period.id), text = required(reason)
      if (!confirmed || token !== pairToken(id)) throw new Error('Tinjau penugasan terbaru dan konfirmasi penggantian.')
      if (c.period.archived || c.attempt.archived || !c.evidence || c.attempt.completeness !== 'complete' || data().reviews.filter(r => r.evidenceVersionId === c.evidence?.id).at(-1)?.outcome !== 'complete') throw new Error('Penugasan membutuhkan paket terkini yang lengkap.')
      const users = [dosenId, guruId].map((id, index) => data().users.find(u => u.id === id && u.active && u.role === 'penguji' && u.examinerKind === (index ? 'guru' : 'dosen')))
      if (dosenId === guruId || users.some(u => !u || u.id === c.attempt.participantId)) throw new Error('Pilih dosen dan guru aktif yang berbeda dari peserta.')
      if (c.assignments.length === 2 && c.assignments.some(a => a.examinerId === dosenId) && c.assignments.some(a => a.examinerId === guruId)) return
      archiveWorkflow(data(), id, u.id, `Penugasan berubah: ${text}`)
      for (const [index, examinerId] of [dosenId, guruId].entries()) {
        const kind = index ? 'guru' as const : 'dosen' as const
        if (c.assignments.some(a => a.kind === kind && a.examinerId === examinerId)) continue
        data().assignments.filter(a => a.active && a.attemptId === id && a.kind === kind).forEach(a => { a.active = false })
        data().assignments.push({ id: uid('assignment'), attemptId: id, examinerId, kind, active: true, evidenceVersion: c.evidence.version, assessmentStatus: 'not_started', finalVersion: null })
      }
      audit('Pasangan penguji ditetapkan', id, c.period.id, text); ctx.save()
    },
    getMonitoring() {
      const u = manager()
      return clone(data().attempts.filter(a => !a.archived && u.managedPeriodIds?.includes(a.periodId)).map(a => {
        const c = attemptContext(a.id), ready = !pairProblems(a.id).length
        return { id: a.id, participant: data().users.find(u => u.id === a.participantId)!.displayName, subject: a.subject, periodId: a.periodId, periodName: c.period.name, packageStatus: a.packageStatus, completeness: a.completeness,
          evidenceVersion: a.evidenceVersion, evidenceVersionId: c.evidence?.id, moderation: a.moderation, publication: a.publication.status, token: pairToken(a.id), problems: publicationProblems(a.id),
          examiners: c.pair.map(p => ({ id: p.assignment.id, name: p.user.displayName, kind: p.assignment.kind, active: p.user.active, status: assessmentStatus(data(), p.assignment), revisionDraft: !!p.assessment?.draft?.basedOnFinal, issues: p.assessment?.technicalIssues.filter(i => !i.resolvedAt).length ?? 0, finalVersion: p.assessment?.finals.at(-1)?.version ?? null,
            scores: ready ? assessmentSummary(p.assessment!.finals.at(-1)!.content, p.assessment!.rubric) : [] })),
          interview: c.period.interviewEnabled ? data().interviews.filter(i => i.attemptId === a.id).at(-1)?.status ?? 'Belum dijadwalkan' : 'Tidak diaktifkan',
          indicators: ready ? c.pair[0]!.assessment!.rubric.components.flatMap(c => c.indicators.map(i => ({ id: i.id, title: i.title, component: c.title }))) : [] }
      }))
    },
    exportMonitoring(periodId = '') {
      const rows = api.getMonitoring().filter(r => !periodId || r.periodId === periodId)
      return csvText([['DATA FIKTIF UKIN - BUKAN HASIL RESMI'], ['Peserta', 'Periode', 'Bidang studi', 'Versi paket', 'Kelengkapan', 'Penguji dosen', 'Status dosen', 'Penguji guru', 'Status guru', 'Moderasi', 'Publikasi', 'Wawancara'], ...rows.map(r => [r.participant, r.periodName, r.subject, r.evidenceVersion, r.completeness, r.examiners.find(e => e.kind === 'dosen')?.name ?? '', r.examiners.find(e => e.kind === 'dosen')?.status ?? '', r.examiners.find(e => e.kind === 'guru')?.name ?? '', r.examiners.find(e => e.kind === 'guru')?.status ?? '', r.moderation, r.publication, r.interview])])
    },
    openModeration(id: string, indicatorIds: string[], reason: string, token: string, confirmed: boolean) {
      const c = attemptContext(id), u = manager(c.period.id), text = required(reason)
      if (!confirmed || token !== pairToken(id)) throw new Error('Tinjau dua final terbaru dan konfirmasi pembukaan kasus.')
      requirePair(id); workflowTime(c.period)
      if (c.attempt.publication.status === 'published') throw new Error('Tarik publikasi dengan alasan sebelum membuka moderasi.')
      if (data().moderations.some(m => m.attemptId === id && ['open', 'awaiting_responses'].includes(m.status))) throw new Error('Masih ada kasus moderasi terbuka.')
      const allowed = c.pair[0]!.assessment!.rubric.components.flatMap(c => c.indicators.map(i => i.id)), selected = [...new Set(indicatorIds)]
      if (!selected.length || selected.some(i => !allowed.includes(i))) throw new Error('Pilih indikator yang perlu dimoderasi.')
      const m: ModerationCase = { id: uid('moderation'), attemptId: id, evidenceVersionId: c.evidence!.id, rubricVersionId: c.period.rubricVersionId, assignmentIds: c.assignments.map(a => a.id), openedFinalIds: c.pair.map(p => p.assessment!.finals.at(-1)!.id), indicatorIds: selected, reason: text, status: 'open', openedBy: u.id, openedAt: data().clockNow, responses: [], resolution: '', closedAt: null, closedBy: null, fixture: false }
      data().moderations.push(m); c.attempt.moderation = 'open'; audit('Moderasi dibuka', m.id, c.period.id, text); ctx.save(); return clone(m)
    },
    listModerations() {
      const u = ctx.user()
      if (u.role === 'peserta') throw new Error('Moderasi adalah ruang internal penguji dan pengelola.')
      return clone(data().moderations.filter(m => u.role === 'pengelola' ? u.managedPeriodIds?.includes(attemptContext(m.attemptId).period.id) : m.assignmentIds.some(id => data().assignments.some(a => a.id === id && a.examinerId === u.id))).map(m => ({ id: m.id, attemptId: m.attemptId, status: m.status, reason: m.reason, openedAt: m.openedAt, fixture: m.fixture, participant: data().users.find(u => u.id === attemptContext(m.attemptId).attempt.participantId)!.displayName })))
    },
    getModeration(id: string) {
      const { m, c, u } = moderation(id)
      const comparisons = m.assignmentIds.map(assignmentId => {
        const a = data().assessments.find(a => a.assignmentId === assignmentId)!, assignment = data().assignments.find(a => a.id === assignmentId)!, latest = a.finals.at(-1)!
        const final = m.status === 'resolved' ? a.finals.find(f => m.responses.some(r => r.finalId === f.id)) ?? latest : m.status === 'archived' ? a.finals.find(f => m.openedFinalIds.includes(f.id)) ?? latest : latest
        return { assignmentId, examinerId: a.examinerId, name: data().users.find(u => u.id === a.examinerId)!.displayName, kind: assignment.kind, finalId: final.id, finalVersion: final.version, hasDraft: !!a.draft, own: a.examinerId === u.id,
          indicators: a.rubric.components.flatMap(c => c.indicators.filter(i => m.indicatorIds.includes(i.id)).map(i => ({ id: i.id, title: i.title, component: c.title, score: final.content.ratings[i.id]!.score, note: final.content.ratings[i.id]!.note, evidenceId: final.content.ratings[i.id]!.evidenceId }))) }
      })
      return clone({ ...m, participant: data().users.find(u => u.id === c.attempt.participantId)!.displayName, comparisons })
    },
    respondModeration(id: string, decision: 'retain' | 'revise', finalId: string, reason: string) {
      const { m, c, u } = currentModeration(id, true), text = required(reason)
      if (u.role !== 'penguji' || !['retain', 'revise'].includes(decision)) throw new Error('Tanggapan hanya dapat dibuat oleh penguji sendiri.')
      const a = c.pair.find(p => p.user.id === u.id)?.assessment, final = a?.finals.at(-1)
      if (!a || !final || final.id !== finalId || a.draft) throw new Error('Selesaikan revisi dan gunakan final terkini.')
      if (decision === 'revise' && (!a.permissions.some(p => p.id === final.permissionId && p.moderationCaseId === m.id) || m.openedFinalIds.includes(final.id))) throw new Error('Final revisi pada kasus ini belum tersedia.')
      if (decision === 'retain' && !m.openedFinalIds.includes(final.id)) throw new Error('Penilaian telah direvisi; gunakan tanggapan revisi.')
      const response = { examinerId: u.id, finalId, decision, reason: text, at: data().clockNow }, old = m.responses.find(r => r.examinerId === u.id)
      if (old) Object.assign(old, response); else m.responses.push(response)
      m.status = 'awaiting_responses'; audit('Tanggapan moderasi disimpan', m.id, c.period.id, text); ctx.save()
    },
    closeModeration(id: string, reason: string, confirmed: boolean) {
      const { m, c } = currentModeration(id), u = manager(c.period.id), text = required(reason)
      if (!confirmed || c.pair.some(p => !m.responses.some(r => r.examinerId === p.user.id && r.finalId === p.assessment!.finals.at(-1)!.id))) throw new Error('Dua tanggapan harus merujuk final terkini dan penutupan harus dikonfirmasi.')
      m.status = 'resolved'; m.resolution = text; m.closedAt = data().clockNow; m.closedBy = u.id; c.attempt.moderation = 'resolved'; audit('Moderasi ditutup', m.id, c.period.id, text); ctx.save()
    },
    previewPublication,
    publishResult(id: string, input: PublicFeedback, token: string, requestKey: string, reason: string, confirmed: boolean) {
      const c = attemptContext(id), u = manager(c.period.id), content = publicInput(input), text = required(reason), key = required(requestKey, 'Kunci publikasi', 120)
      if (!confirmed) throw new Error('Konfirmasi pratinjau publikasi diperlukan.')
      const hash = JSON.stringify([id, content, token, text]), existing = data().publications.find(p => p.requestKey === key)
      if (existing) { if (existing.requestHash !== hash) throw new Error('Kunci publikasi telah digunakan untuk isi lain.'); return clone(existing) }
      const preview = previewPublication(id, content)
      if (preview.token !== token || preview.problems.length) throw new Error(preview.problems.join(' ') || 'State berubah setelah pratinjau. Tinjau kembali.')
      const previous = data().publications.filter(p => p.attemptId === id)
      const publication: Publication = { ...content, id: uid('publication'), attemptId: id, evidenceVersionId: c.evidence!.id, rubricVersionId: c.period.rubricVersionId, version: Math.max(0, ...previous.map(p => p.version)) + 1,
        sourceFinalIds: c.pair.map(p => p.assessment!.finals.at(-1)!.id), sourceAssignmentIds: c.assignments.map(a => a.id), scores: preview.scores, publishedAt: data().clockNow, publishedBy: u.id, status: 'published', reason: text, withdrawnAt: null, withdrawnBy: null, withdrawalReason: '', requestKey: key, requestHash: hash, fixture: false }
      previous.filter(p => p.status === 'published').forEach(p => { p.status = 'superseded' })
      data().publications.push(publication); c.attempt.publication = { status: 'published', version: publication.version, feedback: publication.strengths + '\n' + publication.improvements }
      audit('Hasil dipublikasikan', publication.id, c.period.id, text); ctx.save(); return clone(publication)
    },
    withdrawPublication(id: string, reason: string, confirmed: boolean) {
      const p = data().publications.find(p => p.id === id)
      if (!p) throw new Error('Publikasi tidak tersedia.')
      const c = attemptContext(p.attemptId), u = manager(c.period.id), text = required(reason)
      if (!confirmed) throw new Error('Konfirmasi penarikan diperlukan.')
      if (p.status === 'withdrawn') return
      if (p.status !== 'published') throw new Error('Versi ini sudah digantikan.')
      p.status = 'withdrawn'; p.withdrawnAt = data().clockNow; p.withdrawnBy = u.id; p.withdrawalReason = text
      c.attempt.publication = { status: 'withdrawn', version: p.version, feedback: null }; audit('Publikasi ditarik', p.id, c.period.id, text); ctx.save()
    },
    getPublications() { const u = manager(); return clone(data().publications.filter(p => u.managedPeriodIds?.includes(attemptContext(p.attemptId).period.id))) },
    getPublishedResults() {
      const u = ctx.user(); if (u.role !== 'peserta') throw new Error('Hasil publik hanya tersedia bagi peserta pemiliknya.')
      return clone(data().attempts.filter(a => a.participantId === u.id).map(a => {
        const p = data().publications.find(p => p.attemptId === a.id && p.status === 'published')
        return { attemptId: a.id, period: attemptContext(a.id).period.name, status: a.publication.status,
          result: p ? { version: p.version, evidenceVersion: data().evidenceVersions.find(v => v.id === p.evidenceVersionId)!.version, rubricVersionId: p.rubricVersionId, publishedAt: p.publishedAt, strengths: p.strengths, improvements: p.improvements, feedback: p.feedback, scores: p.showComponentScores ? p.scores : [], fixture: p.fixture } : null }
      }))
    },
    listInterviews() {
      const u = ctx.user(), periods = periodIdsFor(data(), u)
      return clone(data().attempts.filter(a => periods.includes(a.periodId) && attemptContext(a.id).period.interviewEnabled && (u.role === 'pengelola' || u.role === 'peserta' && a.participantId === u.id || u.role === 'penguji' && attemptContext(a.id).assignments.some(x => x.examinerId === u.id))).map(a => {
        const c = attemptContext(a.id), interview = data().interviews.filter(i => i.attemptId === a.id && i.evidenceVersionId === c.evidence?.id).at(-1)
        return { attemptId: a.id, participant: data().users.find(u => u.id === a.participantId)!.displayName, periodName: c.period.name, evidenceVersion: a.evidenceVersion, requiredForRelease: c.period.interviewRequiredForRelease,
          examiners: c.pair.map(p => p.user.displayName), interview: interview ? { ...interview, notes: u.role === 'peserta' ? '' : interview.notes, history: u.role === 'peserta' ? [] : interview.history } : null }
      }))
    },
    saveInterview(id: string, input: { scheduledAt: string; url: string; status: 'scheduled' | 'rescheduled' | 'completed' | 'cancelled'; notes: string }, expectedRevision: number, reason: string) {
      const c = attemptContext(id), u = manager(c.period.id), text = required(reason)
      if (!c.period.interviewEnabled || c.period.archived) throw new Error('Wawancara tidak aktif pada periode ini.')
      requirePair(id, false)
      if (c.attempt.publication.status === 'published' && c.period.interviewRequiredForRelease) throw new Error('Tarik publikasi sebelum mengubah wawancara yang menjadi prasyaratnya.')
      const old = data().interviews.filter(i => i.attemptId === id && i.evidenceVersionId === c.evidence!.id).at(-1)
      if ((old?.revision ?? 0) !== expectedRevision) throw new Error('Jadwal berubah. Muat ulang.')
      let url: URL; try { url = new URL(input.url) } catch { throw new Error('Tautan HTTPS diperlukan; gunakan meet.demo.invalid untuk simulasi.') }
      if (url.protocol !== 'https:' || url.username || url.password || !Number.isFinite(Date.parse(input.scheduledAt)) || !['scheduled', 'rescheduled', 'completed', 'cancelled'].includes(input.status) || typeof input.notes !== 'string' || input.notes.length > 5000) throw new Error('Jadwal atau catatan tidak valid.')
      if (input.status === 'completed' && (!old || old.status === 'cancelled' || Date.parse(input.scheduledAt) > Date.parse(data().clockNow))) throw new Error('Wawancara harus telah dijadwalkan dan waktunya tercapai menurut DemoClock.')
      const value = { id: old?.id ?? uid('interview'), attemptId: id, evidenceVersionId: c.evidence!.id, assignmentIds: c.assignments.map(a => a.id), revision: expectedRevision + 1, ...input, scheduledAt: new Date(input.scheduledAt).toISOString(), url: url.href, history: old?.history ?? [] }
      value.history.push({ status: value.status, at: data().clockNow, actorId: u.id, reason: text, scheduledAt: value.scheduledAt, url: value.url, notes: value.notes })
      if (old) Object.assign(old, value); else data().interviews.push(value)
      audit('Wawancara diperbarui', value.id, c.period.id, text); ctx.save()
    },
    saveAnnouncement(input: Pick<Announcement, 'id' | 'title' | 'body' | 'audience' | 'periodIds'>, expectedRevision: number | null) {
      manager(); const old = data().announcements.find(a => a.id === input.id)
      if (!input.periodIds?.length || input.periodIds.some(id => !data().periods.some(p => p.id === id)) || !input.audience.length || input.audience.some(r => !['peserta', 'penguji', 'pengelola'].includes(r))) throw new Error('Pilih periode dan peran penerima.')
      input.periodIds.forEach(id => manager(id))
      if (old && (old.periodIds?.forEach(id => manager(id)), old.status !== 'draft' || (old.revision ?? 0) !== expectedRevision)) throw new Error('Hanya draf terbaru yang dapat disunting. Buat pengumuman baru untuk koreksi.')
      if (!old && expectedRevision !== null) throw new Error('Draf tidak tersedia.')
      const a: Announcement = { id: old?.id ?? uid('announcement'), title: required(input.title, 'Judul', 180), body: required(input.body, 'Isi'), audience: [...new Set(input.audience)], periodIds: [...new Set(input.periodIds)], revision: (old?.revision ?? 0) + 1, status: 'draft', publishedAt: old?.publishedAt ?? data().clockNow }
      if (old) Object.assign(old, a); else data().announcements.push(a)
      audit('Draf pengumuman disimpan', a.id, a.periodIds![0]!, a.title); ctx.save(); return clone(a)
    },
    setAnnouncementStatus(id: string, status: 'published' | 'archived', reason: string) {
      manager(); const text = required(reason), a = data().announcements.find(a => a.id === id)
      if (!a) throw new Error('Pengumuman tidak tersedia.')
      ;(a.periodIds ?? data().periods.map(p => p.id)).forEach(id => manager(id))
      if (status === 'published' && a.status !== 'draft' || !['published', 'archived'].includes(status)) throw new Error('Pengumuman ini tidak dapat diterbitkan ulang.')
      a.status = status; a.revision = (a.revision ?? 0) + 1; if (status === 'published') a.publishedAt = data().clockNow
      audit('Status pengumuman diubah', id, a.periodIds?.[0] ?? null, text); ctx.save()
    },
  }
  return api
}
