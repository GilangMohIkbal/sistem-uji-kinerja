import assert from 'node:assert/strict'
import test from 'node:test'
import { ACTIVE_CLOCK, CLOSED_CLOCK, DEMO_ACCOUNTS, DEMO_PASSWORD, createSeed } from '../app/data/fixtures.ts'
import { announcementsFor, dashboardFor } from '../app/domain/selectors.ts'
import { createMockService, SESSION_KEY, STATE_KEY } from '../app/services/mock.ts'
import type { StorageLike } from '../app/domain/types.ts'

function storage(): StorageLike & { items: Map<string, string> } {
  const items = new Map<string, string>()
  return { items, getItem: (key) => items.get(key) ?? null, setItem: (key, value) => { items.set(key, value) }, removeItem: (key) => { items.delete(key) } }
}

test('four demo accounts authenticate; failed credentials and fixture-only accounts are rejected', () => {
  const service = createMockService({ localStorage: storage(), sessionStorage: storage() })
  for (const account of DEMO_ACCOUNTS) assert.equal(service.login(` ${account.email.toUpperCase()} `, DEMO_PASSWORD).id, account.id)
  assert.throws(() => service.login('peserta@demo.invalid', 'wrong'))
  assert.throws(() => service.login('peserta2@fixture.invalid', DEMO_PASSWORD))
  service.logout()
  assert.throws(() => service.switchAccount('penguji-dosen'))
  assert.equal(service.getUser(), null)
})

test('account switch, logout and refresh preserve shared data and isolate read markers by identity', () => {
  const localStorage = storage(); const sessionStorage = storage()
  const service = createMockService({ localStorage, sessionStorage })
  const participant = service.login('peserta@demo.invalid', DEMO_PASSWORD)
  service.markAnnouncementRead('welcome')
  service.markAnnouncementRead('welcome')
  const before = service.getSnapshot()
  const examiner = service.switchAccount('penguji-dosen')
  assert.deepEqual(service.getSnapshot(), before)
  assert.equal(announcementsFor(service.getSnapshot().data, examiner)[0]!.read, false)
  assert.equal(announcementsFor(service.getSnapshot().data, participant)[0]!.read, true)
  assert.equal(service.getSnapshot().data.readMarkers.length, 1)
  const restored = createMockService({ localStorage, sessionStorage })
  assert.equal(restored.getUser()?.id, examiner.id)
  assert.deepEqual(restored.getSnapshot(), before)
  assert.equal(sessionStorage.getItem(SESSION_KEY)?.includes(DEMO_PASSWORD), false)
  restored.logout()
  assert.deepEqual(restored.getSnapshot(), before)
})

test('reset clears only the two exact UKIN keys, restores seed and logs out', () => {
  const localStorage = storage(); const sessionStorage = storage()
  for (const key of ['ppg-unj-lms:v1:state', 'ppg-unj-ukin:v2:state', 'unrelated']) localStorage.setItem(key, 'keep')
  sessionStorage.setItem('ppg-unj-lms:v1:session', 'keep')
  const service = createMockService({ localStorage, sessionStorage })
  service.login('pengelola@demo.invalid', DEMO_PASSWORD)
  service.setClock('closed')
  service.markAnnouncementRead('welcome')
  service.reset()
  assert.deepEqual(service.getSnapshot(), createSeed())
  assert.equal(service.getUser(), null)
  assert.equal(sessionStorage.getItem(SESSION_KEY), null)
  for (const key of ['ppg-unj-lms:v1:state', 'ppg-unj-ukin:v2:state', 'unrelated']) assert.equal(localStorage.getItem(key), 'keep')
  assert.equal(sessionStorage.getItem('ppg-unj-lms:v1:session'), 'keep')
})

test('corrupt, incompatible and incomplete snapshots are retained until explicit reset', () => {
  for (const raw of ['{broken', JSON.stringify({ ...createSeed(), schemaVersion: 999 }), JSON.stringify({ ...createSeed(), data: {} }), JSON.stringify({ ...createSeed(), seedVersion: 'future' })]) {
    const localStorage = storage(); const sessionStorage = storage()
    localStorage.setItem(STATE_KEY, raw)
    const service = createMockService({ localStorage, sessionStorage })
    assert.ok(service.getNotices().length)
    service.login('peserta@demo.invalid', DEMO_PASSWORD)
    service.markAnnouncementRead('welcome')
    assert.equal(localStorage.getItem(STATE_KEY), raw)
    service.reset()
    assert.deepEqual(JSON.parse(localStorage.getItem(STATE_KEY)!), createSeed())
    assert.equal(service.getNotices().length, 0)
  }
})

test('invalid nested schema and dangling references cannot crash dashboards', () => {
  const bad = createSeed()
  bad.data.attempts[0]!.participantId = 'missing'
  const localStorage = storage()
  localStorage.setItem(STATE_KEY, JSON.stringify(bad))
  const service = createMockService({ localStorage, sessionStorage: storage() })
  assert.ok(service.getNotices().length)
  const user = service.login('peserta@demo.invalid', DEMO_PASSWORD)
  assert.equal(dashboardFor(service.getSnapshot().data, user).rows.length, 1)
})

test('blocked or quota-full storage uses memory with a visible notice', () => {
  const blocked: StorageLike = { getItem() { throw new Error('blocked') }, setItem() { throw new Error('blocked') }, removeItem() { throw new Error('blocked') } }
  const quota: StorageLike = { ...storage(), setItem() { throw new Error('quota') } }
  for (const localStorage of [blocked, quota, undefined]) {
    const service = createMockService({ localStorage, sessionStorage: blocked })
    service.login('peserta@demo.invalid', DEMO_PASSWORD)
    service.markAnnouncementRead('welcome')
    assert.equal(service.getSnapshot().data.readMarkers.length, 1)
    assert.ok(service.getNotices().length)
    assert.doesNotThrow(() => service.reset())
    assert.equal(service.getSnapshot().data.readMarkers.length, 0)
  }
})

test('clock scenarios are shared and only pengelola can change them', () => {
  const service = createMockService({ localStorage: storage(), sessionStorage: storage() })
  const participant = service.login('peserta@demo.invalid', DEMO_PASSWORD)
  assert.throws(() => service.setClock('closed'))
  assert.equal(service.getSnapshot().data.clockNow, ACTIVE_CLOCK)
  assert.equal(dashboardFor(service.getSnapshot().data, participant).collectionOpen, true)
  service.switchAccount('pengelola-1')
  service.setClock('closed')
  service.switchAccount(participant.id)
  assert.equal(service.getSnapshot().data.clockNow, CLOSED_CLOCK)
  assert.equal(dashboardFor(service.getSnapshot().data, participant).collectionOpen, false)
  assert.equal(dashboardFor(service.getSnapshot().data, participant).assessmentOpen, false)
})

test('dashboards derive counts and exclude archived attempts and other examiner statuses', () => {
  const seed = createSeed()
  const dosen = DEMO_ACCOUNTS.find((u) => u.examinerKind === 'dosen')!
  const guru = DEMO_ACCOUNTS.find((u) => u.examinerKind === 'guru')!
  const manager = DEMO_ACCOUNTS.find((u) => u.role === 'pengelola')!
  assert.equal(dashboardFor(seed.data, manager).metrics[0]!.value, 6)
  assert.equal(dashboardFor(seed.data, dosen).metrics[2]!.value, 2)
  assert.equal(dashboardFor(seed.data, guru).metrics[2]!.value, 1)
  assert.equal(dashboardFor(seed.data, guru).rows.find((r) => r.id === 'attempt-4')!.assessmentStatus, 'not_started')
  seed.data.assignments.find((a) => a.id === 'attempt-4-guru')!.assessmentStatus = 'draft'
  assert.equal(dashboardFor(seed.data, dosen).rows.find((r) => r.id === 'attempt-4')!.assessmentStatus, 'final')
  seed.data.drafts[0]!.content.mainDocument = structuredClone(seed.data.evidenceVersions[0]!.content.mainDocument)
  assert.equal(dashboardFor(seed.data, DEMO_ACCOUNTS[0]!).metrics[0]!.value, 2)
})

test('participant sees only their own row and deliberately published feedback', () => {
  const seed = createSeed()
  const participant = DEMO_ACCOUNTS[0]!
  const mine = seed.data.attempts[0]!
  mine.publication.feedback = 'Internal feedback must remain hidden'
  assert.equal(dashboardFor(seed.data, participant).publishedFeedback, null)
  assert.deepEqual(dashboardFor(seed.data, participant).rows.map((r) => r.id), ['attempt-1'])
  mine.publication.status = 'published'
  mine.publication.version = 1
  // Stage 4 requires an actual publication snapshot; legacy metadata alone cannot release feedback.
  assert.equal(dashboardFor(seed.data, participant).publishedFeedback, null)
  assert.equal(dashboardFor(seed.data, participant).metrics[2]!.value, 0)
  mine.publication.status = 'withdrawn'
  assert.equal(dashboardFor(seed.data, participant).publishedFeedback, null)
  assert.throws(() => dashboardFor(seed.data, { ...participant, role: 'pengelola' }))
  assert.deepEqual(announcementsFor(seed.data, { ...participant, role: 'pengelola' }), [])
})

test('session data is validated and mutations cannot escape through returned copies', () => {
  const localStorage = storage(); const sessionStorage = storage()
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, userId: 'peserta-2' }))
  const service = createMockService({ localStorage, sessionStorage })
  assert.equal(service.getUser(), null)
  service.login('peserta@demo.invalid', DEMO_PASSWORD)
  assert.throws(() => service.markAnnouncementRead('independent-review'))
  const snapshot = service.getSnapshot()
  snapshot.data.users[0]!.role = 'pengelola'
  assert.equal(service.getUser()?.role, 'peserta')
  assert.throws(() => service.setClock('closed'))
})

test('failed session update removes the stale account when possible', () => {
  const backing = storage()
  const sessionStorage: StorageLike = { ...backing, setItem() { throw new Error('quota') } }
  backing.setItem(SESSION_KEY, JSON.stringify({ schemaVersion: 1, userId: 'penguji-dosen' }))
  const service = createMockService({ localStorage: storage(), sessionStorage })
  service.switchAccount('penguji-guru')
  assert.equal(service.getUser()?.id, 'penguji-guru')
  assert.equal(backing.getItem(SESSION_KEY), null)
  assert.ok(service.getNotices().some((notice) => notice.includes('masuk kembali')))
})
