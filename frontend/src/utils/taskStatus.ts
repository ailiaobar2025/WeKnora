import type { TaskStatus } from '@/api/employeeOs'

export type StatusLabel = string
export type StatusTheme = 'default' | 'primary' | 'success' | 'warning' | 'danger'

const STATUS_LABEL_MAP: Record<TaskStatus, StatusLabel> = {
  QUEUED: '排队中',
  RUNNING: '执行中',
  NEED_HUMAN_REVIEW: '待审批',
  NEED_INFO: '待补充资料',
  SUCCESS: '成功交付',
  FAILED: '处理异常',
  CANCELLED: '已取消',
  TIMEOUT: '超时终止',
}

const STATUS_THEME_MAP: Record<TaskStatus, StatusTheme> = {
  QUEUED: 'default',
  RUNNING: 'primary',
  NEED_HUMAN_REVIEW: 'warning',
  NEED_INFO: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  CANCELLED: 'default',
  TIMEOUT: 'danger',
}

export function getStatusLabel(status: string): StatusLabel {
  return (STATUS_LABEL_MAP as Record<string, StatusLabel>)[status] || status
}

export function getStatusTheme(status: string): StatusTheme {
  return (STATUS_THEME_MAP as Record<string, StatusTheme>)[status] || 'default'
}
