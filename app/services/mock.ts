import { ACTIVE_CLOCK, CLOSED_CLOCK, DEMO_ACCOUNTS, DEMO_PASSWORD, createSeed } from '../data/fixtures.ts';
import { SAMPLE_FILES } from '../data/sample-files.ts';
import { decodeSnapshot } from '../domain/snapshot.ts';
import { allEvidenceFiles, checklistFor, collectionOpen, contentReadiness, emptyEvidenceContent, normalizeEvidenceContent } from '../domain/evidence.ts';
import { createFileRegistry } from './files.ts';
import { createAssessmentService } from './assessments.ts';
import { createOperationsService } from './operations.ts';
import { archiveWorkflow } from '../domain/operations.ts';
import { announcementsFor, dashboardFor } from '../domain/selectors.ts';
import type { ActivityEvent, Attempt, CompletenessReview, ComponentId, EvidenceContent, EvidenceFile, EvidenceVersion, EvidenceView, FileRuntime, PackageView, ReviewInput, Snapshot, StorageLike, SubmittedPackageRow, User } from '../domain/types.ts';
export const STATE_KEY = 'ppg-unj-ukin:v1:state';
export const SESSION_KEY = 'ppg-unj-ukin:v1:session';
export interface MockServiceOptions {
    localStorage?: StorageLike;
    sessionStorage?: StorageLike;
    files?: FileRuntime;
}
export function createMockService(options: MockServiceOptions = {}) {
    let snapshot: Snapshot = createSeed(), userId: string | null = null, epoch = 0;
    let persistState = Boolean(options.localStorage);
    const files = options.files ?? createFileRegistry();
    const registered = new Map<string, {
        attemptId: string;
        actorId: string;
        file: EvidenceFile;
    }>();
    const notices: string[] = [];
    const notice = (message: string) => { if (!notices.includes(message))
        notices.push(message); };
    const memoryNotice = 'Penyimpanan lokal tidak tersedia. Perubahan hanya bertahan selama halaman ini terbuka.';
    const sessionNotice = 'Sesi tidak dapat disimpan di tab ini. Setelah memuat ulang, Anda mungkin perlu masuk kembali.';
    if (!options.localStorage)
        notice(memoryNotice);
    if (!options.sessionStorage)
        notice(sessionNotice);
    try {
        const raw = options.localStorage?.getItem(STATE_KEY);
        if (raw) {
            const decoded = decodeSnapshot(JSON.parse(raw));
            if (decoded) {
                snapshot = decoded.snapshot;
                if (decoded.migrated) {
                    notice('State dimigrasikan ke Tahap 4. Paket, receipt, pemeriksaan, assessment, revisi, sesi dan jam demo dipertahankan. Data dari metadata skenario lama diberi label contoh simulasi.');
                    try {
                        options.localStorage!.setItem(STATE_KEY, JSON.stringify(snapshot));
                    }
                    catch {
                        persistState = false;
                        notice(memoryNotice);
                    }
                }
            }
            else {
                persistState = false;
                notice('Data demo tersimpan tidak cocok dengan versi ini atau tidak lengkap. Contoh awal dibuka sementara; data lama tidak ditimpa. Gunakan Reset UKIN untuk memulai ulang.');
            }
        }
    }
    catch {
        persistState = false;
        notice('Data demo tidak dapat dibaca. Contoh awal dibuka sementara; pemulihan data lama tidak dijamin. Gunakan Reset UKIN untuk memulai ulang.');
    }
    function validUser(id: unknown) { return snapshot.data.users.find(u => u.id === id && u.active && u.interactive && DEMO_ACCOUNTS.some(a => a.id === u.id)); }
    try {
        const raw = options.sessionStorage?.getItem(SESSION_KEY);
        if (raw) {
            const p: unknown = JSON.parse(raw);
            if (p && typeof p === 'object' && 'schemaVersion' in p && p.schemaVersion === 1 && 'userId' in p && validUser(p.userId))
                userId = p.userId as string;
            else
                notice('Sesi demo tidak valid. Silakan masuk menggunakan salah satu akun contoh.');
        }
    }
    catch {
        notice('Sesi demo tidak dapat dibaca. Silakan masuk kembali; data UKIN tidak dihapus.');
    }
    function save() { snapshot.savedAt = snapshot.data.clockNow; if (!persistState)
        return; try {
        options.localStorage!.setItem(STATE_KEY, JSON.stringify(snapshot));
    }
    catch {
        persistState = false;
        notice(memoryNotice);
    } }
    function saveSession() { try {
        if (userId)
            options.sessionStorage?.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, userId }));
        else
            options.sessionStorage?.removeItem(SESSION_KEY);
    }
    catch {
        try {
            options.sessionStorage?.removeItem(SESSION_KEY);
            notice(sessionNotice);
        }
        catch {
            notice('Sesi browser tidak dapat diperbarui atau dihapus. Setelah memuat ulang, akun sebelumnya mungkin terbuka. Tutup tab setelah demo.');
        }
    } }
    function requireUser(): User { const u = validUser(userId); if (!u)
        throw new Error('Silakan masuk dengan akun demo terlebih dahulu.'); return u; }
    function findAttempt(id: string) { const a = snapshot.data.attempts.find(a => a.id === id); if (!a)
        throw new Error('Paket tidak ditemukan atau tidak tersedia.'); return a; }
    function periodFor(a: Attempt) { return snapshot.data.periods.find(p => p.id === a.periodId)!; }
    function currentVersion(a: Attempt) { return snapshot.data.evidenceVersions.find(v => v.attemptId === a.id && v.version === a.evidenceVersion); }
    function owns(u: User, a: Attempt) { return u.role === 'peserta' && u.id === a.participantId; }
    function manages(u: User, a: Attempt) { return u.role === 'pengelola' && Boolean(u.managedPeriodIds?.includes(a.periodId)); }
    function canRead(u: User, a: Attempt, v?: EvidenceVersion) { return owns(u, a) || manages(u, a) || (u.role === 'penguji' && snapshot.data.assignments.some(x => x.active && x.examinerId === u.id && x.attemptId === a.id && (!v || x.evidenceVersion === v.version))); }
    function attemptHistory(u: User, a: Attempt) {
        return snapshot.data.attempts
            .filter(item => item.participantId === a.participantId)
            .sort((first, second) => second.attemptNumber - first.attemptNumber)
            .flatMap(item => {
                const version = currentVersion(item);
                if (!version || !canRead(u, item, version)) return [];
                return [{ attemptId: item.id, attemptNumber: item.attemptNumber, periodName: periodFor(item).name, archived: item.archived, evidenceVersionId: version.id, version: version.version }];
            });
    }
    function requireOwnEditable(id: string) { const u = requireUser(), a = findAttempt(id); if (!owns(u, a))
        throw new Error('Hanya pemilik paket yang dapat mengubah bukti.'); if (a.archived || !['draft', 'revision_requested'].includes(a.packageStatus))
        throw new Error('Paket terkunci. Perubahan memerlukan permintaan perbaikan dari pengelola.'); if (!collectionOpen(periodFor(a), snapshot.data.clockNow))
        throw new Error('Periode pengumpulan tertutup menurut jam demo. Paket hanya dapat dibaca.'); return { u, a }; }
    function available(f: EvidenceFile) { return files.available(f); }
    function keepFiles(excludeId?: string) { files.retain([...snapshot.data.drafts.flatMap(d => allEvidenceFiles(d.content).map(f => f.id)), ...snapshot.data.evidenceVersions.flatMap(v => allEvidenceFiles(v.content).map(f => f.id)), ...registered.keys()].filter(id => id !== excludeId)); }
    function authorisedFile(id: string) {
        const u = requireUser();
        const pending = registered.get(id);
        if (pending?.actorId === u.id)
            return pending.file;
        for (const d of snapshot.data.drafts) {
            const a = findAttempt(d.attemptId);
            if (owns(u, a)) {
                const file = allEvidenceFiles(d.content).find(f => f.id === id);
                if (file)
                    return file;
            }
        }
        for (const v of snapshot.data.evidenceVersions) {
            const a = findAttempt(v.attemptId);
            if (canRead(u, a, v)) {
                const file = allEvidenceFiles(v.content).find(f => f.id === id);
                if (file)
                    return file;
            }
        }
        // Catalogue files contain fictional public examples, no participant draft.
        return SAMPLE_FILES.find(f => f.id === id);
    }
    function validateReferences(a: Attempt, content: EvidenceContent) {
        const known = [...snapshot.data.drafts.filter(d => d.attemptId === a.id).flatMap(d => allEvidenceFiles(d.content)), ...snapshot.data.evidenceVersions.filter(v => v.attemptId === a.id).flatMap(v => allEvidenceFiles(v.content)), ...Array.from(registered.values()).filter(r => r.actorId === userId && r.attemptId === a.id).map(r => r.file)];
        for (const f of allEvidenceFiles(content))
            if (f.source === 'local' && !known.some(k => JSON.stringify(k) === JSON.stringify(f)))
                throw new Error('File lokal belum dipilih oleh pemilik paket atau metadata file berubah.');
    }
    function normalizeFor(a: Attempt, input: EvidenceContent) { const c = normalizeEvidenceContent(input, periodFor(a)); const d = snapshot.data.drafts.find(d => d.attemptId === a.id); if (periodFor(a).caseStudySource === 'exam_snapshot' && d && JSON.stringify(c.caseStudy) !== JSON.stringify(d.content.caseStudy))
        throw new Error('Snapshot studi kasus dari ujian simulasi bersifat read-only.'); validateReferences(a, c); return c; }
    function addEvent(a: Attempt, u: User, action: string, reason = '', version: EvidenceVersion | null = null) { const e: ActivityEvent = { id: `event-${snapshot.data.activities.length + 1}-${a.id}`, attemptId: a.id, evidenceVersionId: version?.id ?? null, actorId: u.id, actorName: u.displayName, action, at: snapshot.data.clockNow, reason, fixture: false }; snapshot.data.activities.push(e); return e; }
    function getPackage(id?: string): PackageView {
        const u = requireUser();
        const a = id ? findAttempt(id) : snapshot.data.attempts.find(a => !a.archived && owns(u, a));
        if (!a || !canRead(u, a))
            throw new Error('Paket tidak ditemukan atau akses tidak tersedia.');
        const draft = owns(u, a) ? snapshot.data.drafts.find(d => d.attemptId === a.id) ?? null : null;
        const versions = snapshot.data.evidenceVersions.filter(v => v.attemptId === a.id && canRead(u, a, v)).sort((x, y) => y.version - x.version);
        const content = draft?.content ?? versions[0]?.content ?? emptyEvidenceContent(periodFor(a).caseStudySource);
        const checklist = checklistFor(content, periodFor(a), available);
        const ids = new Set(versions.map(v => v.id));
        return structuredClone({ attempt: a, period: periodFor(a), participant: snapshot.data.users.find(x => x.id === a.participantId)!, draft, versions, reviews: snapshot.data.reviews.filter(r => ids.has(r.evidenceVersionId)), history: snapshot.data.activities.filter(e => e.attemptId === a.id && (u.role !== 'penguji' || e.evidenceVersionId !== null && ids.has(e.evidenceVersionId))), editable: owns(u, a) && !a.archived && ['draft', 'revision_requested'].includes(a.packageStatus) && collectionOpen(periodFor(a), snapshot.data.clockNow), collectionOpen: collectionOpen(periodFor(a), snapshot.data.clockNow), checklist, ready: checklist.every(c => c.complete), attemptHistory: attemptHistory(u, a) });
    }
    function getEvidence(id: string): EvidenceView { const u = requireUser(), v = snapshot.data.evidenceVersions.find(v => v.id === id); if (!v)
        throw new Error('Versi bukti tidak ditemukan.'); const a = findAttempt(v.attemptId); if (!canRead(u, a, v))
        throw new Error('Anda tidak memiliki akses ke versi bukti ini.'); const current = a.evidenceVersion === v.version; return structuredClone({ version: v, attempt: a, period: periodFor(a), participant: snapshot.data.users.find(x => x.id === a.participantId)!, reviews: snapshot.data.reviews.filter(r => r.evidenceVersionId === v.id), history: snapshot.data.activities.filter(e => e.attemptId === a.id && e.evidenceVersionId === v.id), canRestore: owns(u, a), isCurrent: current, canReview: manages(u, a) && current && !a.archived && ['submitted', 'resubmitted'].includes(a.packageStatus), checklist: checklistFor(v.content, periodFor(a), available), attemptHistory: attemptHistory(u, a) }); }
    const assessments = createAssessmentService({ data: () => snapshot.data, user: requireUser, save, available, fileUrl: file => files.url(file) });
    const operations = createOperationsService({ data: () => snapshot.data, user: requireUser, save });
    return {
        ...assessments,
        ...operations,
        getDashboard() { return dashboardFor(snapshot.data, requireUser(), available); },
        getClientSnapshot(): Snapshot {
            const projected = structuredClone(snapshot), u = validUser(userId);
            // Dedicated account-scoped selectors expose only the fields needed by each operation.
            projected.data.moderations = []; projected.data.publications = []; projected.data.interviews = []; projected.data.adminEvents = [];
            projected.data.announcements = u ? announcementsFor(snapshot.data, u).map(({ read, ...a }) => a) : [];
            projected.data.assessments = u?.role === 'penguji' ? projected.data.assessments.filter(a => a.examinerId === u.id) : [];
            projected.data.drafts = projected.data.drafts.filter(d => u && owns(u, findAttempt(d.attemptId)));
            projected.data.evidenceVersions = projected.data.evidenceVersions.filter(v => u && canRead(u, findAttempt(v.attemptId), v));
            const ids = new Set(projected.data.evidenceVersions.map(v => v.id));
            projected.data.reviews = projected.data.reviews.filter(r => ids.has(r.evidenceVersionId));
            projected.data.activities = projected.data.activities.filter(e => u && (owns(u, findAttempt(e.attemptId)) || manages(u, findAttempt(e.attemptId))));
            projected.data.assignments = projected.data.assignments.filter(a => u && (a.examinerId === u.id || manages(u, findAttempt(a.attemptId))));
            for (const attempt of projected.data.attempts) {
                  const published = snapshot.data.publications.find(p => p.attemptId === attempt.id && p.status === 'published');
                  attempt.publication.feedback = published && u && (owns(u, attempt) || manages(u, attempt)) ? [published.strengths, published.improvements].filter(Boolean).join('\n') : null;
            }
            return projected;
        },
        getSnapshot(): Snapshot { return structuredClone(snapshot); }, getUser(): User | null { const u = validUser(userId); return u ? structuredClone(u) : null; }, getNotices() { return [...notices]; },
        login(email: string, password: string) { const u = snapshot.data.users.find(u => u.email === email.trim().toLowerCase() && validUser(u.id)); if (!u || password !== DEMO_PASSWORD)
            throw new Error('Email atau kata sandi demo belum sesuai. Pilih salah satu akun contoh di bawah.'); userId = u.id; epoch++; saveSession(); save(); return structuredClone(u); },
        switchAccount(id: string) { requireUser(); const u = validUser(id); if (!u)
            throw new Error('Akun demo ini tidak tersedia.'); userId = u.id; epoch++; saveSession(); return structuredClone(u); },
        logout() { userId = null; epoch++; saveSession(); },
        reset() { epoch++; registered.clear(); files.clear(); notices.length = 0; if (!options.localStorage)
            notice(memoryNotice); if (!options.sessionStorage)
            notice(sessionNotice); try {
            options.localStorage?.removeItem(STATE_KEY);
            persistState = Boolean(options.localStorage);
        }
        catch {
            persistState = false;
            notice('Reset berjalan di memori, tetapi data lama tidak dapat dihapus dari penyimpanan browser.');
        } try {
            options.sessionStorage?.removeItem(SESSION_KEY);
        }
        catch {
            notice('Sesi lama tidak dapat dihapus dari penyimpanan browser. Tutup tab setelah selesai menggunakan demo.');
        } snapshot = createSeed(); userId = null; save(); },
        markAnnouncementRead(id: string) { const u = requireUser(), a = announcementsFor(snapshot.data, u).find(a => a.id === id); if (!a)
            throw new Error('Pengumuman tidak tersedia untuk akun ini.'); if (!snapshot.data.readMarkers.some(r => r.userId === u.id && r.announcementId === id)) {
            snapshot.data.readMarkers.push({ userId: u.id, announcementId: id, readAt: snapshot.data.clockNow });
            save();
        } },
        setClock(scenario: 'active' | 'closed') { if (requireUser().role !== 'pengelola')
            throw new Error('Hanya pengelola demo yang dapat mengganti skenario waktu.'); if (scenario !== 'active' && scenario !== 'closed')
            throw new Error('Skenario waktu tidak tersedia.'); snapshot.data.clockNow = scenario === 'active' ? ACTIVE_CLOCK : CLOSED_CLOCK; save(); },
        getPackage, getEvidence,
        listMyAttempts() { const u = requireUser(); return structuredClone(snapshot.data.attempts.filter(a => owns(u, a)).sort((a, b) => b.attemptNumber - a.attemptNumber)); },
        listSubmittedPackages(): SubmittedPackageRow[] { const u = requireUser(); return snapshot.data.attempts.filter(a => !a.archived && a.evidenceVersion !== null).flatMap(a => { const v = currentVersion(a); if (!v || !canRead(u, a, v))
            return []; return [{ id: v.id, attemptId: a.id, participantName: snapshot.data.users.find(x => x.id === a.participantId)!.displayName, periodId: a.periodId, periodName: periodFor(a).name, subject: a.subject, attemptNumber: a.attemptNumber, version: v.version, receipt: v.receipt, submittedAt: v.submittedAt, packageStatus: a.packageStatus, completeness: a.completeness, fixture: v.fixture }]; }); },
        previewContent(id: string, input: EvidenceContent) { const u = requireUser(), a = findAttempt(id); if (!owns(u, a))
            throw new Error('Pratinjau draf hanya tersedia untuk pemilik paket.'); const content = normalizeFor(a, input), checklist = checklistFor(content, periodFor(a), available); return { content, checklist, ready: checklist.every(c => c.complete) }; },
        saveDraft(id: string, input: EvidenceContent, expectedRevision: number) { const { u, a } = requireOwnEditable(id), draft = snapshot.data.drafts.find(d => d.attemptId === id)!; if (draft.revision !== expectedRevision)
            throw new Error('Draf telah berubah. Muat ulang paket sebelum menyimpan.'); const content = normalizeFor(a, input); draft.content = content; draft.revision++; draft.updatedAt = snapshot.data.clockNow; a.components = contentReadiness(content, periodFor(a)); for (const [key, r] of registered)
            if (r.attemptId === id && r.actorId === u.id)
                registered.delete(key); keepFiles(); addEvent(a, u, 'Draf disimpan'); save(); return structuredClone(draft); },
        submitPackage(id: string, expectedRevision: number, confirmed: boolean): EvidenceVersion {
            const u = requireUser(), a = findAttempt(id);
            if (!owns(u, a))
                throw new Error('Hanya pemilik paket yang dapat mengirim.');
            if (!confirmed)
                throw new Error('Konfirmasi penguncian paket diperlukan.');
            const previous = currentVersion(a);
            if (previous && previous.sourceDraftRevision === expectedRevision && ['submitted', 'resubmitted'].includes(a.packageStatus))
                return structuredClone(previous);
            requireOwnEditable(id);
            const draft = snapshot.data.drafts.find(d => d.attemptId === id)!;
            if (draft.revision !== expectedRevision)
                throw new Error('Draf telah berubah. Tinjau versi terbaru sebelum mengirim.');
            const content = normalizeFor(a, draft.content), checklist = checklistFor(content, periodFor(a), available);
            if (checklist.some(c => !c.complete))
                throw new Error(checklist.flatMap(c => c.issues).join(' '));
            const version = Math.max(0, ...snapshot.data.evidenceVersions.filter(v => v.attemptId === id).map(v => v.version)) + 1;
            const v: EvidenceVersion = { id: `${id}-evidence-${version}`, attemptId: id, version, receipt: `UKIN-${id.toUpperCase()}-V${version}`, submittedAt: snapshot.data.clockNow, submittedBy: u.id, content: structuredClone(content), sourceDraftRevision: expectedRevision, fixture: false };
            snapshot.data.evidenceVersions.push(v);
            a.evidenceVersion = version;
            a.packageStatus = version === 1 ? 'submitted' : 'resubmitted';
            a.completeness = 'pending';
            a.components = contentReadiness(content, periodFor(a));
            addEvent(a, u, version === 1 ? 'Paket dikirim' : 'Perbaikan dikirim ulang', 'Snapshot bukti dikunci; tautan YouTube tidak membekukan isi di platform eksternal.', v);
            save();
            return structuredClone(v);
        },
        reviewPackage(versionId: string, input: ReviewInput): CompletenessReview {
            const u = requireUser(), view = getEvidence(versionId), a = findAttempt(view.attempt.id), v = snapshot.data.evidenceVersions.find(x => x.id === versionId)!;
            if (!manages(u, a))
                throw new Error('Pemeriksaan hanya tersedia bagi pengelola periode ini.');
            if (!input || !['complete', 'needs_correction'].includes(input.outcome) || !input.checks || !input.issues)
                throw new Error('Hasil pemeriksaan tidak valid.');
            const keys: ComponentId[] = ['perangkat', 'video', 'studi_kasus'];
            if (!keys.every(k => typeof input.checks[k] === 'boolean'))
                throw new Error('Checklist pemeriksaan tiga komponen diperlukan.');
            const issues: ReviewInput['issues'] = {};
            for (const [key, value] of Object.entries(input.issues)) {
                if (!keys.includes(key as ComponentId) || typeof value !== 'string' || value.length > 2000)
                    throw new Error('Alasan perbaikan tidak valid (maksimum teknis 2.000 karakter).');
                if (value.trim())
                    issues[key as ComponentId] = value.trim();
            }
            const latest = snapshot.data.reviews.filter(r => r.evidenceVersionId === versionId).at(-1);
            if (latest && !latest.fixture && latest.actorId === u.id && latest.outcome === input.outcome && JSON.stringify(latest.checks) === JSON.stringify(input.checks) && JSON.stringify(latest.issues) === JSON.stringify(issues))
                return structuredClone(latest);
            if (!view.canReview)
                throw new Error('Versi ini tidak lagi menunggu pemeriksaan. Muat ulang paket terbaru.');
            if (input.outcome === 'complete') {
                if (!keys.every(k => input.checks[k]) || Object.keys(issues).length)
                    throw new Error('Konfirmasi pemeriksaan seluruh komponen sebelum menandai lengkap.');
                const checklist = checklistFor(v.content, periodFor(a), available);
                if (checklist.some(c => !c.complete))
                    throw new Error('Bukti belum lengkap atau file belum tersedia. Minta pemilik memulihkan file atau ajukan perbaikan teknis.');
            }
            else {
                if (!Object.keys(issues).length)
                    throw new Error('Tuliskan alasan perbaikan untuk sedikitnya satu komponen.');
                if (keys.some(k => !input.checks[k] && !issues[k]))
                    throw new Error('Setiap komponen yang belum dapat diperiksa memerlukan alasan perbaikan.');
            }
            const review: CompletenessReview = { id: `review-${snapshot.data.reviews.length + 1}-${versionId}`, evidenceVersionId: versionId, outcome: input.outcome, checks: structuredClone(input.checks), issues, actorId: u.id, actorName: u.displayName, reviewedAt: snapshot.data.clockNow, fixture: false };
            snapshot.data.reviews.push(review);
            a.completeness = input.outcome;
            if (input.outcome === 'needs_correction') {
                const previousState = { moderation: a.moderation, publication: structuredClone(a.publication), assignmentIds: snapshot.data.assignments.filter(x => x.attemptId === a.id && x.active).map(x => x.id) };
                archiveWorkflow(snapshot.data, a.id, u.id, Object.entries(issues).map(([k, t]) => `${k}: ${t}`).join(' | '));
                a.moderation = 'none';
                a.packageStatus = 'revision_requested';
                const draft = snapshot.data.drafts.find(d => d.attemptId === a.id);
                const next = { attemptId: a.id, revision: (draft?.revision ?? v.sourceDraftRevision) + 1, updatedAt: snapshot.data.clockNow, content: structuredClone(v.content) };
                if (draft)
                    Object.assign(draft, next);
                else
                    snapshot.data.drafts.push(next);
                snapshot.data.assignments.filter(x => x.attemptId === a.id && x.active).forEach(x => { x.active = false; });
                const hadPublication = previousState.publication.status === 'published';
                if (hadPublication)
                    a.publication.status = 'withdrawn';
                const revisionEvent = addEvent(a, u, 'Perbaikan teknis diminta', Object.entries(issues).map(([k, t]) => `${k}: ${t}`).join(' | ') + (hadPublication ? ' | Publikasi versi lama ditarik; riwayat tetap tersimpan.' : ''), v);
                revisionEvent.previousState = previousState;
            }
            else {
                for (const kind of ['dosen', 'guru'] as const) {
                    const examiner = snapshot.data.users.find(x => x.role === 'penguji' && x.examinerKind === kind && x.active);
                    if (examiner && !snapshot.data.assignments.some(x => x.active && x.attemptId === a.id && x.evidenceVersion === v.version && x.kind === kind))
                        snapshot.data.assignments.push({ id: `${a.id}-v${v.version}-${kind}`, attemptId: a.id, examinerId: examiner.id, kind, active: true, evidenceVersion: v.version, assessmentStatus: 'not_started', finalVersion: null });
                }
                addEvent(a, u, 'Paket ditandai lengkap', 'Kelengkapan administratif; bukan nilai atau keputusan kelulusan.', v);
            }
            save();
            return structuredClone(review);
        },
        async registerLocalFile(attemptId: string, file: File) { const { u } = requireOwnEditable(attemptId), started = epoch; const meta = await files.register(file); if (started !== epoch || validUser(userId)?.id !== u.id) {
            keepFiles();
            throw new Error('Akun atau sesi berubah saat membaca file. Pilih file kembali.');
        } try {
            requireOwnEditable(attemptId);
        }
        catch (error) {
            keepFiles();
            throw error;
        } registered.set(meta.id, { attemptId, actorId: u.id, file: structuredClone(meta) }); return structuredClone(meta); },
        async restoreLocalFile(versionId: string, fileId: string, file: File) { const u = requireUser(), view = getEvidence(versionId); if (!view.canRestore)
            throw new Error('Hanya pemilik bukti yang dapat memilih ulang file final.'); const meta = allEvidenceFiles(view.version.content).find(f => f.id === fileId && f.source === 'local'); if (!meta)
            throw new Error('File lokal pada versi ini tidak ditemukan.'); const wasAvailable = available(meta); const started = epoch; await files.restore(meta, file); if (started !== epoch || validUser(userId)?.id !== u.id) {
            keepFiles(wasAvailable ? undefined : meta.id);
            throw new Error('Akun atau sesi berubah saat memulihkan file. Ulangi sebagai pemilik bukti.');
        } addEvent(findAttempt(view.attempt.id), u, 'File final dipulihkan', 'Isi file cocok dengan SHA-256 bukti final; snapshot tidak diubah.', view.version); save(); },
        getFileUrl(fileId: string) { const file = authorisedFile(fileId); return file ? files.url(file) : null; },
        fileAvailable(fileId: string) { const file = authorisedFile(fileId); return file ? available(file) : false; }
    };
}
export type MockService = ReturnType<typeof createMockService>;
