<template>
  <div class="task-list-container">
    <!-- 顶部指标卡区：状态分布 / 运行指标 / 热门员工 -->
    <div class="metrics-row">
      <t-skeleton v-if="summaryLoading && !dashboardSummary" :loading="true" :row-col="metricsSkeletonCols" />

      <template v-else>
        <div v-if="summaryError" class="metrics-error">
          <t-icon name="info-circle" size="14px" style="color: var(--td-text-color-placeholder);" />
          <span>指标数据暂不可用</span>
          <t-button size="small" variant="text" theme="primary" @click="loadSummaryData">重试</t-button>
        </div>

        <div class="metrics-grid">
          <!-- 任务状态分布 -->
          <div class="metric-card">
            <div class="metric-card-header">
              <h3 class="metric-card-title">任务状态分布</h3>
              <span class="metric-card-hint">点击可快速筛选下方任务</span>
            </div>
            <div class="pending-tags">
              <button
                v-for="item in pendingCountItems"
                :key="item.value"
                class="pending-tag"
                :class="['theme-' + item.theme, { active: selectedStatus === item.value }]"
                type="button"
                @click="onSelectStatus(item.value)"
              >
                <span class="pending-tag-count">{{ item.count }}</span>
                <span class="pending-tag-label">{{ item.label }}</span>
              </button>
            </div>
          </div>

          <!-- 运行指标 -->
          <div class="metric-card">
            <div class="metric-card-header">
              <h3 class="metric-card-title">运行指标</h3>
              <span class="metric-card-hint">实时聚合</span>
            </div>
            <div class="metric-stats">
              <div class="metric-stat">
                <span class="metric-stat-value">{{ metrics.totalTasks }}</span>
                <span class="metric-stat-label">总任务数</span>
              </div>
              <div class="metric-stat">
                <span class="metric-stat-value">{{ formatRate(metrics.successRate) }}</span>
                <span class="metric-stat-label">交付成功率</span>
              </div>
              <div class="metric-stat">
                <span class="metric-stat-value">{{ formatDuration(metrics.avgDurationMinutes) }}</span>
                <span class="metric-stat-label">平均耗时</span>
              </div>
              <div class="metric-stat">
                <span class="metric-stat-value">{{ metrics.activeEmployeesCount }}</span>
                <span class="metric-stat-label">活跃员工</span>
              </div>
            </div>
          </div>

          <!-- 热门数字员工 -->
          <div class="metric-card">
            <div class="metric-card-header">
              <h3 class="metric-card-title">热门数字员工</h3>
              <span class="metric-card-hint">点击查看该员工任务</span>
            </div>
            <div v-if="popularEmployees.length === 0" class="metric-card-empty">暂无热门员工数据</div>
            <ul v-else class="popular-emp-list">
              <li
                v-for="emp in popularEmployees"
                :key="emp.id"
                class="popular-emp-item"
                :class="{ active: selectedEmployeeId === emp.id }"
                @click="onSelectEmployee(emp.id)"
              >
                <t-avatar size="small" class="popular-emp-avatar">
                  {{ emp.name.substring(0, 1) }}
                </t-avatar>
                <div class="popular-emp-info">
                  <div class="popular-emp-name-row">
                    <span class="popular-emp-name">{{ emp.name }}</span>
                    <span class="popular-emp-dept">{{ emp.department }}</span>
                  </div>
                  <span class="popular-emp-stat">
                    {{ emp.taskCount }} 个任务 · 成功率 {{ emp.successRate === null ? '暂无' : `${emp.successRate}%` }}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </template>
    </div>

    <div class="header-card">
      <div class="header-content">
        <h1 class="header-title">企业任务中心</h1>
        <p class="header-subtitle">追溯数字员工从接收需求到完成交付的全链条异步任务状态与产物</p>
      </div>

      <div class="filter-bar">
        <div class="filter-left">
          <t-radio-group v-model="viewScope" variant="default-filled">
            <t-radio-button value="my">我的任务</t-radio-button>
            <t-radio-button value="team">团队任务</t-radio-button>
          </t-radio-group>

          <t-select
            v-model="selectedStatus"
            placeholder="按状态筛选"
            style="width: 180px;"
            clearable
          >
            <t-option
              v-for="opt in statusOptions"
              :key="opt.value"
              :value="opt.value"
              :label="opt.label"
            />
          </t-select>

          <t-select
            v-model="selectedEmployeeId"
            placeholder="按数字员工筛选"
            style="width: 200px;"
            clearable
            filterable
          >
            <t-option
              v-for="emp in availableEmployees"
              :key="emp.employeeId"
              :value="emp.employeeId"
              :label="emp.name"
            />
          </t-select>

          <t-input
            v-model="searchKeyword"
            placeholder="搜索任务名称/编号/交付成果..."
            style="width: 280px;"
            clearable
          >
            <template #prefix-icon>
              <t-icon name="search" />
            </template>
          </t-input>
        </div>

        <div class="filter-right">
          <t-button variant="outline" @click="handleRefresh">
            <template #icon><t-icon name="refresh" /></template>
            刷新
          </t-button>
          <t-button theme="primary" @click="goToWorkbench">
            <template #icon><t-icon name="add" /></template>
            下发新任务
          </t-button>
        </div>
      </div>
    </div>

    <!-- 真实任务列表表格 -->
    <div class="table-card">
      <t-loading :loading="loading">
        <div v-if="filteredTasks.length === 0" class="empty-box">
          <t-icon name="inbox" size="48px" style="color: #ccc;" />
          <p class="empty-text">暂无符合条件的任务记录</p>
          <t-button theme="primary" size="small" @click="goToWorkbench">立即下发第一笔任务</t-button>
        </div>

        <table v-else class="custom-task-table">
          <thead>
            <tr>
              <th>任务编号</th>
              <th>任务描述</th>
              <th>负责数字员工</th>
              <th>任务状态</th>
              <th>交付成果</th>
              <th>发起时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="task in filteredTasks" :key="task.taskId" class="task-row">
              <td class="task-id-cell">
                <code>{{ task.taskId }}</code>
              </td>
              <td class="task-title-cell">
                <span class="task-title-text" @click="openDetail(task.taskId)">{{ task.title }}</span>
              </td>
              <td>
                <div class="emp-cell">
                  <t-avatar size="small" style="background: var(--td-brand-color); color: #fff;">
                    {{ getEmployeeName(task.employeeId).substring(0, 1) }}
                  </t-avatar>
                  <span style="margin-left: 8px;">{{ getEmployeeName(task.employeeId) }}</span>
                </div>
              </td>
              <td>
                <t-tag :theme="getStatusTheme(task.status)" size="small">
                  {{ getStatusLabel(task.status) }}
                </t-tag>
              </td>
              <td>
                <div v-if="task.outputArtifacts && task.outputArtifacts.length > 0" class="artifacts-cell">
                  <t-tag theme="success" variant="light" size="small" style="cursor: pointer;" @click="openDetail(task.taskId, 'artifacts')">
                    📄 {{ task.outputArtifacts.length }} 份成果产物
                  </t-tag>
                </div>
                <span v-else style="color: #ccc;">-</span>
              </td>
              <td class="time-cell">
                {{ formatDate(task.createdAt) }}
              </td>
              <td class="action-cell">
                <t-button size="small" variant="text" theme="primary" @click="openDetail(task.taskId)">
                  查看详情
                </t-button>
                <t-button
                  v-if="task.status === 'NEED_HUMAN_REVIEW'"
                  size="small"
                  variant="text"
                  theme="warning"
                  @click="openDetail(task.taskId, 'timeline')"
                >
                  立即审批
                </t-button>
              </td>
            </tr>
          </tbody>
        </table>
      </t-loading>

      <div v-if="!loading && total > 0" class="table-pagination">
        <t-pagination
          :current="currentPage"
          :page-size="pageSize"
          :total="total"
          :show-jumper="true"
          :show-page-size="false"
          @change="onPageChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  fetchAvailableEmployees,
  type BizEmployee,
  type DashboardSummaryData,
  type TaskStatus,
} from '@/api/employeeOs'
import { getStatusLabel, getStatusTheme } from '@/utils/taskStatus'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()

const viewScope = ref<'my' | 'team'>('my')
const selectedStatus = ref<TaskStatus | ''>((route.query.status as TaskStatus) || '')
const selectedEmployeeId = ref<string>((route.query.employeeId as string) || '')
const searchKeyword = ref('')
const loading = computed(() => taskStore.loading)
const currentPage = computed(() => taskStore.currentPage)
const pageSize = computed(() => taskStore.pageSize)
const total = computed(() => taskStore.total)
const summaryLoading = computed(() => taskStore.summaryLoading)
const dashboardSummary = computed<DashboardSummaryData | null>(() => taskStore.dashboardSummary)
const summaryError = ref(false)
const employeeNames = ref<Record<string, string>>({})
const availableEmployees = ref<BizEmployee[]>([])

const statusOptions = [
  { label: '全部状态', value: '' },
  { label: '排队中 (QUEUED)', value: 'QUEUED' },
  { label: '执行中 (RUNNING)', value: 'RUNNING' },
  { label: '待人工审批 (NEED_HUMAN_REVIEW)', value: 'NEED_HUMAN_REVIEW' },
  { label: '待补充资料 (NEED_INFO)', value: 'NEED_INFO' },
  { label: '成功交付 (SUCCESS)', value: 'SUCCESS' },
  { label: '处理异常 (FAILED)', value: 'FAILED' },
  { label: '已取消 (CANCELLED)', value: 'CANCELLED' },
  { label: '超时终止 (TIMEOUT)', value: 'TIMEOUT' },
]

const metricsSkeletonCols = [
  { width: '24%', height: '16px' },
  { width: '40%', height: '16px' },
  { width: '100%', height: '120px' },
]

const pendingCountItems = computed(() => {
  const counts = dashboardSummary.value?.pendingCounts
  return [
    { value: 'NEED_HUMAN_REVIEW' as TaskStatus, label: '待审批', count: counts?.needReview ?? 0, theme: 'warning' },
    { value: 'NEED_INFO' as TaskStatus, label: '待补充资料', count: counts?.needInfo ?? 0, theme: 'warning' },
    { value: 'RUNNING' as TaskStatus, label: '执行中', count: counts?.running ?? 0, theme: 'primary' },
    { value: 'FAILED' as TaskStatus, label: '处理异常', count: counts?.failed ?? 0, theme: 'danger' },
    { value: 'QUEUED' as TaskStatus, label: '排队中', count: counts?.queued ?? 0, theme: 'default' },
  ]
})

const metrics = computed(() => {
  return dashboardSummary.value?.metrics ?? {
    totalTasks: 0,
    successRate: 0,
    avgDurationMinutes: 0,
    activeEmployeesCount: 0,
  }
})

const popularEmployees = computed(() => {
  const list = dashboardSummary.value?.popularEmployees ?? []
  return list.slice(0, 5)
})

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

function formatRate(rate: number): string {
  if (!rate && rate !== 0) return '-'
  return `${rate.toFixed(1)}%`
}

function formatDuration(minutes: number): string {
  if (!minutes && minutes !== 0) return '-'
  if (minutes < 1) return `${Math.round(minutes * 60)} s`
  if (minutes < 60) return `${minutes.toFixed(1)} min`
  const hours = minutes / 60
  return `${hours.toFixed(1)} h`
}

async function loadSummaryData(): Promise<void> {
  summaryError.value = false
  try {
    await taskStore.loadDashboardSummary()
  } catch (error: unknown) {
    summaryError.value = true
    MessagePlugin.warning(errorMessage(error, '指标加载失败'))
  }
}

async function loadTaskList(showSuccess = false): Promise<void> {
  try {
    await taskStore.loadTasks({
      status: selectedStatus.value || undefined,
      scope: viewScope.value,
      employeeId: selectedEmployeeId.value || undefined,
      page: 1,
      limit: 20,
    })
    if (showSuccess) MessagePlugin.success('已刷新最新任务列表')
  } catch (error: unknown) {
    MessagePlugin.error(errorMessage(error, '任务列表加载失败'))
  }
}

async function loadAvailableEmployees(): Promise<void> {
  try {
    const response = await fetchAvailableEmployees()
    availableEmployees.value = response.data
    employeeNames.value = Object.fromEntries(
      response.data.map((employee) => [employee.employeeId, employee.name]),
    )
  } catch (error: unknown) {
    MessagePlugin.warning(errorMessage(error, '数字员工列表加载失败'))
  }
}

onMounted(() => {
  void loadTaskList()
  void loadSummaryData()
  void loadAvailableEmployees()
})

watch([viewScope, selectedStatus, selectedEmployeeId], () => {
  void loadTaskList()
})

const filteredTasks = computed(() => {
  return taskStore.tasks.filter((t) => {
    if (selectedStatus.value && t.status !== selectedStatus.value) {
      return false
    }
    if (searchKeyword.value.trim()) {
      const kw = searchKeyword.value.toLowerCase()
      const matchTitle = t.title.toLowerCase().includes(kw)
      const matchId = t.taskId.toLowerCase().includes(kw)
      return matchTitle || matchId
    }
    return true
  })
})

const handleRefresh = async () => {
  await Promise.all([loadTaskList(true), loadSummaryData()])
}

const goToWorkbench = () => {
  router.push('/platform/workbench')
}

const openDetail = (taskId: string, tab?: string) => {
  router.push({ path: `/platform/tasks/${taskId}`, query: tab ? { tab } : {} })
}

const getEmployeeName = (id: string) => {
  return employeeNames.value[id] || id
}

const onSelectStatus = (status: TaskStatus) => {
  selectedStatus.value = selectedStatus.value === status ? '' : status
}

const onSelectEmployee = (id: string) => {
  selectedEmployeeId.value = selectedEmployeeId.value === id ? '' : id
}

const onPageChange = (pageInfo: { current: number; pageSize: number }) => {
  void taskStore.loadTasks({
    status: selectedStatus.value || undefined,
    scope: viewScope.value,
    employeeId: selectedEmployeeId.value || undefined,
    page: pageInfo.current,
    limit: pageInfo.pageSize,
  })
}

const formatDate = (isoStr: string) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="less">
.task-list-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.header-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
}

.header-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin: 0 0 6px 0;
}

.header-subtitle {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  margin: 0 0 20px 0;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.filter-right {
  display: flex;
  gap: 12px;
}

.table-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 20px;
}

.table-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

.custom-task-table {
  width: 100%;
  border-collapse: collapse;

  th {
    text-align: left;
    padding: 12px 16px;
    font-size: 13px;
    font-weight: 600;
    color: var(--td-text-color-secondary);
    border-bottom: 1px solid var(--td-component-border);
  }

  td {
    padding: 16px;
    font-size: 13px;
    border-bottom: 1px solid var(--td-component-border);
    vertical-align: middle;
  }
}

.task-row:hover {
  background: var(--td-bg-color-secondarycontainer);
}

.task-id-cell code {
  font-family: monospace;
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.task-title-text {
  font-weight: 500;
  color: var(--td-text-color-primary);
  cursor: pointer;

  &:hover {
    color: var(--td-brand-color);
  }
}

.emp-cell {
  display: flex;
  align-items: center;
}

.action-cell {
  display: flex;
  gap: 8px;
}

.empty-box {
  padding: 40px;
  text-align: center;
  .empty-text {
    margin: 12px 0 16px 0;
    color: var(--td-text-color-placeholder);
    font-size: 14px;
  }
}

.metrics-row {
  margin-bottom: 24px;
}

.metrics-error {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 16px 20px;
  color: var(--td-text-color-secondary);
  font-size: 13px;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.metric-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  min-height: 200px;
}

.metric-card-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.metric-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin: 0;
}

.metric-card-hint {
  font-size: 12px;
  color: var(--td-text-color-placeholder);
}

.metric-card-empty {
  color: var(--td-text-color-placeholder);
  font-size: 13px;
  padding: 24px 0;
  text-align: center;
}

.pending-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  flex: 1;
  align-content: flex-start;
}

.pending-tag {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 14px 12px;
  min-width: 86px;
  border-radius: 10px;
  border: 1px solid var(--td-component-border);
  background: var(--td-bg-color-secondarycontainer);
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: inherit;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  }

  &.active {
    border-color: var(--td-brand-color);
    background: var(--td-brand-color-light);
  }
}

.pending-tag-count {
  font-size: 22px;
  font-weight: 600;
  line-height: 1.2;
  color: var(--td-text-color-primary);
}

.pending-tag-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
  margin-top: 4px;
}

.pending-tag.theme-primary {
  border-top: 3px solid var(--td-brand-color);
}
.pending-tag.theme-warning {
  border-top: 3px solid #ed7b14;
}
.pending-tag.theme-danger {
  border-top: 3px solid #d54941;
}
.pending-tag.theme-default {
  border-top: 3px solid var(--td-text-color-placeholder);
}

.metric-stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px 24px;
  flex: 1;
}

.metric-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.metric-stat-value {
  font-size: 22px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  line-height: 1.1;
}

.metric-stat-label {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}

.popular-emp-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.popular-emp-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: var(--td-bg-color-secondarycontainer);
  }

  &.active {
    background: var(--td-brand-color-light);
  }
}

.popular-emp-avatar {
  background: var(--td-brand-color);
  color: #fff;
  flex-shrink: 0;
}

.popular-emp-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.popular-emp-name-row {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
}

.popular-emp-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.popular-emp-dept {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
  background: var(--td-bg-color-secondarycontainer);
  padding: 1px 6px;
  border-radius: 4px;
  flex-shrink: 0;
}

.popular-emp-stat {
  font-size: 12px;
  color: var(--td-text-color-secondary);
}
</style>
