import type { ChecklistItem, EvidenceContent, EvidenceFile, Period } from './types.ts';
import { SAMPLE_FILES } from '../data/sample-files.ts';
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
export const MAX_TEXT_LENGTH = 10000;
export const DEMO_VIDEO_URL = 'https://www.youtube.com/watch?v=M7lc1UVf-VE';
export function normalizeYouTubeUrl(input: string): {
    videoId: string;
    url: string;
} | null {
    const raw = input.trim();
    if (!raw)
        return null;
    let parsed: URL;
    try {
        parsed = new URL(raw);
    }
    catch {
        throw new Error('Gunakan tautan HTTPS YouTube yang lengkap.');
    }
    if (parsed.protocol !== 'https:' || parsed.username || parsed.password || parsed.port)
        throw new Error('Tautan video harus HTTPS YouTube tanpa akun atau port khusus.');
    const host = parsed.hostname.toLowerCase();
    let id: string | null = null;
    if (host === 'youtu.be') {
        if (/^\/[\w-]{11}\/?$/.test(parsed.pathname))
            id = parsed.pathname.split('/')[1] ?? null;
    }
    else if (['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(host)) {
        if (parsed.pathname === '/watch' && parsed.searchParams.getAll('v').length === 1)
            id = parsed.searchParams.get('v');
        else if (/^\/embed\/[\w-]{11}\/?$/.test(parsed.pathname))
            id = parsed.pathname.split('/')[2] ?? null;
    }
    if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id))
        throw new Error('Gunakan youtube.com/watch?v=, youtu.be/, atau youtube.com/embed/ dengan ID video yang valid.');
    return { videoId: id, url: `https://www.youtube.com/watch?v=${id}` };
}
export function emptyEvidenceContent(source: Period['caseStudySource'] = 'participant_report'): EvidenceContent {
    return { mainDocument: null, attachments: [], video: { full: '', summary: '' }, caseStudy: { mode: source === 'exam_snapshot' ? 'exam_snapshot' : 'text', context: '', action: '', result: '', reflection: '', document: null, provenance: source === 'exam_snapshot' ? 'Simulasi snapshot web ujian; tidak terhubung ke sistem ujian nyata.' : null } };
}
export function allEvidenceFiles(content: EvidenceContent): EvidenceFile[] { return [content.mainDocument, ...content.attachments, content.caseStudy.document].filter((file): file is EvidenceFile => Boolean(file)); }
export function isFileMetadata(value: unknown): value is EvidenceFile {
    if (!value || typeof value !== 'object')
        return false;
    const v = value as EvidenceFile;
    if (typeof v.id !== 'string' || !v.id || !['sample', 'local'].includes(v.source) || typeof v.name !== 'string' || !v.name || v.name.length > 255 || !['application/pdf', 'image/png', 'image/jpeg'].includes(v.mime) || !Number.isInteger(v.size) || v.size <= 0 || v.size > MAX_FILE_SIZE || !(v.sha256 === null || typeof v.sha256 === 'string' && /^[a-f0-9]{64}$/.test(v.sha256)))
        return false;
    const extensions: Record<string, RegExp> = { 'application/pdf': /\.pdf$/i, 'image/png': /\.png$/i, 'image/jpeg': /\.jpe?g$/i };
    if (!extensions[v.mime]!.test(v.name))
        return false;
    if (v.source === 'sample')
        return SAMPLE_FILES.some(s => s.id === v.id && s.sampleId === v.sampleId && s.name === v.name && s.mime === v.mime && s.size === v.size && s.sha256 === v.sha256);
    return v.sampleId === undefined;
}
export function isEvidenceContent(value: unknown): value is EvidenceContent {
    if (!value || typeof value !== 'object')
        return false;
    const v = value as EvidenceContent;
    if (!(v.mainDocument === null || isFileMetadata(v.mainDocument)) || !Array.isArray(v.attachments) || v.attachments.length > 10 || !v.attachments.every(isFileMetadata) || !v.video || typeof v.video.full !== 'string' || typeof v.video.summary !== 'string' || !v.caseStudy)
        return false;
    const c = v.caseStudy;
    return ['text', 'document', 'exam_snapshot'].includes(c.mode) && [c.context, c.action, c.result, c.reflection].every(t => typeof t === 'string' && t.length <= MAX_TEXT_LENGTH) && (c.document === null || isFileMetadata(c.document)) && (c.provenance === null || typeof c.provenance === 'string' && c.provenance.length <= MAX_TEXT_LENGTH);
}
export function normalizeEvidenceContent(input: EvidenceContent, period: Period): EvidenceContent {
    if (!isEvidenceContent(input))
        throw new Error('Isi paket atau metadata file tidak valid. Batas teknis: 10 MiB per file, 10 lampiran, 10.000 karakter per bagian laporan.');
    const content = structuredClone(input);
    if (content.mainDocument && content.mainDocument.mime !== 'application/pdf')
        throw new Error('Dokumen utama perangkat harus berupa PDF.');
    if (content.caseStudy.document && content.caseStudy.document.mime !== 'application/pdf')
        throw new Error('Dokumen studi kasus harus berupa PDF.');
    const files = allEvidenceFiles(content);
    if (new Set(content.attachments.map(f => f.id)).size !== content.attachments.length)
        throw new Error('Lampiran yang sama tidak perlu ditambahkan dua kali.');
    for (const slot of ['full', 'summary'] as const)
        content.video[slot] = normalizeYouTubeUrl(content.video[slot])?.url ?? '';
    if (period.caseStudySource === 'exam_snapshot' && content.caseStudy.mode !== 'exam_snapshot')
        throw new Error('Studi kasus periode ini berasal dari snapshot ujian simulasi dan tidak dapat diubah.');
    if (period.caseStudySource === 'participant_report' && content.caseStudy.mode === 'exam_snapshot')
        throw new Error('Periode ini menggunakan laporan peserta.');
    if (files.some(f => f.source === 'local' && typeof f.sampleId === 'string'))
        throw new Error('Referensi file lokal tidak valid.');
    return content;
}
export function checklistFor(content: EvidenceContent, period: Period, available: (file: EvidenceFile) => boolean = (file) => file.source === 'sample'): ChecklistItem[] {
    const documentIssues: string[] = [];
    const videoIssues: string[] = [];
    const caseIssues: string[] = [];
    function inspect(file: EvidenceFile | null, issues: string[], required: boolean) {
        if (!file) {
            if (required)
                issues.push('Dokumen wajib belum dipilih.');
            return;
        }
        if (!available(file))
            issues.push(`${file.name}: file lokal perlu dipilih ulang.`);
        if (file.source === 'local' && !file.sha256)
            issues.push(`${file.name}: digest tidak tersedia; gunakan dokumen contoh untuk pengiriman final.`);
    }
    inspect(content.mainDocument, documentIssues, true);
    content.attachments.forEach(file => inspect(file, documentIssues, false));
    for (const [slot, required, label] of [['full', period.requirements.fullVideo, 'Video utuh'], ['summary', period.requirements.summaryVideo, 'Video ringkasan']] as const) {
        try {
            if (!normalizeYouTubeUrl(content.video[slot]) && required)
                videoIssues.push(`${label} wajib diisi.`);
        }
        catch (error) {
            videoIssues.push(`${label}: ${error instanceof Error ? error.message : 'tautan tidak valid'}`);
        }
    }
    if (content.caseStudy.mode === 'document')
        inspect(content.caseStudy.document, caseIssues, true);
    else
        for (const [key, label] of [['context', 'Konteks dan masalah'], ['action', 'Tindakan'], ['result', 'Bukti atau hasil'], ['reflection', 'Refleksi dan tindak lanjut']] as const)
            if (!content.caseStudy[key].trim())
                caseIssues.push(`${label} belum diisi.`);
    if (period.caseStudySource === 'exam_snapshot' && !content.caseStudy.provenance)
        caseIssues.push('Sumber snapshot simulasi belum tersedia.');
    return [{ id: 'perangkat', label: 'Perangkat pembelajaran', complete: documentIssues.length === 0, issues: documentIssues }, { id: 'video', label: 'Video praktik pembelajaran', complete: videoIssues.length === 0, issues: videoIssues }, { id: 'studi_kasus', label: 'Studi kasus', complete: caseIssues.length === 0, issues: caseIssues }];
}
export function contentReadiness(content: EvidenceContent, period: Period) { return Object.fromEntries(checklistFor(content, period, () => true).map(c => [c.id, c.complete])) as Record<'perangkat' | 'video' | 'studi_kasus', boolean>; }
export function collectionOpen(period: Period, now: string) { return !period.archived && Date.parse(now) >= Date.parse(period.collectionOpensAt) && Date.parse(now) <= Date.parse(period.collectionClosesAt); }
