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

function canUseSelectedTenant(selectedTenantId: string): boolean {
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
