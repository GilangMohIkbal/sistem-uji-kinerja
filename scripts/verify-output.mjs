import assert from 'node:assert/strict'
import { access, readFile, readdir } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { createHash } from 'node:crypto'

const output = fileURLToPath(new URL('../.output/public/', import.meta.url))
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return (await Promise.all(entries.map(entry => entry.isDirectory() ? walk(path.join(dir, entry.name)) : path.join(dir, entry.name)))).flat()
}
await access(path.join(output, 'index.html'))
await access(path.join(output, '200.html'))
await access(path.join(output, 'favicon.svg'))
for (const route of ['login', 'app/peserta', 'app/penguji', 'app/pengelola', 'app/panduan', 'app/paket', 'app/bukti-kirim', 'app/pemeriksaan', 'app/bukti', 'app/penugasan', 'app/penilaian', 'app/riwayat', 'app/progres-penilaian', 'app/pengelolaan', 'app/monitoring', 'app/moderasi', 'app/publikasi', 'app/hasil', 'app/wawancara']) {
  await access(path.join(output, route, 'index.html'))
}
for (const sample of ['perangkat-pembelajaran.pdf', 'lkpd-pecahan.pdf', 'studi-kasus.pdf']) {
  const source = await readFile(fileURLToPath(new URL(`../public/samples/${sample}`, import.meta.url)))
  const built = await readFile(path.join(output, 'samples', sample))
  assert.equal(createHash('sha256').update(built).digest('hex'), createHash('sha256').update(source).digest('hex'), `Changed sample asset: ${sample}`)
}
const files = await walk(output)
assert.ok(files.some(file => file.endsWith('.js')), 'No application JavaScript generated')
assert.ok(files.some(file => file.endsWith('.css')), 'No application CSS generated')
assert.ok(!files.some(file => /screenshots|lms-landing|national-assessment/.test(file)), 'Reference screenshots must not be published')
let checked = 0
for (const file of files.filter(file => /\.(html|css)$/.test(file))) {
  const source = await readFile(file, 'utf8')
  const references = file.endsWith('.html')
    ? [...source.matchAll(/<(?:script|link|img)\b[^>]*?\b(?:src|href)=["']([^"']+)["']/g)].map(match => match[1])
    : [...source.matchAll(/url\(\s*["']?([^\s)"']+)["']?\s*\)/g)].map(match => match[1])
  for (const reference of references) {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(reference)) continue
    const clean = decodeURIComponent(reference.split(/[?#]/)[0])
    if (!clean) continue
    const target = path.resolve(clean.startsWith('/') ? output : path.dirname(file), clean.replace(/^\/+/, ''))
    const relative = path.relative(output, target)
    assert.ok(relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative), 'Asset escapes output')
    await access(target)
    checked++
  }
}
console.log(`Static output passed: ${files.length} files and ${checked} local asset references. Browser behavior and hosting route fallback still require verification.`)
