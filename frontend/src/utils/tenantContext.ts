type StoredUser = {
  tenant_id?: string | number | null
}

type StoredMembership = {
  tenant_id?: string | number | null
}

function readJson<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

function normalizeTenantId(value: unknown): string | null {
  if (value === undefined || value === null) return null
  const text = String(value).trim()
  return text ? text : null
}

function storedHomeTenantId(): string | null {
  const user = readJson<StoredUser>('weknora_user')
  const fromUser = normalizeTenantId(user?.tenant_id)
  if (fromUser) return fromUser

  const tenant = readJson<{ id?: string | number | null }>('weknora_tenant')
  return normalizeTenantId(tenant?.id)
}

function storedCanAccessAllTenants(): boolean {
  // /auth/me 返回的 can_access_all_tenants 已是「用户超管字段 && 跨租户开关」
  // （见 WeKnora internal/handler/auth.go），为 true 即表示可合法跨租户访问。
  const user = readJson<{ can_access_all_tenants?: boolean }>('weknora_user')
  return user?.can_access_all_tenants === true
}

function canUseSelectedTenant(selectedTenantId: string): boolean {
  if (storedCanAccessAllTenants()) return true
  const memberships = readJson<StoredMembership[]>('weknora_memberships')
  if (!Array.isArray(memberships)) return false
  return memberships.some((item) => normalizeTenantId(item?.tenant_id) === selectedTenantId)
}

export function clearStaleSelectedTenant() {
  localStorage.removeItem('weknora_selected_tenant_id')
  localStorage.removeItem('weknora_selected_tenant_name')
}

export function getStoredEffectiveTenantId(): string | null {
  const selectedTenantId = normalizeTenantId(localStorage.getItem('weknora_selected_tenant_id'))
  if (selectedTenantId) {
    if (canUseSelectedTenant(selectedTenantId)) {
      return selectedTenantId
    }
    clearStaleSelectedTenant()
  }

  return storedHomeTenantId()
}
