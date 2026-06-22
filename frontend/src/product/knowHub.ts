import type { RouteLocationNormalized } from 'vue-router'
import type { useAuthStore } from '@/stores/auth'
import { isKnowHubMenuVisible } from './knowHubAccess'

export const KNOW_HUB_PRODUCT_MODE = 'know-hub'

export function isKnowHubProductMode(): boolean {
  return import.meta.env.VITE_PRODUCT_MODE === KNOW_HUB_PRODUCT_MODE
}

export function isKnowHubAdmin(authStore: ReturnType<typeof useAuthStore>): boolean {
  return authStore.isSystemAdmin || authStore.canAccessAllTenants
}

export function isKnowHubSystemAdmin(authStore: ReturnType<typeof useAuthStore>): boolean {
  return authStore.isSystemAdmin || authStore.canAccessAllTenants
}

export function isKnowHubMenuPathVisible(
  path: string,
  authStore: ReturnType<typeof useAuthStore>,
): boolean {
  if (!isKnowHubProductMode()) return true
  return isKnowHubMenuVisible(path, isKnowHubAdmin(authStore), isKnowHubSystemAdmin(authStore))
}

const DISABLED_ROUTE_NAMES = new Set([
  'agentList',
  'organizationList',
  'systemSettings',
  'systemAdmins',
])

const DISABLED_ROUTE_PREFIXES = [
  '/platform/agents',
  '/platform/organizations',
  '/platform/system',
]

export function isKnowHubRouteAllowed(
  to: RouteLocationNormalized,
  authStore: ReturnType<typeof useAuthStore>,
): boolean {
  if (!isKnowHubProductMode()) return true
  if (isKnowHubSystemAdmin(authStore)) return true

  const routeName = typeof to.name === 'string' ? to.name : ''
  if (DISABLED_ROUTE_NAMES.has(routeName)) return false

  if (DISABLED_ROUTE_PREFIXES.some((prefix) => to.path.startsWith(prefix))) {
    return false
  }

  if (to.meta.requiresSystemAdmin === true && !isKnowHubAdmin(authStore)) {
    return false
  }

  return true
}

export function getKnowHubRouteFallback(): string {
  return '/platform/knowledge-bases'
}

export function resolveKnowHubChatEndpoint(defaultEndpoint: string): string {
  if (!isKnowHubProductMode()) return defaultEndpoint
  const configured = import.meta.env.VITE_KNOW_HUB_CHAT_PROXY_PATH
  if (configured) return configured

  const backendBase = (import.meta.env.VITE_KNOW_HUB_BACKEND_BASE_URL || '').replace(/\/$/, '')
  if (!backendBase) return defaultEndpoint
  const chatKind = defaultEndpoint.includes('agent-chat') ? 'agent' : 'knowledge'
  return `${backendBase}/api/v1/chat/stream/${chatKind}`
}
