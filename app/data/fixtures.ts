import { hydrateOperations, STAGE4_SEED_VERSION } from '../domain/operations.ts'
import { hydrateEvidence, STAGE2_SEED_VERSION } from '../domain/evidence-seed.ts'
import { hydrateAssessments, STAGE3_SEED_VERSION } from '../domain/assessment.ts'
import type { Assignment, Attempt, Snapshot, Stage3Snapshot, Stage2Snapshot, User, LegacySnapshot } from '../domain/types.ts'

export const DEMO_PASSWORD = 'DemoUKIN123!'
export const ACTIVE_CLOCK = '2026-11-18T02:00:00.000Z'
export const CLOSED_CLOCK = '2026-12-11T02:00:00.000Z'
export const LEGACY_SEED_VERSION = '2026-11-stage1'
export const SEED_VERSION = STAGE4_SEED_VERSION

export const DEMO_ACCOUNTS: User[] = [
  { id: 'peserta-1', email: 'peserta@demo.invalid', displayName: 'Alya Prameswari', role: 'peserta', active: true, interactive: true },
  { id: 'penguji-dosen', email: 'dosen@demo.invalid', displayName: 'Dr. Raka Adinata', role: 'penguji', examinerKind: 'dosen', active: true, interactive: true },
  { id: 'penguji-guru', email: 'guru@demo.invalid', displayName: 'Nisa Kartika, S.Pd.', role: 'penguji', examinerKind: 'guru', active: true, interactive: true },
  { id: 'pengelola-1', email: 'pengelola@demo.invalid', displayName: 'Dina Saraswati', role: 'pengelola', active: true, interactive: true },
]

function attempt(id: string, participantId: string, fields: Partial<Attempt> = {}): Attempt {
  return {
    id, participantId, periodId: 'periode-2026', subject: 'Pendidikan Guru Sekolah Dasar',
    attemptNumber: 1, previousAttemptId: null, archived: false,
    packageStatus: 'submitted', completeness: 'complete',
    components: { perangkat: true, video: true, studi_kasus: true },
    evidenceVersion: 1,
    publication: { status: 'unpublished', version: null, feedback: null },
    moderation: 'none', ...fields,
  }
}

export function createLegacySeed(): LegacySnapshot {
  const attempts: Attempt[] = [
    attempt('attempt-1', 'peserta-1', {
      packageStatus: 'draft', completeness: 'pending', evidenceVersion: null,
      components: { perangkat: false, video: false, studi_kasus: true },
    }),
    attempt('attempt-2', 'peserta-2', { packageStatus: 'revision_requested', completeness: 'needs_correction' }),
    attempt('attempt-3', 'peserta-3'),
    attempt('attempt-4', 'peserta-4'),
    attempt('attempt-5', 'peserta-5', { moderation: 'open' }),
    attempt('attempt-6-old', 'peserta-6', { archived: true, moderation: 'resolved' }),
    attempt('attempt-6', 'peserta-6', { attemptNumber: 2, previousAttemptId: 'attempt-6-old' }),
  ]
  const assignments: Assignment[] = ['attempt-3', 'attempt-4', 'attempt-5', 'attempt-6'].flatMap((attemptId) =>
    (['dosen', 'guru'] as const).map((kind) => {
      const final = attemptId === 'attempt-5' || (attemptId === 'attempt-4' && kind === 'dosen')
      return {
        id: `${attemptId}-${kind}`, attemptId, examinerId: `penguji-${kind}`, kind, active: true,
        evidenceVersion: 1, assessmentStatus: final ? 'final' as const : 'not_started' as const,
        finalVersion: final ? 1 : null,
      }
    }))
  return {
    schemaVersion: 1, seedVersion: LEGACY_SEED_VERSION, savedAt: ACTIVE_CLOCK,
    data: {
      clockNow: ACTIVE_CLOCK,
      users: [
        ...DEMO_ACCOUNTS.map((user) => ({ ...user })),
        ...['Bima Ardiansyah', 'Citra Maheswari', 'Damar Wicaksana', 'Eva Lestari', 'Farhan Pratama'].map((displayName, index): User => ({
          id: `peserta-${index + 2}`, email: `peserta${index + 2}@fixture.invalid`, displayName,
          role: 'peserta', active: true, interactive: false,
        })),
      ],
      periods: [{
        id: 'periode-2026', name: 'Simulasi UKIN PPG UNJ 2026', year: 2026,
        collectionOpensAt: '2026-10-31T17:00:00.000Z', collectionClosesAt: '2026-11-30T16:59:59.999Z',
        assessmentOpensAt: '2026-10-31T17:00:00.000Z', assessmentClosesAt: '2026-12-10T16:59:59.999Z',
        rubricVersionId: 'demo-12-v1', caseStudySource: 'participant_report',
        requirements: { fullVideo: true, summaryVideo: false },
        interviewEnabled: false, interviewRequiredForRelease: false, quota: null,
      }],
      attempts, assignments,
      announcements: [
        { id: 'welcome', title: 'Kenali ruang UKIN Anda', body: 'Mulai dari tiga komponen: perangkat pembelajaran, video praktik, dan studi kasus. Pada tahap ini, dashboard merupakan pratinjau dengan data fiktif; penyusunan paket dan penilaian belum tersedia.', publishedAt: '2026-11-17T02:00:00.000Z', audience: ['peserta', 'penguji', 'pengelola'] },
        { id: 'independent-review', title: 'Penilaian dilakukan secara independen', body: 'Penguji dosen dan guru memiliki penugasan serta pekerjaan masing-masing. Skor pasangan tidak ditampilkan sebelum moderasi diotorisasi. Ruang penilaian tersedia pada tahap pengembangan berikutnya.', publishedAt: '2026-11-16T02:00:00.000Z', audience: ['penguji', 'pengelola'] },
      ],
      readMarkers: [],
    },
  }
}

export function createStage2Seed(): Stage2Snapshot {
  const old=createLegacySeed(); const data=hydrateEvidence(old.data)
  return {schemaVersion:2,seedVersion:STAGE2_SEED_VERSION,savedAt:old.savedAt,data}
}
export function createStage3Seed(): Stage3Snapshot {
  const old = createStage2Seed()
  return { schemaVersion: 3, seedVersion: STAGE3_SEED_VERSION, savedAt: old.savedAt, data: hydrateAssessments(old.data) }
}

export function createSeed(): Snapshot { const old = createStage3Seed(); return { schemaVersion: 4, seedVersion: SEED_VERSION, savedAt: old.savedAt, data: hydrateOperations(old.data) } }
