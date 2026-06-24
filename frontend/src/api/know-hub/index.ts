import { useAuthStore } from '@/stores/auth'

export interface KnowHubReportResponse {
  workspace_id: string
  report: string
}

export interface KnowHubWorkspaceSummary {
  id: string
  name: string
  workspace_type: string
  owner_name: string
  status: string
}

export interface KnowHubAdminReport {
  workspace: KnowHubWorkspaceSummary
  report: string
  error: string
}

export interface KnowHubAdminReportsResponse {
  reports: KnowHubAdminReport[]
}

function getKnowHubBackendBaseUrl(): string {
  return (import.meta.env.VITE_KNOW_HUB_BACKEND_BASE_URL || '').replace(/\/$/, '')
}

async function requestKnowHub<T>(path: string, init: RequestInit = {}): Promise<T> {
  const authStore = useAuthStore()

  // 改进的 tenantId 获取逻辑
  let tenantId: string | null = null

  // 优先使用 effectiveTenantId，如果为 null/undefined，尝试其他方式
  if (authStore.effectiveTenantId) {
    tenantId = String(authStore.effectiveTenantId)
  } else if (authStore.currentTenantId) {
    tenantId = String(authStore.currentTenantId)
  } else if (authStore.tenant?.id) {
    tenantId = String(authStore.tenant.id)
  }

  // 如果还是没有找到，尝试从 localStorage 读取
  if (!tenantId) {
    const selectedTenantId = localStorage.getItem('weknora_selected_tenant_id')
    const currentTenantId = localStorage.getItem('weknora_current_tenant_id')
    tenantId = selectedTenantId || currentTenantId || null
  }

  const token = authStore.token || localStorage.getItem('weknora_token') || ''
  const url = `${getKnowHubBackendBaseUrl()}${path}`
  const headers = new Headers(init.headers)

  if (token) headers.set('Authorization', `Bearer ${token}`)

  // 确保设置 X-Tenant-ID 和 X-WeKnora-Tenant-Id
  if (tenantId) {
    headers.set('X-Tenant-ID', tenantId)
    headers.set('X-WeKnora-Tenant-Id', tenantId)
  } else {
    // 如果还是没有 tenantId，记录警告
    console.warn('No tenant ID found for Know Hub request, this may cause authentication failures')
  }

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

export function getAdminReports(): Promise<KnowHubAdminReportsResponse> {
  return requestKnowHub<KnowHubAdminReportsResponse>('/api/v1/admin/reports')
}

export function bootstrapKnowHubWorkspace() {
  return requestKnowHub('/api/v1/me/bootstrap', { method: 'POST' })
}

export interface KnowHubWorkspaceDetail {
  id: string
  name: string
  workspace_type: string
  owner_name: string
  owner_contact: string
  status: string
  description: string
  total_quota: number | null
  consumed_quota: number | null
  reserved_quota: number | null
  metadata: Record<string, any>
  created_at: string | null
}

export function getAdminWorkspaces(): Promise<KnowHubWorkspaceDetail[]> {
  return requestKnowHub<KnowHubWorkspaceDetail[]>('/api/v1/admin/workspaces')
}

export interface KnowHubAuditLog {
  id: string
  admin_user_id: string
  admin_user_name: string
  admin_tenant_id: string
  action: string
  resource_type: string
  resource_id: string | null
  target_tenant_id: string | null
  target_workspace_id: string | null
  request_method: string
  request_path: string
  request_params: Record<string, any>
  user_agent: string | null
  ip_address: string | null
  response_status: string
  error_message: string | null
  created_at: string | null
}

export interface KnowHubAuditLogPage {
  items: KnowHubAuditLog[]
  total: number
}

export interface KnowHubAuditLogQuery {
  action?: string
  admin_user_id?: string
  limit?: number
  offset?: number
}

export function getAdminAuditLogs(params: KnowHubAuditLogQuery = {}): Promise<KnowHubAuditLogPage> {
  const qs = new URLSearchParams()
  if (params.action) qs.set('action', params.action)
  if (params.admin_user_id) qs.set('admin_user_id', params.admin_user_id)
  if (params.limit != null) qs.set('limit', String(params.limit))
  if (params.offset != null) qs.set('offset', String(params.offset))
  const query = qs.toString()
  return requestKnowHub<KnowHubAuditLogPage>(`/api/v1/admin/audit-logs${query ? `?${query}` : ''}`)
}
