<template>
  <div class="task-list-container">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useTaskStore } from '@/stores/task'
import { MessagePlugin } from 'tdesign-vue-next'
import { fetchAvailableEmployees, type TaskStatus } from '@/api/employeeOs'

const router = useRouter()
const route = useRoute()
const taskStore = useTaskStore()

const viewScope = ref<'my' | 'team'>('my')
const selectedStatus = ref<TaskStatus | ''>((route.query.status as TaskStatus) || '')
const searchKeyword = ref('')
const loading = computed(() => taskStore.loading)
const employeeNames = ref<Record<string, string>>({})

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

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

async function loadTaskList(showSuccess = false) {
  try {
    await taskStore.loadTasks({
      status: selectedStatus.value || undefined,
      scope: viewScope.value,
      limit: 100,
    })
    if (showSuccess) MessagePlugin.success('已刷新最新任务列表')
  } catch (error: unknown) {
    MessagePlugin.error(errorMessage(error, '任务列表加载失败'))
  }
}

onMounted(() => {
  void loadTaskList()
  void fetchAvailableEmployees()
    .then((response) => {
      employeeNames.value = Object.fromEntries(
        response.data.map((employee) => [employee.employeeId, employee.name]),
      )
    })
    .catch(() => undefined)
})

watch([viewScope, selectedStatus], () => {
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
  await loadTaskList(true)
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
</style>
