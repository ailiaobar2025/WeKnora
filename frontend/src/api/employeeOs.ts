import { get, post, patch } from '@/utils/request'

export type TaskStatus =
  | 'QUEUED'
  | 'RUNNING'
  | 'NEED_HUMAN_REVIEW'
  | 'NEED_INFO'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED'
  | 'TIMEOUT'

export interface BizTask {
  taskId: string
  workspaceId: string
  employeeId: string
  conversationId: string | null
  creatorUserId: string
  title: string
  source: string
  status: TaskStatus
  outputArtifacts: Array<{
    name: string
    type: string
    url?: string;
    description?: string;
  }> | null
  createdAt: string
}

export interface DashboardSummaryData {
  pendingCounts: {
    needReview: number
    needInfo: number
    running: number
    failed: number
    queued: number
  }
  popularEmployees: Array<{
    id: string
    name: string
    role: string
    avatar?: string
    department: string
    taskCount: number
    successRate: number
  }>
  recentTasks: BizTask[]
  recentArtifacts: Array<{
    taskId: string
    taskTitle: string
    employeeName: string
    name: string
    type: string
    url?: string
    createdAt: string
  }>
  metrics: {
    totalTasks: number
    successRate: number
    avgDurationMinutes: number
    activeEmployeesCount: number
  }
}

export interface CreateTaskPayload {
  workspaceId: string
  employeeId: string
  title: string
  creatorUserId: string
  conversationId?: string
  source?: string
}

export interface HitLReviewPayload {
  action: 'APPROVE' | 'REJECT' | 'MODIFY'
  reviewUserId: string
  comment?: string
  modifiedPayload?: Record<string, any>
}

// 1. 获取 Dashboard 聚合摘要
export function fetchDashboardSummary(workspaceId?: string) {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
  return get<DashboardSummaryData>(`/api/v1/dashboard/summary${query}`)
}

// 2. 任务列表查询
export function fetchTaskList(params: {
  workspaceId?: string
  employeeId?: string
  status?: string
  page?: number
  limit?: number
}) {
  const queryParts: string[] = []
  if (params.workspaceId) queryParts.push(`workspaceId=${encodeURIComponent(params.workspaceId)}`)
  if (params.employeeId) queryParts.push(`employeeId=${encodeURIComponent(params.employeeId)}`)
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`)
  if (params.page) queryParts.push(`page=${params.page}`)
  if (params.limit) queryParts.push(`limit=${params.limit}`)

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return get<{ data: BizTask[]; total: number; page: number; limit: number }>(
    `/api/v1/tasks${queryString}`
  )
}

// 3. 任务详情获取
export function fetchTaskDetail(taskId: string) {
  return get<BizTask>(`/api/v1/tasks/${encodeURIComponent(taskId)}`)
}

// 4. 创建新任务
export function createBizTask(payload: CreateTaskPayload) {
  return post<BizTask>('/api/v1/tasks', payload)
}

// 5. 人工审批/干预任务
export function reviewBizTask(taskId: string, payload: HitLReviewPayload) {
  return post<BizTask>(`/api/v1/tasks/${encodeURIComponent(taskId)}/review`, payload)
}

// 6. 更新任务状态（例如补充资料或取消任务）
export function updateBizTask(taskId: string, payload: Partial<BizTask>) {
  return patch<BizTask>(`/api/v1/tasks/${encodeURIComponent(taskId)}`, payload)
}
