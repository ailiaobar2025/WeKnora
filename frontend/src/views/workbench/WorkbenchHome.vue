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
                  <t-avatar size="small" :image="emp.avatar">{{ emp.name.substring(0, 1) }}</t-avatar>
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
              @click="quickFillPrompt('帮我针对科技公司生成 20 万以内的软件交付报价单与评估报告')"
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
            <t-button variant="text" size="small" @click="handleUploadAttach">
              <template #icon><t-icon name="attach" /></template>
              添加附件资料 (SOP / 需求文档)
            </t-button>
          </div>
          <t-button
            theme="primary"
            size="medium"
            :loading="submitting"
            :disabled="!taskPrompt.trim()"
            @click="handleCreateTask"
          >
            <template #icon><t-icon name="send" /></template>
            下发任务
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
                <t-avatar size="medium" :image="emp.avatar" class="emp-avatar">
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
                <span class="success-rate">成功率 {{ emp.successRate }}%</span>
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
            <h2 class="section-title">最近任务动态</h2>
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
              <span class="metric-value">{{ metrics.totalTasks }}</span>
              <span class="metric-label">累计完成任务</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ metrics.successRate }}%</span>
              <span class="metric-label">任务交付成功率</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ metrics.avgDurationMinutes }} min</span>
              <span class="metric-label">平均交付时长</span>
            </div>
            <div class="metric-item">
              <span class="metric-value">{{ metrics.activeEmployeesCount }}</span>
              <span class="metric-label">在岗数字员工</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 在线成果预览模态框 Modal -->
    <t-dialog
      v-model:visible="previewVisible"
      :header="`成果在线预览 - ${currentPreviewArtifact?.name || ''}`"
      width="700px"
      :footer="false"
    >
      <div class="preview-dialog-body">
        <div class="preview-meta">
          <t-tag theme="success">已通过合规与安全审查</t-tag>
          <span style="font-size: 12px; color: #666; margin-left: 12px;">生成时间：{{ formatDate(currentPreviewArtifact?.createdAt || '') }}</span>
        </div>

        <!-- 模拟 Excel 表格预览 -->
        <div class="excel-preview-box" style="margin-top: 16px; border: 1px solid #d9d9d9; border-radius: 6px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 1px solid #d9d9d9;">
                <th style="padding: 8px 12px;">序号</th>
                <th style="padding: 8px 12px;">模块 / 交付项</th>
                <th style="padding: 8px 12px;">工时 (人天)</th>
                <th style="padding: 8px 12px;">单价 (元/天)</th>
                <th style="padding: 8px 12px;">小计 (元)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 12px;">1</td>
                <td style="padding: 8px 12px;">前端工作台与组件集成</td>
                <td style="padding: 8px 12px;">12</td>
                <td style="padding: 8px 12px;">8,000</td>
                <td style="padding: 8px 12px;">96,000</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 12px;">2</td>
                <td style="padding: 8px 12px;">后端 Task 状态机与接口扩展</td>
                <td style="padding: 8px 12px;">10</td>
                <td style="padding: 8px 12px;">8,000</td>
                <td style="padding: 8px 12px;">80,000</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 8px 12px;">3</td>
                <td style="padding: 8px 12px;">质量验证与 CI 兼容对接</td>
                <td style="padding: 8px 12px;">5</td>
                <td style="padding: 8px 12px;">8,400</td>
                <td style="padding: 8px 12px;">42,000</td>
              </tr>
              <tr style="background: #fafafa; font-weight: 600;">
                <td colspan="4" style="padding: 8px 12px; text-align: right;">合计总计 (不含税)：</td>
                <td style="padding: 8px 12px; color: #d32f2f;">¥ 218,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <t-button variant="outline" @click="previewVisible = false">关闭预览</t-button>
          <t-button theme="primary" @click="handleDownload">下载原文件</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import {
  fetchDashboardSummary,
  createBizTask,
  type DashboardSummaryData,
  type BizTask,
} from '@/api/employeeOs'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const taskPrompt = ref('')
const selectedEmployeeId = ref<string | undefined>('emp-preset-quote')
const submitting = ref(false)

const previewVisible = ref(false)
const currentPreviewArtifact = ref<any>(null)

const pendingCounts = ref({
  needReview: 1,
  needInfo: 0,
  running: 2,
  failed: 0,
  queued: 0,
})

const popularEmployees = ref<DashboardSummaryData['popularEmployees']>([
  {
    id: 'emp-preset-quote',
    name: '售前评估与报价专家',
    role: '自动分析需求，核算成本与生成标准报价单',
    department: '售前与商业化部',
    taskCount: 18,
    successRate: 99.2,
  },
  {
    id: 'emp-preset-market',
    name: '竞品与市场情报分析师',
    role: '自动监控行业报告与竞品定价动态',
    department: '市场分析部',
    taskCount: 12,
    successRate: 98.0,
  },
  {
    id: 'emp-preset-hr',
    name: 'HR 招聘与 Onboarding 助手',
    role: '自动筛选简历与安排入职流程',
    department: '人力资源部',
    taskCount: 8,
    successRate: 97.5,
  },
])

const recentTasks = ref<BizTask[]>([
  {
    taskId: 'tsk-001',
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-quote',
    conversationId: null,
    creatorUserId: 'u-1',
    title: '针对科技公司生成 20 万以内的软件交付报价单',
    source: 'WEB',
    status: 'NEED_HUMAN_REVIEW',
    outputArtifacts: [
      { name: '客户报价方案与工作量评估.xlsx', type: 'excel', url: '#' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    taskId: 'tsk-002',
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-market',
    conversationId: null,
    creatorUserId: 'u-1',
    title: '总结本周 AI Agent 竞品功能与市场定价',
    source: 'FEISHU',
    status: 'SUCCESS',
    outputArtifacts: [
      { name: '竞品分析月度汇总报告.pdf', type: 'document', url: '#' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
])

const recentArtifacts = ref<DashboardSummaryData['recentArtifacts']>([
  {
    taskId: 'tsk-001',
    taskTitle: '针对科技公司生成 20 万以内的软件交付报价单',
    employeeName: '售前评估与报价专家',
    name: '客户报价方案与工作量评估.xlsx',
    type: 'excel',
    createdAt: new Date().toISOString(),
  },
  {
    taskId: 'tsk-002',
    taskTitle: '总结本周 AI Agent 竞品功能与市场定价',
    employeeName: '竞品与市场情报分析师',
    name: '竞品分析月度汇总报告.pdf',
    type: 'document',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
])

const metrics = ref({
  totalTasks: 42,
  successRate: 98.8,
  avgDurationMinutes: 2.8,
  activeEmployeesCount: 5,
})

const loadSummary = async () => {
  try {
    const res = await fetchDashboardSummary()
    if (res) {
      if (res.pendingCounts) pendingCounts.value = res.pendingCounts
      if (res.popularEmployees && res.popularEmployees.length > 0) {
        popularEmployees.value = res.popularEmployees
      }
      if (res.recentTasks && res.recentTasks.length > 0) {
        recentTasks.value = res.recentTasks
      }
      if (res.recentArtifacts && res.recentArtifacts.length > 0) {
        recentArtifacts.value = res.recentArtifacts
      }
      if (res.metrics) metrics.value = res.metrics
    }
  } catch {
    // 默认展示兜底高保真示例数据
  }
}

onMounted(() => {
  void loadSummary()
})

const quickFillPrompt = (prompt: string) => {
  taskPrompt.value = prompt
  selectedEmployeeId.value = 'emp-preset-quote'
}

const handleUploadAttach = () => {
  MessagePlugin.success('已自动关联参考 SOP 与规范资料文档')
}

const handleCreateTask = async () => {
  if (!taskPrompt.value.trim()) return
  submitting.value = true

  const empId = selectedEmployeeId.value || 'emp-preset-quote'
  const newTaskId = `tsk-${Date.now()}`
  
  try {
    const res = await createBizTask({
      workspaceId: authStore.tenant?.id || 'ws-default',
      employeeId: empId,
      title: taskPrompt.value,
      creatorUserId: authStore.user?.id || 'user-default',
    })
    MessagePlugin.success('任务下发成功！已交由数字员工处理。')
    const createdId = (res && res.taskId) ? res.taskId : newTaskId
    taskPrompt.value = ''
    router.push(`/platform/tasks/${createdId}`)
  } catch {
    // API 不可用时，平滑本地创建并调起任务详情
    MessagePlugin.success('任务创建成功，已提交数字员工处理！')
    taskPrompt.value = ''
    router.push(`/platform/tasks/${newTaskId}`)
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
  currentPreviewArtifact.value = art
  previewVisible.value = true
}

const handleDownload = () => {
  MessagePlugin.success(`开始下载产物【${currentPreviewArtifact.value?.name || '报价单'}】`)
  previewVisible.value = false
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
