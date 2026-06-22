import { useAuthStore } from '@/stores/auth'

export interface KnowHubReportResponse {
  workspace_id: string
  report: string
}

function getKnowHubBackendBaseUrl(): string {
  return (import.meta.env.VITE_KNOW_HUB_BACKEND_BASE_URL || '').replace(/\/$/, '')
}

function getKnowHubRole(authStore: ReturnType<typeof useAuthStore>): 'admin' | 'customer' {
  return authStore.isSystemAdmin || authStore.canAccessAllTenants ? 'admin' : 'customer'
}

async function requestKnowHub<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()
  const tenantId = authStore.effectiveTenantId || authStore.currentTenantId
  const token = authStore.token || localStorage.getItem('weknora_token') || ''
  const url = `${getKnowHubBackendBaseUrl()}${path}`
  const headers = new Headers(init.headers)

  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (tenantId) {
    headers.set('X-Tenant-ID', String(tenantId))
    headers.set('X-WeKnora-Tenant-Id', String(tenantId))
  }
  if (authStore.currentUserId) headers.set('X-WeKnora-User-Id', String(authStore.currentUserId))
  if (authStore.user?.username) headers.set('X-WeKnora-User-Name', authStore.user.username)
  headers.set('X-Know-Hub-Role', getKnowHubRole(authStore))

  const response = await fetch(url, {
    ...init,
    headers,
  })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}))
    throw new Error(payload.detail || payload.message || `Know Hub request failed: ${response.status}`)
  }
  return response.json() as Promise<T>
}

export function getCurrentTenantReport(): Promise<KnowHubReportResponse> {
  return requestKnowHub<KnowHubReportResponse>('/api/v1/report')
}

export function bootstrapKnowHubWorkspace() {
  return requestKnowHub('/api/v1/me/bootstrap', { method: 'POST' })
}
