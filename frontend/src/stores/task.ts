import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import {
  createBizTask,
  fetchDashboardSummary,
  fetchTaskDetail,
  fetchTaskList,
  reviewBizTask,
  type BizTask,
  type CreateTaskPayload,
  type DashboardSummaryData,
  type HitLReviewPayload,
  type TaskStatus,
} from '@/api/employeeOs'

export interface TaskListQuery {
  employeeId?: string
  status?: TaskStatus
  page?: number
  limit?: number
  scope?: 'my' | 'team'
}

export const useTaskStore = defineStore('taskStore', () => {
  const tasks = ref<BizTask[]>([])
  const loading = ref(false)
  const currentPage = ref(1)
  const pageSize = ref(20)
  const total = ref(0)
  const dashboardSummary = ref<DashboardSummaryData | null>(null)
  const summaryLoading = ref(false)
  let requestSequence = 0
  let summarySequence = 0

  function upsertTask(task: BizTask) {
    const index = tasks.value.findIndex((item) => item.taskId === task.taskId)
    if (index === -1) tasks.value.unshift(task)
    else tasks.value[index] = task
  }

  async function loadTasks(query: TaskListQuery = {}) {
    const sequence = ++requestSequence
    const nextPage = query.page ?? currentPage.value
    const nextLimit = query.limit ?? pageSize.value
    loading.value = true
    try {
      const response = await fetchTaskList({ ...query, page: nextPage, limit: nextLimit })
      if (sequence === requestSequence) {
        tasks.value = response.data
        currentPage.value = response.page || nextPage
        pageSize.value = response.limit || nextLimit
        total.value = response.total || 0
      }
      return response
    } catch (error: unknown) {
      if (sequence === requestSequence) {
        tasks.value = []
        total.value = 0
      }
      throw error
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  }

  async function loadDashboardSummary(workspaceId?: string) {
    const sequence = ++summarySequence
    summaryLoading.value = true
    try {
      const data = await fetchDashboardSummary(workspaceId)
      if (sequence === summarySequence) {
        dashboardSummary.value = data
      }
      return data
    } catch (error: unknown) {
      if (sequence === summarySequence) {
        dashboardSummary.value = null
      }
      throw error
    } finally {
      if (sequence === summarySequence) summaryLoading.value = false
    }
  }

  async function loadTask(taskId: string): Promise<BizTask> {
    loading.value = true
    try {
      const task = await fetchTaskDetail(taskId)
      upsertTask(task)
      return task
    } finally {
      loading.value = false
    }
  }

  async function createTask(payload: CreateTaskPayload): Promise<BizTask> {
    const task = await createBizTask(payload)
    upsertTask(task)
    return task
  }

  function getTaskById(taskId: string): BizTask | undefined {
    return tasks.value.find((task) => task.taskId === taskId)
  }

  async function reviewTask(
    taskId: string,
    action: HitLReviewPayload['action'],
    comment?: string,
  ): Promise<BizTask> {
    const task = await reviewBizTask(taskId, { action, comment })
    upsertTask(task)
    return task
  }

  const pendingCounts = computed(() => {
    let needReview = 0
    let needInfo = 0
    let running = 0
    let failed = 0
    let queued = 0

    for (const task of tasks.value) {
      if (task.status === 'NEED_HUMAN_REVIEW') needReview++
      else if (task.status === 'NEED_INFO') needInfo++
      else if (task.status === 'RUNNING') running++
      else if (task.status === 'FAILED') failed++
      else if (task.status === 'QUEUED') queued++
    }

    return { needReview, needInfo, running, failed, queued }
  })

  return {
    tasks,
    loading,
    currentPage,
    pageSize,
    total,
    dashboardSummary,
    summaryLoading,
    pendingCounts,
    loadTasks,
    loadDashboardSummary,
    loadTask,
    createTask,
    getTaskById,
    reviewTask,
  }
})
