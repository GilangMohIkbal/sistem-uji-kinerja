import { computed, readonly, ref, shallowRef } from 'vue'
import { createMockService } from '~/services/mock'
import { createFileRegistry } from '~/services/files'
import { DEMO_ACCOUNTS } from '~/data/fixtures'
import { announcementsFor, homeFor } from '~/domain/selectors'
import type { ComponentId, EvidenceContent, ReviewInput, StorageLike } from '~/domain/types'
import type { AssessmentContent } from '~/domain/assessment-types'

export default defineNuxtPlugin(() => {
  // Accessing the storage property itself can throw in restricted browser contexts.
  function browserStorage(name: 'localStorage' | 'sessionStorage'): StorageLike | undefined {
    try { return window[name] } catch { return undefined }
  }
  const service = createMockService({ localStorage: browserStorage('localStorage'), sessionStorage: browserStorage('sessionStorage'), files: createFileRegistry() })
  const snapshot = shallowRef(service.getClientSnapshot())
  const user = ref(service.getUser())
  const notices = ref(service.getNotices())
  const unsavedChanges = ref(false)
  function confirmDiscardChanges() {
    if (!unsavedChanges.value) return true
    if (!window.confirm('Ada perubahan yang belum disimpan. Tinggalkan perubahan ini?')) return false
    unsavedChanges.value = false
    return true
  }
  function sync() {
    snapshot.value = service.getClientSnapshot()
    user.value = service.getUser()
    notices.value = service.getNotices()
  }
  function run<T>(operation: () => T): T {
    try { return operation() } finally { sync() }
  }
  async function runAsync<T>(operation: () => Promise<T>): Promise<T> {
    try { return await operation() } finally { sync() }
  }
  // Vue proxy objects never enter the serializable domain layer.
  const plain = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T
  const operationNames = ['getManagement', 'savePeriod', 'archivePeriod', 'deletePeriod', 'setModerationWindow', 'saveManagedUser', 'deleteManagedUser', 'enrollParticipant', 'previewAssignment', 'assignPair', 'getMonitoring', 'exportMonitoring', 'openModeration', 'listModerations', 'getModeration', 'respondModeration', 'closeModeration', 'previewPublication', 'publishResult', 'withdrawPublication', 'getPublications', 'getPublishedResults', 'listInterviews', 'saveInterview', 'saveAnnouncement', 'setAnnouncementStatus'] as const
  const readers = new Set<string>(['getManagement', 'previewAssignment', 'getMonitoring', 'exportMonitoring', 'listModerations', 'getModeration', 'previewPublication', 'getPublications', 'getPublishedResults', 'listInterviews'])
  const operations = Object.fromEntries(operationNames.map(name => [name, (...args: unknown[]) => {
    void snapshot.value
    const call = () => (service[name] as (...values: unknown[]) => unknown)(...plain(args))
    return readers.has(name) ? call() : run(call)
  }])) as Pick<typeof service, typeof operationNames[number]>
  return { provide: { ukin: {
    operations,
    snapshot: readonly(snapshot), user: readonly(user), notices: readonly(notices), accounts: DEMO_ACCOUNTS,
    unsavedChanges: readonly(unsavedChanges),
    setUnsavedChanges: (value: boolean) => { unsavedChanges.value = value },
    confirmDiscardChanges,
    home: computed(() => user.value ? homeFor(user.value) : '/login'),
    dashboard: computed(() => { void snapshot.value; return user.value ? service.getDashboard() : null }),
    announcements: computed(() => user.value ? announcementsFor(snapshot.value.data, user.value) : []),
    login: (email: string, password: string) => run(() => service.login(email, password)),
    switchAccount: (id: string) => run(() => service.switchAccount(id)),
    logout: () => run(() => service.logout()),
    reset: () => run(() => service.reset()),
    markAnnouncementRead: (id: string) => run(() => service.markAnnouncementRead(id)),
    setClock: (scenario: 'active' | 'closed') => run(() => service.setClock(scenario)),
    listAssignments: () => { void snapshot.value; return service.listAssignments() },
    getAssessment: (id: string) => { void snapshot.value; return service.getAssessment(id) },
    getAssessmentHistory: () => { void snapshot.value; return service.getAssessmentHistory() },
    listAssessmentProgress: () => { void snapshot.value; return service.listAssessmentProgress() },
    getAssessmentFileUrl: (id: string, fileId: string) => { void snapshot.value; return service.getAssessmentFileUrl(id, fileId) },
    saveAssessmentDraft: (id: string, input: AssessmentContent, revision: number) => run(() => service.saveAssessmentDraft(id, plain(input), revision)),
    previewAssessmentFinal: (id: string, revision: number) => service.previewAssessmentFinal(id, revision),
    finalizeAssessment: (id: string, revision: number, confirmed: boolean) => run(() => service.finalizeAssessment(id, revision, confirmed)),
    reportAssessmentIssue: (id: string, component: ComponentId, reason: string) => run(() => service.reportAssessmentIssue(id, component, reason)),
    resolveAssessmentIssue: (id: string, issueId: string, reason: string) => run(() => service.resolveAssessmentIssue(id, issueId, reason)),
    grantAssessmentRevision: (id: string, version: number, reason: string) => run(() => service.grantAssessmentRevision(id, version, reason)),
    beginAssessmentRevision: (id: string, version: number, reason: string) => run(() => service.beginAssessmentRevision(id, version, reason)),
    getPackage: (id?: string) => { void snapshot.value; return service.getPackage(id) },
    getEvidence: (id: string) => { void snapshot.value; return service.getEvidence(id) },
    listSubmittedPackages: () => { void snapshot.value; return service.listSubmittedPackages() },
    listMyAttempts: () => { void snapshot.value; return service.listMyAttempts() },
    previewContent: (id: string, content: EvidenceContent) => { void snapshot.value; return service.previewContent(id, plain(content)) },
    getFileUrl: (id: string) => { void snapshot.value; return service.getFileUrl(id) },
    fileAvailable: (id: string) => { void snapshot.value; return service.fileAvailable(id) },
    saveDraft: (id: string, content: EvidenceContent, revision: number) => run(() => service.saveDraft(id, plain(content), revision)),
    submitPackage: (id: string, revision: number, confirmed: boolean) => run(() => service.submitPackage(id, revision, confirmed)),
    reviewPackage: (id: string, input: ReviewInput) => run(() => service.reviewPackage(id, plain(input))),
    registerLocalFile: (id: string, file: File) => runAsync(() => service.registerLocalFile(id, file)),
    restoreLocalFile: (versionId: string, fileId: string, file: File) => runAsync(() => service.restoreLocalFile(versionId, fileId, file))
  } } }
})
