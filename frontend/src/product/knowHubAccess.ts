const CUSTOMER_MENU_PATHS = new Set([
  'creatChat',
  'knowledge-bases',
  'settings',
  'logout',
])

const ADMIN_MENU_PATHS = new Set([
  ...CUSTOMER_MENU_PATHS,
  'trial-report',
])

export function isKnowHubMenuVisible(path: string, isAdmin: boolean): boolean {
  return (isAdmin ? ADMIN_MENU_PATHS : CUSTOMER_MENU_PATHS).has(path)
}
