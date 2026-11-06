import { assessmentStatus } from './assessment.ts'
import { checklistFor } from './evidence.ts'
import { periodIdsFor } from './operations.ts'
import type { Attempt, ComponentId, EvidenceFile, UkinData, User } from './types.ts'

export const COMPONENTS: { id: ComponentId; label: string; description: string }[] = [
  { id: 'perangkat', label: 'Perangkat pembelajaran', description: 'Rancangan, bahan ajar, dan asesmen yang mendukung pembelajaran.' },
  { id: 'video', label: 'Video praktik pembelajaran', description: 'Praktik mengajar melalui tautan YouTube. Pemutaran memerlukan internet.' },
  { id: 'studi_kasus', label: 'Studi kasus', description: 'Konteks, tindakan, bukti hasil, dan refleksi atas pengalaman mengajar.' },
]

export function homeFor(user: User): string { return `/app/${user.role}` }

export function formatDemoTime(iso: string): string {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(iso)) + ' WIB'
}

export function roleLabel(user: Pick<User, 'role' | 'examinerKind'>): string {
  return user.role === 'penguji' ? `Penguji ${user.examinerKind}` : user.role === 'peserta' ? 'Peserta PPG' : 'Pengelola UKIN'
}

export function announcementsFor(data: UkinData, user: User) {
  const currentUser = data.users.find((candidate) => candidate.id === user.id && candidate.active)
  if (!currentUser || currentUser.role !== user.role || currentUser.examinerKind !== user.examinerKind) return []
  return data.announcements.filter((item) => (!item.status || item.status === 'published') && item.audience.includes(currentUser.role) && (!item.periodIds || item.periodIds.some(id => periodIdsFor(data, currentUser).includes(id)))).map((item) => ({
    ...item, audience: [...item.audience], read: data.readMarkers.some((marker) => marker.userId === user.id && marker.announcementId === item.id),
    // Refresh only the exact built-in copy in the projection; preserve custom text and stored state.
    body: item.body === 'Penguji dosen dan guru memiliki penugasan serta pekerjaan masing-masing. Skor pasangan tidak ditampilkan sebelum moderasi diotorisasi. Ruang penilaian tersedia pada tahap pengembangan berikutnya.'
      ? 'Penguji dosen dan guru menilai secara independen di ruang Penugasan saya. Skor pasangan hanya terbuka pada indikator dalam kasus moderasi yang diotorisasi pengelola. Peserta menerima feedback yang sengaja dipublikasikan.' : item.body,
  }))
}

export function processLabel(attempt: Attempt, data: UkinData): string {
  if (data.publications.some(p => p.attemptId === attempt.id && p.status === 'published')) return 'Hasil dipublikasikan'
  if (attempt.packageStatus === 'draft') return 'Paket masih draf'
  if (attempt.completeness === 'needs_correction') return 'Perlu perbaikan teknis'
  if (attempt.moderation === 'open') return 'Dalam moderasi'
  const assigned = data.assignments.filter((item) => item.active && item.attemptId === attempt.id && item.evidenceVersion === attempt.evidenceVersion)
  if (assigned.length === 2 && assigned.every((item) => assessmentStatus(data, item) === 'final')) return 'Penilaian selesai'
  if (assigned.some((item) => assessmentStatus(data, item) === 'final' || assessmentStatus(data, item) === 'draft')) return 'Penilaian berlangsung'
  return attempt.completeness === 'complete' ? 'Siap dinilai' : 'Menunggu pemeriksaan'
}

export function dashboardFor(data: UkinData, user: User, available:(file:EvidenceFile)=>boolean=(file)=>file.source==='sample') {
  const currentUser = data.users.find((item) => item.id === user.id && item.active)
  if (!currentUser || currentUser.role !== user.role || currentUser.examinerKind !== user.examinerKind) throw new Error('Akun demo tidak tersedia.')
  const period = (user.role === 'pengelola' ? data.periods.find(p => currentUser.managedPeriodIds?.includes(p.id)) : undefined) ?? data.periods[0]!
  const active = data.attempts.filter((item) => !item.archived && item.periodId === period.id && (user.role !== 'pengelola' || currentUser.managedPeriodIds?.includes(item.periodId)))
  const mine = active.find((item) => item.participantId === user.id)
  const published = mine ? data.publications.find(p => p.attemptId === mine.id && p.status === 'published') : undefined
  const ownAssignments = data.assignments.filter((item) => item.active && item.examinerId === user.id && active.some((attempt) => attempt.id === item.attemptId && attempt.evidenceVersion === item.evidenceVersion))
  const rows = active.filter((attempt) => user.role === 'pengelola' || (user.role === 'peserta' ? attempt.participantId === user.id : ownAssignments.some((assignment) => assignment.attemptId === attempt.id))).map((attempt) => {
    const assignment = ownAssignments.find((item) => item.attemptId === attempt.id)
    return {
      id: attempt.id,
      assignmentId: assignment?.id ?? null,
      name: data.users.find((item) => item.id === attempt.participantId)?.displayName ?? 'Peserta fiktif',
      subject: attempt.subject,
      attemptNumber: attempt.attemptNumber,
      evidenceVersion: attempt.evidenceVersion,
      evidenceVersionId: data.evidenceVersions.find(v=>v.attemptId===attempt.id&&v.version===attempt.evidenceVersion)?.id??null,
      completeness: attempt.completeness,
      moderation: attempt.moderation,
      status: user.role === 'penguji' ? ({ not_started: 'Belum dinilai', draft: 'Draf pribadi', final: 'Final simulasi' }[assignment ? assessmentStatus(data, assignment) : 'not_started']) : processLabel(attempt, data),
      assessmentStatus: assignment ? assessmentStatus(data, assignment) : null,
    }
  })
  const content = mine ? (['draft','revision_requested'].includes(mine.packageStatus) ? data.drafts.find(d=>d.attemptId===mine.id)?.content : data.evidenceVersions.find(v=>v.attemptId===mine.id&&v.version===mine.evidenceVersion)?.content) : undefined
  const readiness = content ? checklistFor(content,period,available) : []
  const components = COMPONENTS.map((component) => ({ ...component, prepared: user.role === 'peserta' ? (readiness.find(c=>c.id===component.id)?.complete??false) : null }))
  const metrics = user.role === 'peserta'
    ? [
        { label: 'Komponen disiapkan', value: components.filter((item) => item.prepared).length, suffix: '/ 3' },
        { label: 'Percobaan aktif', value: mine?.attemptNumber ?? 0, suffix: '' },
        { label: 'Hasil dipublikasikan', value: published ? 1 : 0, suffix: '' },
      ]
    : user.role === 'penguji'
      ? [
          { label: 'Penugasan Anda', value: ownAssignments.length, suffix: '' },
          { label: 'Belum final', value: ownAssignments.filter((item) => assessmentStatus(data, item) !== 'final').length, suffix: '' },
          { label: 'Final simulasi', value: ownAssignments.filter((item) => assessmentStatus(data, item) === 'final').length, suffix: '' },
        ]
      : [
          { label: 'Peserta aktif', value: active.length, suffix: '' },
          { label: 'Paket lengkap', value: active.filter((item) => item.completeness === 'complete').length, suffix: '' },
          { label: 'Perlu perhatian', value: active.filter((item) => item.completeness === 'needs_correction' || item.moderation === 'open').length, suffix: '' },
        ]
  const now = Date.parse(data.clockNow)
  return {
    period: structuredClone(period), metrics, rows, components,
    collectionOpen: !period.archived && now >= Date.parse(period.collectionOpensAt) && now <= Date.parse(period.collectionClosesAt),
    assessmentOpen: !period.archived && now >= Date.parse(period.assessmentOpensAt) && now <= Date.parse(period.assessmentClosesAt),
    participantStatus: mine ? processLabel(mine, data) : null,
    // Only an explicitly published snapshot supplies participant feedback.
    publishedFeedback: user.role === 'peserta' && published ? [published.strengths, published.improvements].filter(Boolean).join('\n') : null,
    unreadAnnouncements: announcementsFor(data, user).filter((item) => !item.read).length,
  }
}

