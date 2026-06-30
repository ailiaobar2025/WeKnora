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

test('stale selected tenant is ignored for system admin when membership is missing', () => {
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

  assert.equal(getStoredEffectiveTenantId(), '10001')
  assert.equal(localStorage.getItem('weknora_selected_tenant_id'), null)
  assert.equal(localStorage.getItem('weknora_selected_tenant_name'), null)
})
