<template>
  <t-loading :loading="loading" class="task-detail-loading-wrapper">
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
        <t-loading :loading="loadingMessages">
          <div v-if="chatMessages && chatMessages.length > 0" class="conversation-history-list">
            <div
              v-for="msg in chatMessages"
              :key="msg.id || msg.created_at"
              class="chat-message-item"
              :class="`role-${msg.role}`"
            >
              <div class="msg-avatar">
                <t-avatar v-if="msg.role === 'user'" shape="circle" size="medium">用</t-avatar>
                <t-avatar v-else shape="circle" size="medium" style="background-color: var(--td-brand-color); color: #fff;">
                  🤖
                </t-avatar>
              </div>
              <div class="msg-content-box">
                <div class="msg-header-info">
                  <span class="msg-sender-name">{{ msg.role === 'user' ? '发起人' : getEmployeeName(task.employeeId) }}</span>
                  <span class="msg-time">{{ formatDate(msg.created_at || msg.createdAt) }}</span>
                </div>
                <div class="msg-body markdown-body" v-html="renderMsgContent(msg.content)"></div>
              </div>
            </div>

            <div class="conversation-actions-bar">
              <t-button theme="primary" variant="outline" size="medium" @click="goToChatSession">
                <template #icon><t-icon name="chat" /></template>
                💬 进入聊天窗口与数字员工继续沟通
              </t-button>
            </div>
          </div>

          <div v-else class="empty-state">
            <t-icon name="chat" size="36px" style="color: #999;" />
            <p>暂无沟通记录，或该任务尚未产生交互对话</p>
            <t-button v-if="task.conversationId" theme="primary" variant="text" @click="goToChatSession">
              跳转至关联会话页面
            </t-button>
          </div>
        </t-loading>
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
        <!-- 优先分发：显示独占二进制成果库或已归档成果 -->
        <div v-if="task.outputArtifacts && task.outputArtifacts.length > 0" class="artifacts-grid">
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

        <!-- 兜底与强化分发：自动从 AI 员工的终态回复提取并生成成果报告产物 -->
        <div v-else-if="latestAssistantSummary" class="executive-artifact-wrapper">
          <div class="executive-artifact-card">
            <div class="card-header-bar">
              <div class="title-meta">
                <t-icon name="file-markdown" size="24px" style="color: var(--td-brand-color);" />
                <div>
                  <h3 class="artifact-heading">【成果交付报告】{{ task.title }}</h3>
                  <span class="artifact-sub">负责员工：{{ getEmployeeName(task.employeeId) }} &nbsp;·&nbsp; 生成时间：{{ formatDate(task.completedAt || task.createdAt) }}</span>
                </div>
              </div>
              <div class="card-action-btns">
                <t-button theme="default" variant="outline" size="small" @click="copyArtifactText">
                  <template #icon><t-icon name="copy" /></template>
                  复制全文
                </t-button>
                <t-button theme="primary" size="small" @click="downloadArtifactMd">
                  <template #icon><t-icon name="download" /></template>
                  📄 下载交付文件 (.md)
                </t-button>
              </div>
            </div>

            <div class="card-body-content markdown-body" v-html="renderMsgContent(latestAssistantSummary)"></div>
          </div>
        </div>

        <div v-else class="empty-state">
          <t-icon name="file-unknown" size="36px" style="color: #999;" />
          <p>{{ task.status === 'SUCCESS' ? '任务已完成，但后台尚未生成文字交付成果' : '后台尚未归档成果' }}</p>
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
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { fetchAvailableEmployees } from '@/api/employeeOs'
import { useTaskStore } from '@/stores/task'
import { getMessageList } from '@/api/chat/index'
import { renderChatMarkdown } from '@/utils/chatMarkdownRenderer'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()

const activeTab = ref((route.query.tab as string) || 'overview')
const reviewComment = ref('')
const reviewing = ref(false)
const loadError = ref('')
const employeeNames = ref<Record<string, string>>({})

const chatMessages = ref<any[]>([])
const loadingMessages = ref(false)

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

const loadSessionMessages = async (sessionId: string) => {
  if (!sessionId || loadingMessages.value) return
  loadingMessages.value = true
  try {
    const res: any = await getMessageList({ session_id: sessionId, limit: 100, created_at: '' })
    if (res && res.data) {
      chatMessages.value = Array.isArray(res.data) ? res.data : []
    }
  } catch (err) {
    console.error('Failed to load session messages for task:', err)
  } finally {
    loadingMessages.value = false
  }
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

  if (task.value?.conversationId) {
    void loadSessionMessages(task.value.conversationId)
  }
})

watch(
  () => task.value?.conversationId,
  (newConvId) => {
    if (newConvId) void loadSessionMessages(newConvId)
  },
)

watch(activeTab, (newTab) => {
  if ((newTab === 'conversation' || newTab === 'artifacts') && task.value?.conversationId && chatMessages.value.length === 0) {
    void loadSessionMessages(task.value.conversationId)
  }
})

const latestAssistantSummary = computed(() => {
  if (!chatMessages.value || chatMessages.value.length === 0) return ''
  const assistantMsgs = chatMessages.value.filter((m) => m.role === 'assistant' || m.role === 'bot')
  if (assistantMsgs.length === 0) return ''
  const lastMsg = assistantMsgs[assistantMsgs.length - 1]
  return lastMsg.content || ''
})

const renderMsgContent = (rawText: string) => {
  if (!rawText) return ''
  return renderChatMarkdown(rawText, { streaming: false })
}

const goToChatSession = () => {
  if (task.value?.conversationId) {
    router.push(`/platform/chat/${task.value.conversationId}`)
  }
}

const downloadArtifactMd = () => {
  if (!latestAssistantSummary.value) {
    return MessagePlugin.warning('当前暂无可导出的交付成果')
  }
  const title = task.value?.title || '任务交付成果报告'
  const dateStr = new Date().toISOString().slice(0, 10)
  const filename = `${title}_${dateStr}.md`
  const blob = new Blob([`# ${title}\n\n> 负责员工：${getEmployeeName(task.value?.employeeId || '')}\n> 交付时间：${new Date().toLocaleString()}\n\n---\n\n${latestAssistantSummary.value}`], {
    type: 'text/markdown;charset=utf-8',
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
  MessagePlugin.success(`交付报告已成功导出为文件：${filename}`)
}

const copyArtifactText = async () => {
  if (!latestAssistantSummary.value) return
  try {
    await navigator.clipboard.writeText(latestAssistantSummary.value)
    MessagePlugin.success('成果内容已复制到剪贴板')
  } catch (err) {
    MessagePlugin.error('复制失败，请手动选择复制')
  }
}

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
.task-detail-loading-wrapper {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.task-detail-container {
  flex: 1;
  height: 100%;
  min-height: 0;
  padding: 24px 24px 60px 24px;
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

/* 沟通记录样式 */
.conversation-history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.chat-message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;

  &.role-user {
    flex-direction: row-reverse;

    .msg-content-box {
      background-color: #f0f7f4;
      border: 1px solid #d0e8dd;
      border-radius: 12px 2px 12px 12px;
    }

    .msg-header-info {
      text-align: right;
    }
  }

  &.role-assistant, &.role-bot {
    .msg-content-box {
      background-color: var(--td-bg-color-container);
      border: 1px solid var(--td-component-border);
      border-radius: 2px 12px 12px 12px;
    }
  }

  .msg-content-box {
    padding: 12px 16px;
    max-width: 85%;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  }

  .msg-header-info {
    font-size: 12px;
    color: var(--td-text-color-placeholder);
    margin-bottom: 6px;

    .msg-sender-name {
      font-weight: 600;
      color: var(--td-text-color-secondary);
      margin-right: 8px;
    }
  }

  .msg-body {
    font-size: 14px;
    line-height: 1.6;
    color: var(--td-text-color-primary);
    word-break: break-word;
  }
}

.conversation-actions-bar {
  display: flex;
  justify-content: center;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px dashed var(--td-component-border);
}

/* 交付成果报告卡片 */
.executive-artifact-wrapper {
  padding: 4px 0;
}

.executive-artifact-card {
  background: var(--td-bg-color-container);
  border: 1px solid var(--td-component-border);
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03);

  .card-header-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    margin-bottom: 20px;
    border-bottom: 1px solid var(--td-component-border);

    .title-meta {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .artifact-heading {
      margin: 0 0 4px 0;
      font-size: 17px;
      font-weight: 600;
      color: var(--td-text-color-primary);
    }

    .artifact-sub {
      font-size: 12px;
      color: var(--td-text-color-secondary);
    }

    .card-action-btns {
      display: flex;
      gap: 10px;
    }
  }

  .card-body-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--td-text-color-primary);
  }
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: var(--td-text-color-placeholder);
}
</style>
