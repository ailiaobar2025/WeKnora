import assert from 'node:assert/strict'
import test from 'node:test'

import { getStoredEffectiveTenantId } from './tenantContext.ts'

class MemoryStorage {
  private store = new Map<string, string>()

  get length(): number {
    return this.store.size
  }

  clear(): void {
    this.store.clear()
  }

  getItem(key: string): string | null {
    return this.store.get(key) ?? null
  }

  key(index: number): string | null {
    return [...this.store.keys()][index] ?? null
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value))
  }

  removeItem(key: string): void {
    this.store.delete(key)
  }
}

test('selected tenant is kept for superuser with cross-tenant access even without membership', () => {
  // can_access_all_tenants=true 表示 /auth/me 已确认「用户超管字段 && 跨租户开关」
  // 均成立，超管可合法访问非成员租户。刷新后必须保持切换，不能清回 home tenant。
  const storage = new MemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })

  localStorage.setItem(
    'weknora_user',
    JSON.stringify({
      id: '30870a97-f08e-4efe-9133-66f7b249b785',
      tenant_id: 10001,
      can_access_all_tenants: true,
    }),
  )
  localStorage.setItem(
    'weknora_memberships',
    JSON.stringify([{ tenant_id: 10001, tenant_name: 'Know Hub Admin', role: 'owner' }]),
  )
  localStorage.setItem('weknora_selected_tenant_id', '10000')
  localStorage.setItem('weknora_selected_tenant_name', 'customer tenant')

  assert.equal(getStoredEffectiveTenantId(), '10000')
  assert.equal(localStorage.getItem('weknora_selected_tenant_id'), '10000')
  assert.equal(localStorage.getItem('weknora_selected_tenant_name'), 'customer tenant')
})

test('stale selected tenant is cleared when cross-tenant access is disabled', () => {
  // can_access_all_tenants=false（开关关或非超管）时，非成员租户不可访问，
  // selected 必须被清掉并回退到 home tenant。
  const storage = new MemoryStorage()
  Object.defineProperty(globalThis, 'localStorage', {
    value: storage,
    configurable: true,
  })

  localStorage.setItem(
    'weknora_user',
    JSON.stringify({
      id: 'user-1',
      tenant_id: 10001,
      can_access_all_tenants: false,
    }),
  )
  localStorage.setItem(
    'weknora_memberships',
    JSON.stringify([{ tenant_id: 10001, tenant_name: 'Know Hub Admin', role: 'owner' }]),
  )
  localStorage.setItem('weknora_selected_tenant_id', '10000')

  assert.equal(getStoredEffectiveTenantId(), '10001')
  assert.equal(localStorage.getItem('weknora_selected_tenant_id'), null)
})
