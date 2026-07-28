<template>
  <div class="task-list-container">
    <div class="task-list-header">
      <div class="header-left">
        <h2 class="page-title">企业任务中心</h2>
        <p class="page-subtitle">追溯数字员工从接收需求到完成交付的全链条异步任务状态与产物</p>
      </div>
      <t-button theme="primary" @click="goToWorkbench">
        <template #icon><t-icon name="add" /></template>
        下发新任务
      </t-button>
    </div>

    <!-- 筛选工具栏 -->
    <div class="filter-toolbar">
      <div class="filter-group">
        <t-radio-group v-model="scopeMode" variant="default-filled" @change="loadTasks">
          <t-radio-button value="mine">我的任务</t-radio-button>

          <t-radio-button value="team">团队任务</t-radio-button>
        </t-radio-group>

        <t-select
          v-model="statusFilter"
          placeholder="按状态筛选"
          clearable
          style="width: 180px;"
          @change="loadTasks"
        >
          <t-option value="QUEUED" label="排队中" />
          <t-option value="RUNNING" label="执行中" />
          <t-option value="NEED_HUMAN_REVIEW" label="待审批" />
          <t-option value="NEED_INFO" label="待补充资料" />
          <t-option value="SUCCESS" label="成功交付" />
          <t-option value="FAILED" label="异常中断" />
          <t-option value="CANCELLED" label="已取消" />
          <t-option value="TIMEOUT" label="超时终止" />
        </t-select>

        <t-input
          v-model="searchKey"
          placeholder="搜索任务名称/编号/交付成果..."
          clearable
          style="width: 260px;"
        >
          <template #prefix-icon><t-icon name="search" /></template>
        </t-input>
      </div>

      <div class="filter-actions">
        <t-button variant="outline" theme="default" @click="loadTasks">
          <template #icon><t-icon name="refresh" /></template>
          刷新
        </t-button>
      </div>
    </div>

    <!-- 任务列表数据表格与卡片视图 -->
    <div class="task-table-wrap">
      <t-loading :loading="loading">
        <t-table
          :data="filteredTasks"
          :columns="columns"
          row-key="taskId"
          size="medium"
          hover
          :empty="emptyText"
        >
          <template #status="{ row }">
            <t-tag :theme="getStatusTheme(row.status)">
              {{ getStatusLabel(row.status) }}
            </t-tag>
          </template>

          <template #employee="{ row }">
            <div class="employee-cell">
              <t-avatar size="small" theme="primary" style="margin-right: 8px;">
                {{ getEmployeeName(row.employeeId).substring(0, 1) }}
              </t-avatar>
              <span>{{ getEmployeeName(row.employeeId) }}</span>
            </div>
          </template>

          <template #artifacts="{ row }">
            <div v-if="row.outputArtifacts && row.outputArtifacts.length > 0" class="artifacts-cell">
              <t-tag size="small" theme="success" variant="light">
                📄 {{ row.outputArtifacts.length }} 份成果产物
              </t-tag>
            </div>
            <span v-else class="no-artifact">-</span>
          </template>

          <template #createdAt="{ row }">
            <span>{{ formatDate(row.createdAt) }}</span>
          </template>

          <template #action="{ row }">
            <div class="action-cell">
              <t-button variant="text" theme="primary" size="small" @click="openDetail(row.taskId)">
                查看详情
              </t-button>
              <t-button
                v-if="row.status === 'NEED_HUMAN_REVIEW'"
                variant="text"
                theme="warning"
                size="small"
                @click="openDetail(row.taskId, 'timeline')"
              >
                立即审批
              </t-button>
            </div>
          </template>
        </t-table>
      </t-loading>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { fetchTaskList, type BizTask } from '@/api/employeeOs'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const scopeMode = ref('mine')
const statusFilter = ref<string | undefined>((route.query.status as string) || undefined)
const searchKey = ref('')
const loading = ref(false)

const tasks = ref<BizTask[]>([
  {
    taskId: 'tsk-001',
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-quote',
    conversationId: 'conv-001',
    creatorUserId: 'u-1',
    title: '针对科技公司生成 20 万以内的软件交付报价单与评估报告',
    source: 'WEB',
    status: 'NEED_HUMAN_REVIEW',
    outputArtifacts: [
      { name: '客户报价方案与工作量评估.xlsx', type: 'excel' }
    ],
    createdAt: new Date().toISOString(),
  },
  {
    taskId: 'tsk-002',
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-market',
    conversationId: 'conv-002',
    creatorUserId: 'u-1',
    title: '总结本周 AI Agent 竞品功能与市场定价',
    source: 'FEISHU',
    status: 'SUCCESS',
    outputArtifacts: [
      { name: '竞品分析月度汇总报告.pdf', type: 'pdf' }
    ],
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    taskId: 'tsk-003',
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-hr',
    conversationId: 'conv-003',
    creatorUserId: 'u-1',
    title: '筛选高级前端工程师简历并生成面试考核提纲',
    source: 'WEB',
    status: 'RUNNING',
    outputArtifacts: null,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
])

const columns = [
  { colKey: 'taskId', title: '任务编号', width: 140 },
  { colKey: 'title', title: '任务描述', ellipsis: true },
  { colKey: 'employee', title: '负责数字员工', width: 200 },
  { colKey: 'status', title: '任务状态', width: 130 },
  { colKey: 'artifacts', title: '交付成果', width: 150 },
  { colKey: 'createdAt', title: '发起时间', width: 160 },
  { colKey: 'action', title: '操作', width: 160, fixed: 'right' },
]

const filteredTasks = computed(() => {
  return tasks.value.filter((t) => {
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (searchKey.value.trim()) {
      const k = searchKey.value.toLowerCase()
      const matchTitle = t.title.toLowerCase().includes(k)
      const matchId = t.taskId.toLowerCase().includes(k)
      if (!matchTitle && !matchId) return false
    }
    return true
  })
})

const emptyText = computed(() => {
  return loading.value ? '加载中...' : '暂无匹配的任务记录'
})

const loadTasks = async () => {
  loading.value = true
  try {
    const res = await fetchTaskList({
      workspaceId: authStore.tenant?.id,
      status: statusFilter.value,
    })
    if (res && res.data && res.data.length > 0) {
      tasks.value = res.data
    }
  } catch {
    // 兜底高保真示例
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  void loadTasks()
})

const goToWorkbench = () => {
  router.push('/platform/workbench')
}

const openDetail = (taskId: string, tab?: string) => {
  router.push({ path: `/platform/tasks/${taskId}`, query: tab ? { tab } : {} })
}

const getEmployeeName = (id: string) => {
  const map: Record<string, string> = {
    'emp-preset-quote': '售前评估与报价专家',
    'emp-preset-market': '竞品与市场情报分析师',
    'emp-preset-hr': 'HR 招聘与 Onboarding 助手',
  }
  return map[id] || id
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
  overflow-y: auto;
}

.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin: 0 0 4px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--td-text-color-secondary);
  margin: 0;
}

.filter-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  padding: 16px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 16px;
}

.task-table-wrap {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  padding: 16px;
}

.employee-cell {
  display: flex;
  align-items: center;
}

.no-artifact {
  color: var(--td-text-color-placeholder);
}

.action-cell {
  display: flex;
  gap: 8px;
}
</style>
