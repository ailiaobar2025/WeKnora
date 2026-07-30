<template>
  <t-loading :loading="loading">
  <div v-if="task" class="task-detail-container">
    <!-- 顶部 Task 头部导航与操作 -->
    <div class="detail-header-card">
      <div class="header-back">
        <t-button variant="text" size="small" @click="goBack">
          <template #icon><t-icon name="chevron-left" /></template>
          返回任务列表
        </t-button>
        <span class="divider">/</span>
        <span class="task-id-badge">{{ task.taskId }}</span>
      </div>

      <div class="header-main-row">
        <div class="header-info">
          <div class="title-with-status">
            <h1 class="task-main-title">{{ task.title }}</h1>
            <t-tag :theme="getStatusTheme(task.status)" size="medium">
              {{ getStatusLabel(task.status) }}
            </t-tag>
          </div>
          <div class="task-sub-meta">
            <span>负责员工：<strong>{{ getEmployeeName(task.employeeId) }}</strong></span>
            <span class="meta-dot">•</span>
            <span>发起渠道：<strong>{{ task.source || 'WEB' }}</strong></span>
            <span class="meta-dot">•</span>
            <span>发起时间：{{ formatDate(task.createdAt) }}</span>
          </div>
        </div>

        <div class="header-actions">
          <t-button
            v-if="task.status === 'NEED_HUMAN_REVIEW'"
            theme="warning"
            size="medium"
            @click="activeTab = 'timeline'"
          >
            <template #icon><t-icon name="user-safety" /></template>
            处理审批
          </t-button>

          <t-button
            v-if="task.status === 'SUCCESS'"
            theme="primary"
            size="medium"
            @click="activeTab = 'artifacts'"
          >
            <template #icon><t-icon name="download" /></template>
            查看成果产物
          </t-button>
        </div>
      </div>

      <!-- 四个核心页签导航 -->
      <div class="detail-tabs">
        <t-tabs v-model="activeTab">
          <t-tab-panel value="overview" label="📌 任务概览" />
          <t-tab-panel value="conversation" label="💬 沟通记录" />
          <t-tab-panel value="timeline" label="⏱️ 执行时间线与审批" />
          <t-tab-panel value="artifacts" label="📁 交付成果" />
        </t-tabs>
      </div>
    </div>

    <!-- 页签内容区域 -->
    <div class="detail-body">
      <!-- 1. 概览页签 -->
      <div v-if="activeTab === 'overview'" class="tab-content overview-panel">
        <div class="overview-grid">
          <div class="info-block">
            <h3 class="block-title">任务目标</h3>
            <p class="block-text">{{ task.title }}</p>
          </div>

          <div class="info-block">
            <h3 class="block-title">执行追踪</h3>
            <p class="block-text">Session：{{ task.conversationId || '-' }}</p>
            <p class="block-text">Execution：{{ task.executionId || '-' }}</p>
            <p class="block-text">Assistant Message：{{ task.assistantMessageId || '-' }}</p>
          </div>

          <div class="info-block">
            <h3 class="block-title">执行状态</h3>
            <p class="block-text">进度：{{ task.progress }}%</p>
            <p class="block-text">开始时间：{{ formatDate(task.startedAt) || '-' }}</p>
            <p class="block-text">完成时间：{{ formatDate(task.completedAt) || '-' }}</p>
          </div>

          <div class="info-block">
            <h3 class="block-title">异常信息</h3>
            <p class="block-text">{{ task.errorMessage || '无' }}</p>
          </div>
        </div>
      </div>

      <!-- 2. 沟通记录页签 -->
      <div v-if="activeTab === 'conversation'" class="tab-content chat-panel">
        <div class="empty-state">
          <t-icon name="chat" size="36px" style="color: #999;" />
          <p>当前任务接口暂未返回沟通消息</p>
        </div>
      </div>

      <!-- 3. 执行时间线与审批页签 -->
      <div v-if="activeTab === 'timeline'" class="tab-content timeline-panel">
        <div class="timeline-wrapper">
          <t-timeline>
            <t-timeline-item :label="formatDate(task.createdAt)" dot-color="success">
              <h4 class="step-title">任务已创建</h4>
              <p class="step-desc">任务编号：{{ task.taskId }}</p>
            </t-timeline-item>

            <t-timeline-item v-if="task.startedAt" :label="formatDate(task.startedAt)" dot-color="primary">
              <h4 class="step-title">WeKnora 执行已启动</h4>
              <p class="step-desc">Execution：{{ task.executionId }}</p>
            </t-timeline-item>

            <t-timeline-item v-if="task.status === 'NEED_HUMAN_REVIEW'" label="等待处理" dot-color="warning">
              <h4 class="step-title">WeKnora 请求人工审批</h4>
              <p class="step-desc">Approval：{{ task.pendingApprovalId }}</p>
              <div class="approval-card">
                <div class="approval-header">
                  <t-icon name="user-safety" size="20px" style="color: #ed7b14;" />
                  <span class="approval-title">提交审批指令后，任务将恢复执行并等待后台终态</span>
                </div>
                <div class="approval-body">
                  <div class="field-row">
                    <span class="label">申请员工：</span>
                    <span class="val">{{ getEmployeeName(task.employeeId) }}</span>
                  </div>
                  <div class="field-row">
                    <span class="label">任务名称：</span>
                    <span class="val" style="color: #274e13; font-weight: 600;">{{ task.title }}</span>
                  </div>
                  <div class="field-row">
                    <span class="label">流转批注：</span>
                    <t-input v-model="reviewComment" placeholder="请输入审批批注（可选）..." />
                  </div>
                </div>
                <div class="approval-actions">
                  <t-button
                    theme="danger"
                    variant="outline"
                    size="small"
                    :loading="reviewing"
                    @click="handleReview('REJECT')"
                  >
                    驳回
                  </t-button>
                  <t-button
                    theme="primary"
                    size="small"
                    :loading="reviewing"
                    @click="handleReview('APPROVE')"
                  >
                    批准并继续执行
                  </t-button>
                </div>
              </div>
            </t-timeline-item>

            <t-timeline-item
              :label="formatDate(task.completedAt) || '当前状态'"
              :dot-color="getTimelineColor(task.status)"
            >
              <h4 class="step-title">{{ getStatusLabel(task.status) }}</h4>
              <p v-if="task.errorMessage" class="step-desc">{{ task.errorMessage }}</p>
            </t-timeline-item>
          </t-timeline>
        </div>
      </div>

      <!-- 4. 交付成果页签 -->
      <div v-if="activeTab === 'artifacts'" class="tab-content artifacts-panel">
        <div v-if="!task.outputArtifacts || task.outputArtifacts.length === 0" class="empty-state">
          <t-icon name="file-unknown" size="36px" style="color: #999;" />
          <p>{{ task.status === 'SUCCESS' ? '任务已完成，但后台未归档成果' : '后台尚未归档成果' }}</p>
        </div>

        <div v-else class="artifacts-grid">
          <div v-for="art in task.outputArtifacts" :key="art.artifactId" class="artifact-card">
            <div class="art-card-top">
              <t-icon :name="getArtifactIcon(art.type)" size="36px" style="color: var(--td-brand-color);" />
              <div class="art-info">
                <h4 class="art-title">{{ art.name }}</h4>
                <span class="art-size">{{ art.type }} · {{ formatDate(art.createdAt) }}</span>
              </div>
            </div>
            <div class="art-card-actions">
              <t-button theme="primary" size="small" @click="openArtifact(art.url)">
                <template #icon><t-icon name="browse" /></template>
                打开成果
              </t-button>
            </div>
          </div>
        </div>
      </div>
    </div>

  </div>
  <div v-else class="task-detail-container empty-state">
    <t-icon name="error-circle" size="36px" style="color: #999;" />
    <p>{{ loadError || '任务不存在或无权访问' }}</p>
    <t-button variant="outline" @click="goBack">返回任务列表</t-button>
  </div>
  </t-loading>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { fetchAvailableEmployees } from '@/api/employeeOs'
import { useTaskStore } from '@/stores/task'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const activeTab = ref((route.query.tab as string) || 'overview')
const reviewComment = ref('')
const reviewing = ref(false)
const loadError = ref('')
const employeeNames = ref<Record<string, string>>({})

const taskId = computed(() => route.params.taskId as string)
const task = computed(() => taskStore.getTaskById(taskId.value))
const loading = computed(() => taskStore.loading)

function errorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message
    if (typeof message === 'string' && message) return message
  }
  return fallback
}

onMounted(async () => {
  const [taskResult, employeeResult] = await Promise.allSettled([
    taskStore.loadTask(taskId.value),
    fetchAvailableEmployees(),
  ])
  if (taskResult.status === 'rejected') {
    loadError.value = errorMessage(taskResult.reason, '任务详情加载失败')
  }
  if (employeeResult.status === 'fulfilled') {
    employeeNames.value = Object.fromEntries(
      employeeResult.value.data.map((employee) => [employee.employeeId, employee.name]),
    )
  }
})

const goBack = () => {
  router.push('/platform/tasks')
}

const handleReview = async (action: 'APPROVE' | 'REJECT') => {
  if (!task.value) return
  reviewing.value = true
  try {
    await taskStore.reviewTask(task.value.taskId, action, reviewComment.value)
    MessagePlugin.success('审批指令已提交，任务已恢复执行并等待后台结果')
  } catch (error: unknown) {
    MessagePlugin.error(errorMessage(error, '审批提交失败'))
  } finally {
    reviewing.value = false
  }
}

const openArtifact = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer')
}

const getEmployeeName = (id: string) => employeeNames.value[id] || id

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

const getTimelineColor = (status: string) => {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED' || status === 'TIMEOUT') return 'danger'
  if (status === 'NEED_HUMAN_REVIEW' || status === 'NEED_INFO') return 'warning'
  return 'primary'
}

const getArtifactIcon = (type: string) => {
  if (type === 'excel' || type === 'sheet') return 'file-excel'
  if (type === 'pdf' || type === 'document') return 'file-pdf'
  return 'file'
}

const formatDate = (isoStr: string | null) => {
  if (!isoStr) return ''
  const d = new Date(isoStr)
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<style scoped lang="less">
.task-detail-container {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
}

.detail-header-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 20px 24px 0 24px;
  margin-bottom: 24px;
}

.header-back {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;

  .divider {
    color: var(--td-text-color-placeholder);
  }

  .task-id-badge {
    font-size: 12px;
    font-family: monospace;
    color: var(--td-text-color-secondary);
    background: var(--td-bg-color-secondarycontainer);
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.header-main-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 20px;
}

.title-with-status {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.task-main-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--td-text-color-primary);
  margin: 0;
}

.task-sub-meta {
  font-size: 13px;
  color: var(--td-text-color-secondary);

  .meta-dot {
    margin: 0 8px;
    color: var(--td-text-color-placeholder);
  }
}

.tab-content {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 24px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.info-block {
  background: var(--td-bg-color-secondarycontainer);
  border-radius: 8px;
  padding: 16px;

  .block-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 12px 0;
    color: var(--td-text-color-primary);
  }

  .block-text {
    font-size: 13px;
    color: var(--td-text-color-secondary);
    margin: 0;
    line-height: 1.6;
  }
}

.rule-list {
  margin: 0;
  padding-left: 18px;
  font-size: 13px;
  color: var(--td-text-color-secondary);
  line-height: 1.8;
}

.asset-tags {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.artifact-preview-box {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  padding: 12px 16px;
  border-radius: 6px;
}

.mock-chat-box {
  display: flex;
  flex-direction: column;
  gap: 16px;

  .chat-message {
    display: flex;
    gap: 12px;

    .msg-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: var(--td-brand-color-light);
      color: var(--td-brand-color);
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      flex-shrink: 0;
      &.assistant {
        background: #e6f4ea;
      }
    }

    .msg-content {
      background: var(--td-bg-color-secondarycontainer);
      padding: 12px 16px;
      border-radius: 8px;
      max-width: 80%;

      .msg-sender {
        font-size: 12px;
        font-weight: 600;
        color: var(--td-text-color-secondary);
        margin-bottom: 4px;
      }

      .msg-text {
        font-size: 13px;
        color: var(--td-text-color-primary);
        line-height: 1.6;

        p { margin: 0 0 8px 0; }
        ul { margin: 0; padding-left: 20px; }
      }
    }
  }
}

.timeline-wrapper {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px 0;

  .step-title {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px 0;
  }

  .step-desc {
    font-size: 12px;
    color: var(--td-text-color-secondary);
    margin: 0 0 12px 0;
  }
}

.approval-card {
  background: #fffbe6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 16px;
  margin-top: 12px;

  .approval-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    .approval-title {
      font-size: 13px;
      font-weight: 600;
      color: #873800;
    }
  }

  .approval-body {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;

    .field-row {
      display: flex;
      align-items: center;
      font-size: 13px;
      .label {
        width: 80px;
        color: var(--td-text-color-secondary);
      }
    }
  }

  .approval-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
  }
}

.artifacts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.artifact-card {
  border: 1px solid var(--td-component-border);
  border-radius: 8px;
  padding: 20px;
  background: var(--td-bg-color-container);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.art-card-top {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;

  .art-title {
    font-size: 15px;
    font-weight: 600;
    margin: 0 0 4px 0;
    color: var(--td-text-color-primary);
  }

  .art-size {
    font-size: 12px;
    color: var(--td-text-color-secondary);
  }
}

.art-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--td-text-color-placeholder);
}
</style>
