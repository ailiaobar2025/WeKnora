import { useAuthStore } from '@/stores/auth'
import { getStoredEffectiveTenantId } from '@/utils/tenantContext.ts'

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
  const tenantId =
    getStoredEffectiveTenantId() ||
    (authStore.effectiveTenantId ? String(authStore.effectiveTenantId) : null)

  const token = authStore.token || localStorage.getItem('weknora_token') || ''
  const url = `${getKnowHubBackendBaseUrl()}${path}`
  const headers = new Headers(init.headers)

  if (token) headers.set('Authorization', `Bearer ${token}`)

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
  if (response.status === 204) {
    return undefined as T
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

export type JsonObject = Record<string, any>

export interface KnowHubAgentTemplate {
  id: string
  name: string
  description: string
  system_prompt: string
  knowledge_scope: JsonObject
  agent_config: JsonObject
  quota_strategy: JsonObject
  status: string
  created_at: string | null
  updated_at: string | null
}

export interface KnowHubAgentTemplatePayload {
  name: string
  description?: string
  system_prompt?: string
  knowledge_scope?: JsonObject
  agent_config?: JsonObject
  quota_strategy?: JsonObject
  status?: string
}

export function getAgentTemplates(): Promise<KnowHubAgentTemplate[]> {
  return requestKnowHub<KnowHubAgentTemplate[]>('/api/v1/admin/agent-templates')
}

export function createAgentTemplate(payload: KnowHubAgentTemplatePayload): Promise<KnowHubAgentTemplate> {
  return requestKnowHub<KnowHubAgentTemplate>('/api/v1/admin/agent-templates', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function updateAgentTemplate(
  templateId: string,
  payload: Partial<KnowHubAgentTemplatePayload>,
): Promise<KnowHubAgentTemplate> {
  return requestKnowHub<KnowHubAgentTemplate>(`/api/v1/admin/agent-templates/${templateId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteAgentTemplate(templateId: string): Promise<void> {
  return requestKnowHub<void>(`/api/v1/admin/agent-templates/${templateId}`, {
    method: 'DELETE',
  })
}

export interface KnowHubCustomerAssistant {
  id: string
  workspace_id: string
  template_id: string
  template_name?: string
  name: string
  display_name: string
  status: string
  system_prompt: string | null
  knowledge_scope: JsonObject | null
  agent_config: JsonObject | null
  quota_strategy: JsonObject | null
  created_at: string | null
}

export interface KnowHubCustomerAssistantBrief {
  id: string
  name: string
  display_name: string
  status: string
  description?: string
}

export interface KnowHubCustomerAssistantPayload {
  name: string
  display_name?: string
  template_id: string
  system_prompt?: string | null
  knowledge_scope?: JsonObject | null
  agent_config?: JsonObject | null
  quota_strategy?: JsonObject | null
}

export interface KnowHubCustomerAssistantUpdatePayload {
  name?: string
  display_name?: string
  status?: string
  system_prompt?: string | null
  knowledge_scope?: JsonObject | null
  agent_config?: JsonObject | null
  quota_strategy?: JsonObject | null
}

export function getWorkspaceCustomerAssistants(workspaceId: string): Promise<KnowHubCustomerAssistant[]> {
  return requestKnowHub<KnowHubCustomerAssistant[]>(
    `/api/v1/admin/workspaces/${workspaceId}/customer-assistants`,
  )
}

export interface KnowHubWeknoraAgent {
  /** 客户租户可绑定的 WeKnora 原生 Agent 摘要 */
  id: string
  name: string
  description: string
  is_builtin: boolean
  agent_mode: string
  agent_type: string
  model_id: string
  kb_selection_mode: string
  knowledge_bases: string[]
  retrieve_kb_only_when_mentioned: boolean
}

export function getWorkspaceWeknoraAgents(workspaceId: string): Promise<KnowHubWeknoraAgent[]> {
  return requestKnowHub<KnowHubWeknoraAgent[]>(
    `/api/v1/admin/workspaces/${workspaceId}/weknora-agents`,
  )
}

export function createWorkspaceCustomerAssistant(
  workspaceId: string,
  payload: KnowHubCustomerAssistantPayload,
): Promise<KnowHubCustomerAssistant> {
  return requestKnowHub<KnowHubCustomerAssistant>(
    `/api/v1/admin/workspaces/${workspaceId}/customer-assistants`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    },
  )
}

export function updateCustomerAssistant(
  assistantId: string,
  payload: KnowHubCustomerAssistantUpdatePayload,
): Promise<KnowHubCustomerAssistant> {
  return requestKnowHub<KnowHubCustomerAssistant>(`/api/v1/admin/customer-assistants/${assistantId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export function deleteCustomerAssistant(assistantId: string): Promise<void> {
  return requestKnowHub<void>(`/api/v1/admin/customer-assistants/${assistantId}`, {
    method: 'DELETE',
  })
}

export function getMyCustomerAssistants(): Promise<KnowHubCustomerAssistantBrief[]> {
  return requestKnowHub<KnowHubCustomerAssistantBrief[]>('/api/v1/me/customer-assistants')
}

export function resolveAssistantStreamEndpoint(assistantId: string): string {
  return `${getKnowHubBackendBaseUrl()}/api/v1/chat/stream/assistant/${assistantId}`
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
