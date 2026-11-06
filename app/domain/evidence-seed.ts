import type { BaseData, EvidenceContent, EvidenceData } from './types.ts';
import { SAMPLE_FILES } from '../data/sample-files.ts';
import { DEMO_VIDEO_URL, emptyEvidenceContent } from './evidence.ts';
export const STAGE2_SEED_VERSION = '2026-11-stage2';
export const STAGE2_WELCOME = 'Siapkan perangkat pembelajaran, tautan video, dan studi kasus di ruang Paket UKIN. Pengiriman mengunci versi; pengelola memeriksa kelengkapan, bukan menentukan kelulusan. Semua data dan contoh bersifat simulasi.';
export const SAMPLE_CASE = { context: 'Beberapa peserta didik fiktif membandingkan pecahan hanya dari pembilangnya.', action: 'Pengajar menggunakan potongan bentuk yang setara dan pertanyaan pembanding.', result: 'Contoh jawaban simulasi menunjukkan peserta mulai mempertimbangkan besar bagian. Ini bukan data penelitian.', reflection: 'Gunakan variasi representasi dan periksa kembali alasan peserta didik pada pertemuan selanjutnya.' };
export function fixtureContent(source: 'participant_report' | 'exam_snapshot', ready = { perangkat: true, video: true, studi_kasus: true }): EvidenceContent {
    const c = emptyEvidenceContent(source);
    if (ready.perangkat)
        c.mainDocument = structuredClone(SAMPLE_FILES.find(s => s.id === 'sample-perangkat')!);
    if (ready.video)
        c.video.full = DEMO_VIDEO_URL;
    if (ready.studi_kasus)
        Object.assign(c.caseStudy, SAMPLE_CASE);
    if (source === 'exam_snapshot') {
        Object.assign(c.caseStudy, SAMPLE_CASE);
        c.caseStudy.provenance = 'Snapshot fiktif UKIN dari web ujian — disediakan lokal, tanpa integrasi.';
    }
    return c;
}
export function hydrateEvidence(base: BaseData): EvidenceData {
    const data: EvidenceData = { ...structuredClone(base), drafts: [], evidenceVersions: [], reviews: [], activities: [] };
    const welcome = data.announcements.find(item => item.id === 'welcome');
    if (welcome?.body === 'Mulai dari tiga komponen: perangkat pembelajaran, video praktik, dan studi kasus. Pada tahap ini, dashboard merupakan pratinjau dengan data fiktif; penyusunan paket dan penilaian belum tersedia.') welcome.body = STAGE2_WELCOME;
    for (const user of data.users)
        if (user.role === 'pengelola')
            user.managedPeriodIds ??= data.periods.map(p => p.id);
    for (const attempt of data.attempts) {
        const period = data.periods.find(p => p.id === attempt.periodId)!;
        const content = fixtureContent(period.caseStudySource, attempt.components);
        if (attempt.packageStatus === 'draft' || attempt.packageStatus === 'revision_requested')
            data.drafts.push({ attemptId: attempt.id, revision: 0, updatedAt: data.clockNow, content: structuredClone(content) });
        if (attempt.evidenceVersion !== null) {
            const id = `${attempt.id}-evidence-${attempt.evidenceVersion}`;
            data.evidenceVersions.push({ id, attemptId: attempt.id, version: attempt.evidenceVersion, receipt: `DEMO-${attempt.id.toUpperCase()}-V${attempt.evidenceVersion}`, submittedAt: data.clockNow, submittedBy: attempt.participantId, content: structuredClone(content), sourceDraftRevision: -1, fixture: true });
            data.activities.push({ id: `fixture-${id}`, attemptId: attempt.id, evidenceVersionId: id, actorId: attempt.participantId, actorName: data.users.find(u => u.id === attempt.participantId)!.displayName, action: 'Contoh paket tersedia', at: data.clockNow, reason: 'Bukti contoh disediakan untuk metadata skenario lama; bukan unggahan peserta atau hasil pemeriksaan baru.', fixture: true });
            if (attempt.completeness !== 'pending')
                data.reviews.push({ id: `fixture-review-${id}`, evidenceVersionId: id, outcome: attempt.completeness, checks: { perangkat: true, video: attempt.completeness === 'complete', studi_kasus: true }, issues: attempt.completeness === 'needs_correction' ? { video: 'Contoh permintaan: gunakan tautan video yang dapat diakses pengelola.' } : {}, actorId: 'pengelola-1', actorName: 'Dina Saraswati', reviewedAt: data.clockNow, fixture: true });
        }
    }
    return data;
}
