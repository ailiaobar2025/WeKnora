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
  executionId: string | null
  assistantMessageId: string | null
  pendingApprovalId: string | null
  creatorUserId: string
  title: string
  source: string
  status: TaskStatus
  outputArtifacts: Array<{
    name: string
    artifactId: string
    type: string
    url: string
    createdAt: string
  }> | null
  progress: number
  errorMessage: string | null
  startedAt: string | null
  completedAt: string | null
  createdAt: string
  updatedAt: string
  version: number
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
  employeeId: string
  title: string
  conversationId?: string
  source?: string
}

export interface BizEmployee {
  employeeId: string
  workspaceId: string
  name: string
  avatarUrl: string | null
  description: string | null
  agentIdRef: string
  status: string
  createdAt: string
  updatedAt: string
}

export interface HitLReviewPayload {
  action: 'APPROVE' | 'REJECT' | 'MODIFY'
  comment?: string
  modifiedPayload?: Record<string, any>
}

const EMPLOYEE_OS_API = '/employee-os/api/v1'

// 1. 获取 Dashboard 聚合摘要
export function fetchDashboardSummary(workspaceId?: string) {
  const query = workspaceId ? `?workspaceId=${encodeURIComponent(workspaceId)}` : ''
  return get<DashboardSummaryData>(`${EMPLOYEE_OS_API}/dashboard/summary${query}`)
}

// 2. 任务列表查询
export function fetchTaskList(params: {
  employeeId?: string
  status?: string
  page?: number
  limit?: number
  scope?: 'my' | 'team'
}) {
  const queryParts: string[] = []
  if (params.employeeId) queryParts.push(`employeeId=${encodeURIComponent(params.employeeId)}`)
  if (params.status) queryParts.push(`status=${encodeURIComponent(params.status)}`)
  if (params.page) queryParts.push(`page=${params.page}`)
  if (params.limit) queryParts.push(`limit=${params.limit}`)
  if (params.scope) queryParts.push(`scope=${params.scope}`)

  const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : ''
  return get<{ data: BizTask[]; total: number; page: number; limit: number }>(
    `${EMPLOYEE_OS_API}/tasks${queryString}`
  )
}

// 3. 任务详情获取
export function fetchTaskDetail(taskId: string) {
  return get<BizTask>(`${EMPLOYEE_OS_API}/tasks/${encodeURIComponent(taskId)}`)
}

export function fetchAvailableEmployees() {
  return get<{ data: BizEmployee[]; total: number; page: number; limit: number }>(
    `${EMPLOYEE_OS_API}/employees/available`
  )
}

export function createBizEmployee(payload: {
  name: string
  description?: string
  agentIdRef: string
  status?: string
}) {
  return post<BizEmployee>(`${EMPLOYEE_OS_API}/employees`, payload)
}

export function updateBizEmployee(
  employeeId: string,
  payload: {
    description?: string
    agentIdRef?: string
    status?: string
  }
) {
  return patch<BizEmployee>(
    `${EMPLOYEE_OS_API}/employees/${encodeURIComponent(employeeId)}`,
    payload
  )
}

// 4. 创建新任务
export function createBizTask(payload: CreateTaskPayload) {
  return post<BizTask>(`${EMPLOYEE_OS_API}/tasks`, payload)
}

// 5. 人工审批/干预任务
export function reviewBizTask(taskId: string, payload: HitLReviewPayload) {
  return post<BizTask>(`${EMPLOYEE_OS_API}/tasks/${encodeURIComponent(taskId)}/review`, payload)
}

// 6. 更新任务状态（例如补充资料或取消任务）
export function updateBizTask(taskId: string, payload: Partial<BizTask>) {
  return patch<BizTask>(`${EMPLOYEE_OS_API}/tasks/${encodeURIComponent(taskId)}`, payload)
}
