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
            <span>发起渠道：<strong>{{ task.source }}</strong></span>
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
            <h3 class="block-title">任务目标与需求描述</h3>
            <p class="block-text">{{ task.title }}</p>
          </div>

          <div class="info-block">
            <h3 class="block-title">数字员工协同规则</h3>
            <ul class="rule-list">
              <li>以 <strong>{{ getEmployeeName(task.employeeId) }}</strong> 为主执行体。</li>
              <li>涉及报价金额突破 20 万元时，强制触发<strong>主管人工审批</strong>。</li>
              <li>最终产物格式约定为 <strong>Excel 标准工作表 (.xlsx)</strong>。</li>
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
                <h4 style="margin: 0; font-size: 14px;">客户报价方案与工作量评估.xlsx</h4>
                <span style="font-size: 12px; color: var(--td-text-color-placeholder);">
                  {{ task.outputArtifacts ? '已生成并归档' : '正在分析计算中...' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 沟通记录页签 -->
      <div v-if="activeTab === 'conversation'" class="tab-content chat-panel">
        <div class="mock-chat-box">
          <div class="chat-message user-msg">
            <div class="msg-avatar">U</div>
            <div class="msg-content">
              <div class="msg-sender">用户</div>
              <div class="msg-text">{{ task.title }}</div>
            </div>
          </div>

          <div class="chat-message assistant-msg">
            <div class="msg-avatar assistant">🤖</div>
            <div class="msg-content">
              <div class="msg-sender">{{ getEmployeeName(task.employeeId) }}</div>
              <div class="msg-text">
                <p>收到任务请求！正在检索关联的企业资产：<code>2026_产品价格手册_v2.pdf</code> 与 <code>软件交付工作量评估SOP.docx</code>。</p>
                <p>根据需求拆解，正在计算各模块人天成本：</p>
                <ul>
                  <li>前端工作台与组件集成：12 人天</li>
                  <li>后端 Task 状态机与 Webhook 对接：10 人天</li>
                  <li>测试与交付保障：5 人天</li>
                </ul>
                <p><strong>初步估算报价为：RMB 218,000 元。</strong></p>
                <p>⚠️ 提示：由于总报价超过 20 万元门槛，现已暂停流程并触发主管审批要求。</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. 执行时间线与审批页签 -->
      <div v-if="activeTab === 'timeline'" class="tab-content timeline-panel">
        <div class="timeline-wrapper">
          <t-timeline mode="alternate">
            <t-timeline-item label="步骤 1" dot-color="success">
              <h4 class="step-title">接收客户资料与需求拆解</h4>
              <p class="step-desc">已确认输入完整度 100%，解析关联 SOP 规范。</p>
            </t-timeline-item>

            <t-timeline-item label="步骤 2" dot-color="success">
              <h4 class="step-title">工作量核算与报价生成</h4>
              <p class="step-desc">使用预置 RAG 模型核算人天单价，算出系统总报价 RMB 218,000 元。</p>
            </t-timeline-item>

            <t-timeline-item label="步骤 3" dot-color="warning">
              <h4 class="step-title">主管人工审批打断 (Human-in-the-Loop)</h4>
              <p class="step-desc">系统检测到报价突破 20 万预警阈值。</p>

              <!-- 原位打断 ToolApprovalCard 卡片 -->
              <div class="approval-card">
                <div class="approval-header">
                  <t-icon name="user-safety" size="20px" style="color: #ed7b14;" />
                  <span class="approval-title">需要业务主管批准后方可生成正式报价单</span>
                </div>
                <div class="approval-body">
                  <div class="field-row">
                    <span class="label">申请员工：</span>
                    <span class="val">{{ getEmployeeName(task.employeeId) }}</span>
                  </div>
                  <div class="field-row">
                    <span class="label">申请金额：</span>
                    <span class="val" style="color: #d32f2f; font-weight: 600;">¥ 218,000.00</span>
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
                    批准下发报价单
                  </t-button>
                </div>
              </div>
            </t-timeline-item>

            <t-timeline-item label="步骤 4" :dot-color="task.status === 'SUCCESS' ? 'success' : 'default'">
              <h4 class="step-title">生成正式交付产物与归档</h4>
              <p class="step-desc">导出 Excel 报价单并更新状态至成功交付。</p>
            </t-timeline-item>
          </t-timeline>
        </div>
      </div>

      <!-- 4. 交付成果页签 -->
      <div v-if="activeTab === 'artifacts'" class="tab-content artifacts-panel">
        <div v-if="!task.outputArtifacts || task.outputArtifacts.length === 0" class="empty-state">
          <t-icon name="file-unknown" size="36px" style="color: #999;" />
          <p>任务尚未生成交付产物，或正在执行中</p>
        </div>

        <div v-else class="artifacts-grid">
          <div v-for="(art, idx) in task.outputArtifacts" :key="idx" class="artifact-card">
            <div class="art-card-top">
              <t-icon :name="getArtifactIcon(art.type)" size="36px" style="color: var(--td-brand-color);" />
              <div class="art-info">
                <h4 class="art-title">{{ art.name }}</h4>
                <span class="art-size">正式版本 v1.0 • 已通过合规审查</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { fetchTaskDetail, reviewBizTask, type BizTask } from '@/api/employeeOs'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref((route.query.tab as string) || 'overview')
const reviewComment = ref('')
const reviewing = ref(false)

const task = ref<BizTask>({
  taskId: (route.params.taskId as string) || 'tsk-001',
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
})

const loadDetail = async () => {
  const taskId = route.params.taskId as string
  if (!taskId) return
  try {
    const res = await fetchTaskDetail(taskId)
    if (res) {
      task.value = res
    }
  } catch {
    // 高保真兜底
  }
}

onMounted(() => {
  void loadDetail()
})

const goBack = () => {
  router.push('/platform/tasks')
}

const handleReview = async (action: 'APPROVE' | 'REJECT') => {
  reviewing.value = true
  try {
    await reviewBizTask(task.value.taskId, {
      action,
      reviewUserId: authStore.user?.id || 'u-admin',
      comment: reviewComment.value,
    })
    MessagePlugin.success(action === 'APPROVE' ? '已成功批准该任务执行！' : '已驳回该任务请求！')
    if (action === 'APPROVE') {
      task.value.status = 'SUCCESS'
      activeTab.value = 'artifacts'
    } else {
      task.value.status = 'FAILED'
    }
  } catch {
    MessagePlugin.error('审批处理失败，请重试')
  } finally {
    reviewing.value = false
  }
}

const previewArtifact = (art: any) => {
  MessagePlugin.info(`正在打开【${art.name}】预览窗口...`)
}

const downloadArtifact = (art: any) => {
  MessagePlugin.success(`开始下载产物【${art.name}】`)
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
