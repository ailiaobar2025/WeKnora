const CUSTOMER_MENU_PATHS = new Set([
  'creatChat',
  'knowledge-bases',
  'settings',
  'logout',
])

const ADMIN_MENU_PATHS = new Set([
  ...CUSTOMER_MENU_PATHS,
  'trial-report',
  'quota-audit',
  'audit-logs',
])

const CUSTOMER_SETTINGS_SECTIONS = new Set([
  'general',
  'userprofile',
  'tenant',
])

const ADMIN_SETTINGS_SECTIONS = new Set([
  ...CUSTOMER_SETTINGS_SECTIONS,
  'members',
  'system',
])

export function isKnowHubMenuVisible(
  path: string,
  isAdmin: boolean,
  isSystemAdmin = false,
): boolean {
  if (isSystemAdmin) return true
  return (isAdmin ? ADMIN_MENU_PATHS : CUSTOMER_MENU_PATHS).has(path)
}

export function isKnowHubSettingsSectionVisible(
  section: string,
  isAdmin: boolean,
  isSystemAdmin = false,
): boolean {
  if (isSystemAdmin) return true
  return (isAdmin ? ADMIN_SETTINGS_SECTIONS : CUSTOMER_SETTINGS_SECTIONS).has(section)
}

export function isKnowHubKnowledgeBaseEditorSectionVisible(section: string): boolean {
  return section === 'basic'
}
