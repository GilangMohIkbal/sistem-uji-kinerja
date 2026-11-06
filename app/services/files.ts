import { SAMPLE_FILES, sampleUrl } from '../data/sample-files.ts'
import type { EvidenceFile, FileRuntime } from '../domain/types.ts'

export const MAX_FILE_BYTES = 10 * 1024 * 1024
const allowed = new Map([
  ['application/pdf', ['pdf']],
  ['image/png', ['png']],
  ['image/jpeg', ['jpg', 'jpeg']],
])

interface LocalEntry { metadata: EvidenceFile; url: string }

async function inspect(file: File): Promise<{ bytes: ArrayBuffer; mime: string }> {
  if (!file || typeof file.arrayBuffer !== 'function' || typeof file.name !== 'string') throw new Error('Pilih berkas dari perangkat terlebih dahulu.')
  if (!Number.isInteger(file.size) || file.size <= 0 || file.size > MAX_FILE_BYTES) throw new Error('Ukuran berkas harus lebih dari 0 dan paling besar 10 MiB (batas teknis demo).')
  const bytes = await file.arrayBuffer()
  if (bytes.byteLength !== file.size) throw new Error('Isi berkas tidak dapat dibaca secara lengkap. Pilih ulang berkas.')
  const header = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 12))
  const mime = header[0] === 0x25 && header[1] === 0x50 && header[2] === 0x44 && header[3] === 0x46 && header[4] === 0x2d
    ? 'application/pdf'
    : [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => header[index] === byte)
      ? 'image/png'
      : header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff ? 'image/jpeg' : ''
  const extension = file.name.split('.').pop()?.toLowerCase() ?? ''
  if (!mime || !allowed.get(mime)?.includes(extension) || (file.type && file.type.toLowerCase() !== mime)) {
    throw new Error('Gunakan PDF, PNG, atau JPEG dengan jenis, ekstensi, dan penanda isi yang sesuai. HTML atau script tidak didukung.')
  }
  return { bytes, mime }
}

async function digest(bytes: ArrayBuffer): Promise<string | null> {
  try {
    if (!globalThis.crypto?.subtle) return null
    const result = await globalThis.crypto.subtle.digest('SHA-256', bytes)
    return [...new Uint8Array(result)].map(byte => byte.toString(16).padStart(2, '0')).join('')
  } catch { return null }
}

function sameMetadata(first: EvidenceFile, second: EvidenceFile): boolean {
  return first.id === second.id && first.source === second.source && first.name === second.name
    && first.mime === second.mime && first.size === second.size && first.sha256 === second.sha256 && first.sampleId === second.sampleId
}

/** Runtime-only file contents. JSON snapshots contain metadata and digests, never blob URLs. */
export function createFileRegistry(): FileRuntime {
  const local = new Map<string, LocalEntry>()
  let serial = 0
  let generation = 0
  // IDs are only local references, never credentials or security tokens.
  const prefix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
  function resolve(metadata: EvidenceFile): string | null {
    if (metadata.source === 'sample') {
      const sample = SAMPLE_FILES.find(item => item.id === metadata.id)
      return sample && sameMetadata(sample, metadata) ? sampleUrl(sample.sampleId ?? sample.id) : null
    }
    const entry = local.get(metadata.id)
    return entry && sameMetadata(entry.metadata, metadata) ? entry.url : null
  }
  function revoke(id: string) {
    const entry = local.get(id)
    if (entry) { URL.revokeObjectURL(entry.url); local.delete(id) }
  }
  return {
    async register(file: File): Promise<EvidenceFile> {
      const startedAt = generation
      const { bytes, mime } = await inspect(file)
      const sha256 = await digest(bytes)
      if (generation !== startedAt) throw new Error('Demo telah direset saat berkas dibaca. Pilih berkas kembali.')
      const metadata: EvidenceFile = { id: `local-${prefix}-${++serial}`, source: 'local', name: file.name, mime, size: file.size, sha256 }
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
      local.set(metadata.id, { metadata: { ...metadata }, url })
      return { ...metadata }
    },
    async restore(metadata: EvidenceFile, file: File): Promise<void> {
      const startedAt = generation
      if (metadata.source !== 'local' || !metadata.sha256 || !/^[a-f0-9]{64}$/i.test(metadata.sha256)) {
        throw new Error('Bukti ini tidak memiliki sidik isi SHA-256 untuk pemulihan. Minta revisi paket; nama dan ukuran tidak membuktikan isi yang sama.')
      }
      const { bytes, mime } = await inspect(file)
      const sha256 = await digest(bytes)
      if (generation !== startedAt) throw new Error('Demo telah direset saat berkas dibaca. Pilih berkas kembali.')
      if (!sha256) throw new Error('Browser tidak dapat menghitung SHA-256. Pemulihan bukti final ditahan; gunakan browser yang mendukung atau minta revisi paket.')
      if (sha256.toLowerCase() !== metadata.sha256.toLowerCase() || mime !== metadata.mime || bytes.byteLength !== metadata.size) {
        throw new Error('Isi berkas berbeda dari bukti yang dikirim. Bukti final tidak diganti; perubahan isi memerlukan revisi paket.')
      }
      const url = URL.createObjectURL(new Blob([bytes], { type: mime }))
      revoke(metadata.id)
      local.set(metadata.id, { metadata: { ...metadata }, url })
    },
    available(metadata: EvidenceFile): boolean { return resolve(metadata) !== null },
    url(metadata: EvidenceFile): string | null { return resolve(metadata) },
    retain(ids: string[]): void {
      const referenced = new Set(ids)
      for (const id of local.keys()) if (!referenced.has(id)) revoke(id)
    },
    clear(): void { generation++; for (const id of [...local.keys()]) revoke(id) },
  }
}
