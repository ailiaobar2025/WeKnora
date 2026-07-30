<template>
  <div class="workbench-home">
    <!-- 顶部 Banner & 全能快捷输入框 -->
    <div class="workbench-header">
      <div class="header-content">
        <h1 class="header-title">企业数字员工工作台</h1>
        <p class="header-subtitle">将复杂业务任务高效交给专业数字员工，实时掌握进度与交付成果</p>
      </div>

      <div class="quick-input-card">
        <div class="input-top-bar">
          <div class="employee-selector">
            <span class="selector-label">选择数字员工:</span>
            <t-select
              v-model="selectedEmployeeId"
              placeholder="自动匹配最佳数字员工"
              style="width: 220px;"
              clearable
            >
              <t-option
                v-for="emp in popularEmployees"
                :key="emp.id"
                :value="emp.id"
                :label="emp.name"
              >
                <div class="emp-option-item">
                  <t-avatar size="small">{{ emp.name.substring(0, 1) }}</t-avatar>
                  <span style="margin-left: 8px;">{{ emp.name }}</span>
                </div>
              </t-option>
            </t-select>
          </div>
          <div class="input-tags">
            <t-tag
              theme="primary"
              variant="outline"
              size="small"
              style="cursor: pointer;"
              @click="quickFillPrompt('帮我针对客户科技公司生成 20 万以内的软件交付报价单与评估报告')"
            >
              💡 售前报价示例
            </t-tag>
            <t-tag
              theme="success"
              variant="outline"
              size="small"
              style="cursor: pointer;"
              @click="quickFillPrompt('总结本周行业竞争对手新品发布与市场定价动态')"
            >
              📊 竞品分析示例
            </t-tag>
          </div>
        </div>

        <div class="input-area">
          <t-textarea
            v-model="taskPrompt"
            placeholder="想让数字员工帮你完成什么？输入任务描述或粘贴相关资料链接..."
            :autosize="{ minRows: 3, maxRows: 5 }"
          />
        </div>

        <div class="input-bottom-bar">
          <div class="attach-actions">
            <t-button variant="text" size="small" disabled>
              <template #icon><t-icon name="attach" /></template>
              添加附件资料 (SOP / 需求文档)
            </t-button>
          </div>
          <t-button
            theme="primary"
            size="medium"
            :loading="submitting"
            :disabled="!taskPrompt.trim() || !selectedEmployeeId"
            @click="handleCreateTask"
          >
            <template #icon><t-icon name="send" /></template>
            下发真实任务
          </t-button>
        </div>
      </div>
    </div>

    <!-- 待办处理卡片带 -->
    <div class="workbench-section">
      <div class="section-title-bar">
        <h2 class="section-title">待处理事项</h2>
        <span class="section-desc">需要您审批、补充资料或关注的重要任务节点（点击可精准跳转过滤）</span>
      </div>

      <div class="pending-grid">
        <div
          class="pending-card pending-review"
          :class="{ active: pendingCounts.needReview > 0 }"
          @click="filterTasksByStatus('NEED_HUMAN_REVIEW')"
        >
          <div class="pending-icon">
            <t-icon name="user-safety" size="24px" />
          </div>
          <div class="pending-info">
            <span class="pending-count">{{ pendingCounts.needReview }}</span>
            <span class="pending-label">待人工审批</span>
          </div>
          <t-icon name="chevron-right" class="arrow-icon" />
        </div>

        <div
          class="pending-card pending-info-required"
          :class="{ active: pendingCounts.needInfo > 0 }"
          @click="filterTasksByStatus('NEED_INFO')"
        >
          <div class="pending-icon">
            <t-icon name="edit" size="24px" />
          </div>
          <div class="pending-info">
            <span class="pending-count">{{ pendingCounts.needInfo }}</span>
            <span class="pending-label">待补充资料</span>
          </div>
          <t-icon name="chevron-right" class="arrow-icon" />
        </div>

        <div
          class="pending-card pending-running"
          @click="filterTasksByStatus('RUNNING')"
        >
          <div class="pending-icon">
            <t-icon name="loading" size="24px" />
          </div>
          <div class="pending-info">
            <span class="pending-count">{{ pendingCounts.running }}</span>
            <span class="pending-label">正在执行中</span>
          </div>
          <t-icon name="chevron-right" class="arrow-icon" />
        </div>

        <div
          class="pending-card pending-failed"
          :class="{ active: pendingCounts.failed > 0 }"
          @click="filterTasksByStatus('FAILED')"
        >
          <div class="pending-icon">
            <t-icon name="error-circle" size="24px" />
          </div>
          <div class="pending-info">
            <span class="pending-count">{{ pendingCounts.failed }}</span>
            <span class="pending-label">异常需关注</span>
          </div>
          <t-icon name="chevron-right" class="arrow-icon" />
        </div>
      </div>
    </div>

    <!-- 常用数字员工与最近任务两列布局 -->
    <div class="workbench-two-col">
      <!-- 常用数字员工 -->
      <div class="col-main">
        <div class="workbench-section">
          <div class="section-title-bar">
            <h2 class="section-title">常用数字员工</h2>
            <t-button variant="text" theme="primary" size="small" @click="goToAgents">
              查看全部员工市场 →
            </t-button>
          </div>

          <div class="popular-employees-grid">
            <div
              v-for="emp in popularEmployees"
              :key="emp.id"
              class="employee-card"
              @click="selectEmployeeAndFocus(emp)"
            >
              <div class="emp-card-header">
                <t-avatar size="medium" class="emp-avatar">
                  {{ emp.name.substring(0, 1) }}
                </t-avatar>
                <div class="emp-meta">
                  <h3 class="emp-name">{{ emp.name }}</h3>
                  <span class="emp-role">{{ emp.role }}</span>
                </div>
              </div>
              <div class="emp-card-body">
                <t-tag size="small" variant="light" theme="primary">{{ emp.department }}</t-tag>
                <span class="emp-stat">包含模板与审批规则</span>
              </div>
              <div class="emp-card-footer">
                <span class="success-rate">
                  {{ emp.successRate === null ? '暂无完成数据' : `成功率 ${emp.successRate}%` }}
                </span>
                <t-button size="small" variant="outline" theme="primary" @click.stop="selectEmployeeAndFocus(emp)">
                  立即交任务
                </t-button>
              </div>
            </div>
          </div>
        </div>

        <!-- 最近成果 -->
        <div class="workbench-section">
          <div class="section-title-bar">
            <h2 class="section-title">最近任务交付成果</h2>
          </div>

          <div v-if="recentArtifacts.length === 0" class="empty-state">
            <t-icon name="file-unknown" size="32px" style="color: #999;" />
            <p>暂无新生成的任务成果产物</p>
          </div>

          <div v-else class="artifacts-list">
            <div
              v-for="(art, idx) in recentArtifacts"
              :key="idx"
              class="artifact-item"
              @click="previewArtifact(art)"
            >
              <div class="artifact-icon">
                <t-icon :name="getArtifactIcon(art.type)" size="24px" />
              </div>
              <div class="artifact-detail">
                <h4 class="artifact-name">{{ art.name }}</h4>
                <span class="artifact-sub">
                  来自任务：<strong>{{ art.taskTitle }}</strong> ({{ art.employeeName }})
                </span>
              </div>
              <div class="artifact-action">
                <span class="artifact-time">{{ formatDate(art.createdAt) }}</span>
                <t-button size="small" variant="text" theme="primary" @click.stop="previewArtifact(art)">
                  预览产物
                </t-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 最近任务与团队概览侧栏 -->
      <div class="col-side">
        <div class="workbench-section">
          <div class="section-title-bar">
            <h2 class="section-title">最近真实任务动态 ({{ recentTasks.length }})</h2>
            <t-button variant="text" theme="primary" size="small" @click="goToTasks">全部任务</t-button>
          </div>

          <div v-if="recentTasks.length === 0" class="empty-state">
            <p>最近没有发起过任务</p>
          </div>

          <div v-else class="recent-task-list">
            <div
              v-for="task in recentTasks"
              :key="task.taskId"
              class="task-timeline-item"
              @click="openTaskDetail(task.taskId)"
            >
              <div class="task-status-badge">
                <t-tag :theme="getStatusTheme(task.status)" size="small">
                  {{ getStatusLabel(task.status) }}
                </t-tag>
              </div>
              <div class="task-info">
                <h4 class="task-title">{{ task.title }}</h4>
                <span class="task-time">{{ formatDate(task.createdAt) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 运营摘要卡片 -->
        <div class="workbench-section metrics-summary-card">
          <h3 class="metrics-title">数字员工协同效果</h3>
          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-value">{{ taskMetrics.total }}</span>
              <span class="metric-label">当前加载任务</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ taskMetrics.successRate }}</span>
              <span class="metric-label">任务交付成功率</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ taskMetrics.avgDuration }}</span>
              <span class="metric-label">平均交付时长</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ taskMetrics.activeEmployees }}</span>
              <span class="metric-label">在岗数字员工</span>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useTaskStore } from '@/stores/task'
import { fetchAvailableEmployees, type BizEmployee } from '@/api/employeeOs'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()
const taskPrompt = ref('')
const selectedEmployeeId = ref<string | undefined>()
const submitting = ref(false)
const employees = ref<BizEmployee[]>([])

const pendingCounts = computed(() => taskStore.pendingCounts)
const recentTasks = computed(() => taskStore.tasks.slice(0, 6))

const popularEmployees = computed(() => employees.value.slice(0, 6).map((employee) => {
  const employeeTasks = taskStore.tasks.filter((task) => task.employeeId === employee.employeeId)
  const finished = employeeTasks.filter((task) => ['SUCCESS', 'FAILED', 'CANCELLED', 'TIMEOUT'].includes(task.status))
  const succeeded = finished.filter((task) => task.status === 'SUCCESS').length
  return {
    id: employee.employeeId,
    name: employee.name,
    role: employee.description || '数字员工',
    department: '已发布',
    taskCount: employeeTasks.length,
    successRate: finished.length ? Number(((succeeded / finished.length) * 100).toFixed(1)) : null,
  }
}))

const recentArtifacts = computed(() => {
  const result: any[] = []
  for (const t of taskStore.tasks) {
    if (t.outputArtifacts && Array.isArray(t.outputArtifacts)) {
      for (const art of t.outputArtifacts) {
        result.push({
          taskId: t.taskId,
          taskTitle: t.title,
          employeeName: getEmployeeName(t.employeeId),
          name: art.name,
          type: art.type,
          url: art.url,
          createdAt: art.createdAt,
        })
      }
    }
  }
  return result.slice(0, 5)
})

const taskMetrics = computed(() => {
  const completed = taskStore.tasks.filter((task) => task.status === 'SUCCESS')
  const durations = taskStore.tasks.flatMap((task) => {
    if (!task.startedAt || !task.completedAt) return []
    return [(new Date(task.completedAt).getTime() - new Date(task.startedAt).getTime()) / 60000]
  })
  const average = durations.length
    ? `${(durations.reduce((sum, value) => sum + value, 0) / durations.length).toFixed(1)} min`
    : '-'
  return {
    total: taskStore.tasks.length,
    successRate: taskStore.tasks.length
      ? `${((completed.length / taskStore.tasks.length) * 100).toFixed(1)}%`
      : '-',
    avgDuration: average,
    activeEmployees: employees.value.length,
  }
})

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

async function initializeWorkbench() {
  const [taskResult, employeeResult] = await Promise.allSettled([
    taskStore.loadTasks({ scope: 'my', limit: 100 }),
    fetchAvailableEmployees(),
  ])
  if (taskResult.status === 'rejected') {
    MessagePlugin.error(errorMessage(taskResult.reason, '任务列表加载失败'))
  }
  if (employeeResult.status === 'fulfilled') {
    employees.value = employeeResult.value.data
  } else {
    MessagePlugin.error(errorMessage(employeeResult.reason, '数字员工加载失败'))
  }

  if (route.query.employeeId) {
    const empId = route.query.employeeId as string
    const employee = employees.value.find((item) => item.employeeId === empId)
    if (employee) {
      selectedEmployeeId.value = empId
      taskPrompt.value = `请求【${employee.name}】协助处理：`
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  } else {
    selectedEmployeeId.value = employees.value[0]?.employeeId
  }
}

onMounted(() => {
  void initializeWorkbench()
})

const quickFillPrompt = (prompt: string) => {
  taskPrompt.value = prompt
  if (!selectedEmployeeId.value) selectedEmployeeId.value = employees.value[0]?.employeeId
}

const handleCreateTask = async () => {
  if (!taskPrompt.value.trim()) return

  const empId = selectedEmployeeId.value
  if (!empId) {
    MessagePlugin.warning('当前 Workspace 没有可用的已发布数字员工')
    return
  }
  submitting.value = true
  const promptText = taskPrompt.value

  try {
    const createdTask = await taskStore.createTask({
      employeeId: empId,
      title: promptText,
    })
    MessagePlugin.success('任务已下发，后台执行已启动')
    taskPrompt.value = ''
    router.push(`/platform/tasks/${createdTask.taskId}`)
  } catch (error: unknown) {
    MessagePlugin.error(errorMessage(error, '任务下发失败，请重试'))
  } finally {
    submitting.value = false
  }
}

const selectEmployeeAndFocus = (emp: any) => {
  selectedEmployeeId.value = emp.id
  taskPrompt.value = `请求【${emp.name}】协助处理：`
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const filterTasksByStatus = (status: string) => {
  router.push({ path: '/platform/tasks', query: { status } })
}

const goToAgents = () => {
  router.push('/platform/agents')
}

const goToTasks = () => {
  router.push('/platform/tasks')
}

const openTaskDetail = (taskId: string, tab?: string) => {
  router.push({ path: `/platform/tasks/${taskId}`, query: tab ? { tab } : {} })
}

const previewArtifact = (art: any) => {
  window.open(art.url, '_blank', 'noopener,noreferrer')
}

const getEmployeeName = (id: string) => {
  return employees.value.find((employee) => employee.employeeId === id)?.name || id
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    QUEUED: '排队中',
    RUNNING: '执行中',
    NEED_HUMAN_REVIEW: '待审批',
    NEED_INFO: '待补充资料',
    SUCCESS: '成功交付',
    FAILED: '处理异常',
    CANCELLED: '已取消',
    TIMEOUT: '超时终止',
  }
  return map[status] || status
}

const getStatusTheme = (status: string): any => {
  const map: Record<string, string> = {
    QUEUED: 'default',
    RUNNING: 'primary',
    NEED_HUMAN_REVIEW: 'warning',
    NEED_INFO: 'warning',
    SUCCESS: 'success',
    FAILED: 'danger',
    CANCELLED: 'default',
    TIMEOUT: 'danger',
  }
  return map[status] || 'default'
}

const getArtifactIcon = (type: string) => {
  if (type === 'excel' || type === 'sheet') return 'file-excel'
  if (type === 'pdf' || type === 'document') return 'file-pdf'
  return 'file'
}

const formatDate = (isoStr: string) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="less">
.workbench-home {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.workbench-header {
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
  margin: 0 0 16px 0;
}

.quick-input-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 16px 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03);
}

.input-top-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.employee-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  .selector-label {
    font-size: 13px;
    color: var(--td-text-color-secondary);
  }
}

.emp-option-item {
  display: flex;
  align-items: center;
}

.input-tags {
  display: flex;
  gap: 8px;
}

.input-area {
  margin-bottom: 12px;
}

.input-bottom-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.workbench-section {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title-bar {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin: 0;
}

.section-desc {
  font-size: 13px;
  color: var(--td-text-color-placeholder);
}

.pending-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.pending-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border-radius: 8px;
  background: var(--td-bg-color-secondarycontainer);
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--td-brand-color);
    transform: translateY(-2px);
  }

  &.active {
    background: var(--td-brand-color-light);
    border-color: var(--td-brand-color);
  }

  .pending-icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--td-bg-color-container);
    color: var(--td-brand-color);
    margin-right: 12px;
  }

  .pending-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .pending-count {
    font-size: 20px;
    font-weight: 700;
    color: var(--td-text-color-primary);
  }

  .pending-label {
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }

  .arrow-icon {
    color: var(--td-text-color-placeholder);
  }
}

.pending-review .pending-icon { color: var(--td-warning-color); }
.pending-info-required .pending-icon { color: var(--td-warning-color); }
.pending-failed .pending-icon { color: var(--td-error-color); }

.workbench-two-col {
  display: flex;
  gap: 24px;
}

.col-main {
  flex: 1;
  min-width: 0;
}

.col-side {
  width: 360px;
  flex-shrink: 0;
}

.popular-employees-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.employee-card {
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  padding: 16px;
  background: var(--td-bg-color-container);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  justify-content: space-between;

  &:hover {
    border-color: var(--td-brand-color);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
}

.emp-card-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.emp-avatar {
  margin-right: 10px;
}

.emp-name {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 2px 0;
  color: var(--td-text-color-primary);
}

.emp-role {
  font-size: 11px;
  color: var(--td-text-color-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.emp-card-body {
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  .emp-stat {
    font-size: 11px;
    color: var(--td-text-color-placeholder);
  }
}

.emp-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px dashed var(--td-component-border);
  .success-rate {
    font-size: 11px;
    color: var(--td-success-color);
  }
}

.artifacts-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.artifact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  border-radius: 6px;
  border: 1px solid var(--td-component-border);
  cursor: pointer;

  &:hover {
    background: var(--td-bg-color-secondarycontainer);
    border-color: var(--td-brand-color);
  }
}

.artifact-icon {
  margin-right: 12px;
  color: var(--td-brand-color);
}

.artifact-detail {
  flex: 1;
}

.artifact-name {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 2px 0;
  color: var(--td-text-color-primary);
}

.artifact-sub {
  font-size: 11px;
  color: var(--td-text-color-secondary);
}

.artifact-action {
  display: flex;
  align-items: center;
  gap: 12px;
  .artifact-time {
    font-size: 11px;
    color: var(--td-text-color-placeholder);
  }
}

.recent-task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-timeline-item {
  padding: 10px 12px;
  border-radius: 6px;
  background: var(--td-bg-color-secondarycontainer);
  cursor: pointer;
  display: flex;
  flex-direction: column;

  &:hover {
    background: var(--td-brand-color-light);
  }
}

.task-status-badge {
  margin-bottom: 4px;
}

.task-title {
  font-size: 13px;
  font-weight: 500;
  margin: 0 0 4px 0;
  color: var(--td-text-color-primary);
}

.task-time {
  font-size: 11px;
  color: var(--td-text-color-placeholder);
}

.metrics-summary-card {
  background: linear-gradient(135deg, #f0fdf4 0%, #e6f4ea 100%);
  border-color: #b7eb8f;
}

.metrics-title {
  font-size: 14px;
  font-weight: 600;
  color: #135200;
  margin: 0 0 16px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.metric-item {
  display: flex;
  flex-direction: column;
  .metric-value {
    font-size: 18px;
    font-weight: 700;
    color: #274e13;
  }
  .metric-label {
    font-size: 11px;
    color: #5b8c00;
  }
}

.empty-state {
  padding: 24px;
  text-align: center;
  color: var(--td-text-color-placeholder);
  font-size: 13px;
}
</style>
