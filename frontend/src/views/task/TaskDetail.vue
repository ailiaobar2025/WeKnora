<template>
  <div class="task-detail-container">
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
            <h3 class="block-title">任务真实目标与需求</h3>
            <p class="block-text">{{ task.title }}</p>
          </div>

          <div class="info-block">
            <h3 class="block-title">数字员工协同规则</h3>
            <ul class="rule-list">
              <li>以 <strong>{{ getEmployeeName(task.employeeId) }}</strong> 为主执行体。</li>
              <li>涉及关键方案或费用决策时，触发<strong>主管人工审批</strong>。</li>
              <li>最终产物格式约定为 <strong>标准交付件 (.xlsx / .pdf)</strong>。</li>
            </ul>
          </div>

          <div class="info-block">
            <h3 class="block-title">调用的企业资产</h3>
            <div class="asset-tags">
              <t-tag variant="outline" theme="primary">📚 2026_产品价格手册_v2.pdf</t-tag>
              <t-tag variant="outline" theme="primary">📐 软件交付工作量评估SOP.docx</t-tag>
            </div>
          </div>

          <div class="info-block">
            <h3 class="block-title">交付物规划</h3>
            <div class="artifact-preview-box">
              <t-icon name="file-excel" size="32px" style="color: #2e7d32;" />
              <div>
                <h4 style="margin: 0; font-size: 14px;">{{ task.title.substring(0, 16) }}_交付产物.xlsx</h4>
                <span style="font-size: 12px; color: var(--td-text-color-placeholder);">
                  {{ task.status === 'SUCCESS' ? '已生成并归档' : '处理中，待主管批准导出' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 沟通记录页签 -->
      <div v-if="activeTab === 'conversation'" class="tab-content chat-panel">
        <div class="mock-chat-box">
          <div v-for="(msg, idx) in chatMessages" :key="idx" :class="['chat-message', msg.role === 'user' ? 'user-msg' : 'assistant-msg']">
            <div :class="['msg-avatar', msg.role === 'assistant' ? 'assistant' : '']">
              {{ msg.role === 'user' ? 'U' : '🤖' }}
            </div>
            <div class="msg-content">
              <div class="msg-sender">{{ msg.role === 'user' ? '发起人' : getEmployeeName(task.employeeId) }}</div>
              <div class="msg-text" v-html="msg.text"></div>
            </div>
          </div>
        </div>

        <div class="chat-input-bar" style="margin-top: 20px; display: flex; gap: 12px;">
          <t-input
            v-model="newMsgText"
            placeholder="与数字员工就当前任务继续沟通追问..."
            @enter="handleSendMessage"
          />
          <t-button theme="primary" @click="handleSendMessage">发送</t-button>
        </div>
      </div>

      <!-- 3. 执行时间线与审批页签 -->
      <div v-if="activeTab === 'timeline'" class="tab-content timeline-panel">
        <div class="timeline-wrapper">
          <t-timeline mode="alternate">
            <t-timeline-item label="步骤 1" dot-color="success">
              <h4 class="step-title">接收客户资料与需求拆解</h4>
              <p class="step-desc">已确认需求：「{{ task.title }}」，解析关联 SOP 规范。</p>
            </t-timeline-item>

            <t-timeline-item label="步骤 2" dot-color="success">
              <h4 class="step-title">工作量核算与交付构建</h4>
              <p class="step-desc">使用预置 SOP 方案模型完成核算与交付草稿生成。</p>
            </t-timeline-item>

            <t-timeline-item label="步骤 3" :dot-color="task.status === 'SUCCESS' ? 'success' : task.status === 'NEED_HUMAN_REVIEW' ? 'warning' : 'danger'">
              <h4 class="step-title">主管人工审批打断 (Human-in-the-Loop)</h4>
              <p class="step-desc">
                {{ task.status === 'SUCCESS' ? '主管已批准，授权导出并下发交付成果。' : '系统触达人工审批关口，等待主管确认。' }}
              </p>

              <!-- 原位打断 ToolApprovalCard 卡片 -->
              <div v-if="task.status === 'NEED_HUMAN_REVIEW'" class="approval-card">
                <div class="approval-header">
                  <t-icon name="user-safety" size="20px" style="color: #ed7b14;" />
                  <span class="approval-title">需要业务主管批准后方可生成正式交付产物</span>
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
                    驳回重新核算
                  </t-button>
                  <t-button
                    theme="primary"
                    size="small"
                    :loading="reviewing"
                    @click="handleReview('APPROVE')"
                  >
                    批准下发交付物
                  </t-button>
                </div>
              </div>

              <div v-else-if="task.status === 'SUCCESS'" style="margin-top: 8px; font-size: 13px; color: #2e7d32;">
                ✅ 主管已通过审批并同意交付 (批注：同意下发，请注意按期保质交付)
              </div>
            </t-timeline-item>

            <t-timeline-item label="步骤 4" :dot-color="task.status === 'SUCCESS' ? 'success' : 'default'">
              <h4 class="step-title">生成正式交付产物与归档</h4>
              <p class="step-desc">
                {{ task.status === 'SUCCESS' ? '已成功导出 Excel 成果单并完成归档。' : '待主管批准后自动导出。' }}
              </p>
            </t-timeline-item>
          </t-timeline>
        </div>
      </div>

      <!-- 4. 交付成果页签 -->
      <div v-if="activeTab === 'artifacts'" class="tab-content artifacts-panel">
        <div v-if="!task.outputArtifacts || task.outputArtifacts.length === 0" class="empty-state">
          <t-icon name="file-unknown" size="36px" style="color: #999;" />
          <p>任务尚未生成交付产物，请先在【执行时间线】完成主管审批</p>
          <t-button theme="primary" size="small" style="margin-top: 12px;" @click="activeTab = 'timeline'">
            去处理审批
          </t-button>
        </div>

        <div v-else class="artifacts-grid">
          <div v-for="(art, idx) in task.outputArtifacts" :key="idx" class="artifact-card">
            <div class="art-card-top">
              <t-icon :name="getArtifactIcon(art.type)" size="36px" style="color: var(--td-brand-color);" />
              <div class="art-info">
                <h4 class="art-title">{{ art.name }}</h4>
                <span class="art-size">正式版本 v1.0 • 已通过主管审批</span>
              </div>
            </div>
            <div class="art-card-actions">
              <t-button variant="outline" size="small" @click="previewArtifact(art)">
                <template #icon><t-icon name="browse" /></template>
                在线预览
              </t-button>
              <t-button theme="primary" size="small" @click="downloadArtifact(art)">
                <template #icon><t-icon name="download" /></template>
                下载 Excel
              </t-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 在线成果预览 Modal -->
    <t-dialog
      v-model:visible="previewVisible"
      :header="`成果在线预览 - ${currentPreviewArtifact?.name || ''}`"
      width="750px"
      :footer="false"
    >
      <div class="preview-dialog-body">
        <div class="preview-meta" style="display: flex; align-items: center; justify-content: space-between;">
          <t-tag theme="success">已通过主管审批与合规审查</t-tag>
          <span style="font-size: 12px; color: #666;">导出生效时间：{{ formatDate(task.createdAt) }}</span>
        </div>

        <!-- 模拟 Excel 表格预览 -->
        <div class="excel-preview-box" style="margin-top: 16px; border: 1px solid #d9d9d9; border-radius: 6px; overflow: hidden;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12px; text-align: left;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 1px solid #d9d9d9;">
                <th style="padding: 10px 12px;">序号</th>
                <th style="padding: 10px 12px;">模块 / 交付项</th>
                <th style="padding: 10px 12px;">工时 (人天)</th>
                <th style="padding: 10px 12px;">单价 (元/天)</th>
                <th style="padding: 10px 12px;">小计 (元)</th>
              </tr>
            </thead>
            <tbody>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 12px;">1</td>
                <td style="padding: 10px 12px;">{{ task.title }} - 核心交付模块</td>
                <td style="padding: 10px 12px;">12</td>
                <td style="padding: 10px 12px;">8,000</td>
                <td style="padding: 10px 12px;">96,000</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 12px;">2</td>
                <td style="padding: 10px 12px;">SOP 校验与数据打通</td>
                <td style="padding: 10px 12px;">10</td>
                <td style="padding: 10px 12px;">8,000</td>
                <td style="padding: 10px 12px;">80,000</td>
              </tr>
              <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px 12px;">3</td>
                <td style="padding: 10px 12px;">质量验证与合规流转</td>
                <td style="padding: 10px 12px;">5</td>
                <td style="padding: 10px 12px;">8,400</td>
                <td style="padding: 10px 12px;">42,000</td>
              </tr>
              <tr style="background: #fafafa; font-weight: 600;">
                <td colspan="4" style="padding: 10px 12px; text-align: right;">合计总核算 (不含税)：</td>
                <td style="padding: 10px 12px; color: #d32f2f; font-size: 14px;">¥ 218,000.00</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div style="margin-top: 20px; display: flex; justify-content: flex-end; gap: 12px;">
          <t-button variant="outline" @click="previewVisible = false">关闭窗口</t-button>
          <t-button theme="primary" @click="downloadArtifact(currentPreviewArtifact)">下载 Excel 产物</t-button>
        </div>
      </div>
    </t-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { useTaskStore } from '@/stores/task'
import { useAuthStore } from '@/stores/auth'
import type { BizTask } from '@/api/employeeOs'

const route = useRoute()
const router = useRouter()
const taskStore = useTaskStore()
const authStore = useAuthStore()

const activeTab = ref((route.query.tab as string) || 'overview')
const reviewComment = ref('')
const reviewing = ref(false)

const previewVisible = ref(false)
const currentPreviewArtifact = ref<any>(null)
const newMsgText = ref('')

const taskId = computed(() => (route.params.taskId as string) || 'tsk-001')

const task = computed<BizTask>(() => {
  const found = taskStore.getTaskById(taskId.value)
  if (found) return found
  return {
    taskId: taskId.value,
    workspaceId: 'ws-demo',
    employeeId: 'emp-preset-quote',
    conversationId: 'conv-001',
    creatorUserId: 'u-1',
    title: '针对科技公司生成 20 万以内的软件交付报价单与评估报告',
    source: 'WEB',
    status: 'NEED_HUMAN_REVIEW',
    outputArtifacts: [
      { name: '客户报价方案与工作量评估.xlsx', type: 'excel', url: '#' }
    ],
    createdAt: new Date().toISOString(),
  }
})

const chatMessages = ref<Array<{ role: string; text: string }>>([])

function initChatMessages() {
  chatMessages.value = [
    {
      role: 'user',
      text: task.value.title,
    },
    {
      role: 'assistant',
      text: `<p>已接收任务：「<strong>${task.value.title}</strong>」！正在检索企业 SOP 规范。</p>
      <p>责任数字员工：<strong>${getEmployeeName(task.value.employeeId)}</strong>。</p>
      <p>已生成交付草案与审批数据流，正等待主管人工审批确认。</p>`,
    },
  ]
}

watch(() => task.value.title, () => {
  initChatMessages()
}, { immediate: true })

onMounted(() => {
  void taskStore.loadTasks()
})

const goBack = () => {
  router.push('/platform/tasks')
}

const handleReview = async (action: 'APPROVE' | 'REJECT') => {
  reviewing.value = true
  try {
    await taskStore.reviewTask(
      task.value.taskId,
      action,
      authStore.user?.id || 'u-admin',
      reviewComment.value
    )
    if (action === 'APPROVE') {
      MessagePlugin.success('已成功批准该任务执行！系统已导出成果产物。')
      activeTab.value = 'artifacts'
    } else {
      MessagePlugin.warning('任务已被主管驳回。')
    }
  } finally {
    reviewing.value = false
  }
}

const handleSendMessage = () => {
  if (!newMsgText.value.trim()) return
  const txt = newMsgText.value
  chatMessages.value.push({ role: 'user', text: txt })
  newMsgText.value = ''

  setTimeout(() => {
    chatMessages.value.push({
      role: 'assistant',
      text: `针对您提出的问题 "${txt}"，数字员工【${getEmployeeName(task.value.employeeId)}】已重新计算评估逻辑并记录归档。`,
    })
  }, 600)
}

const previewArtifact = (art: any) => {
  currentPreviewArtifact.value = art || { name: `${task.value.title.substring(0, 16)}_交付物.xlsx`, type: 'excel' }
  previewVisible.value = true
}

const downloadArtifact = (art: any) => {
  MessagePlugin.success(`开始下载产物【${art?.name || '交付文件.xlsx'}】`)
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

const getArtifactIcon = (type: string) => {
  if (type === 'excel' || type === 'sheet') return 'file-excel'
  if (type === 'pdf' || type === 'document') return 'file-pdf'
  return 'file'
}

const formatDate = (isoStr: string) => {
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
