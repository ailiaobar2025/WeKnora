<template>
  <div class="assistant-admin-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Know Hub</p>
        <h1>客户助手</h1>
      </div>
      <t-button theme="default" variant="outline" :loading="loading" @click="loadAll">刷新</t-button>
    </header>

    <t-loading :loading="loading" size="small">
      <t-alert v-if="error" theme="warning" :message="error" class="page-alert" />

      <div class="layout">
        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>Agent Template</h2>
              <p>全局模板不会展示给客户。</p>
            </div>
            <t-button theme="primary" @click="openTemplateCreate">新建模板</t-button>
          </div>

          <div v-if="templates.length" class="table-shell">
            <t-table row-key="id" :data="templates" :columns="templateColumns" size="medium" hover>
              <template #name="{ row }">
                <div class="primary-cell">
                  <span class="primary-cell__title">{{ row.name }}</span>
                  <span class="primary-cell__meta">{{ row.id }}</span>
                </div>
              </template>
              <template #status="{ row }">
                <t-tag :theme="statusTheme(row.status)" size="small" variant="light">
                  {{ statusLabel(row.status) }}
                </t-tag>
              </template>
              <template #description="{ row }">
                <span class="muted">{{ row.description || '暂无说明' }}</span>
              </template>
              <template #actions="{ row }">
                <div class="row-actions">
                  <t-button size="small" variant="text" @click="openTemplateEdit(row)">编辑</t-button>
                  <t-popconfirm
                    :content="`确认删除模板「${row.name}」？`"
                    :confirm-btn="{ content: '删除', theme: 'danger' }"
                    @confirm="removeTemplate(row)"
                  >
                    <t-button size="small" variant="text" theme="danger">删除</t-button>
                  </t-popconfirm>
                </div>
              </template>
            </t-table>
          </div>
          <t-empty v-else description="暂无模板" class="empty" />
        </section>

        <section class="panel">
          <div class="panel-header">
            <div>
              <h2>按业务空间分配助手</h2>
              <p>选择 workspace 后创建或维护该客户可用的助手。</p>
            </div>
            <t-button
              theme="primary"
              :disabled="!selectedWorkspaceId || !templates.length"
              @click="openAssistantCreate"
            >
              新建助手
            </t-button>
          </div>

          <div class="workspace-row">
            <label>业务空间</label>
            <t-select v-model="selectedWorkspaceId" :options="workspaceOptions" placeholder="请选择业务空间" filterable />
          </div>

          <div v-if="selectedWorkspaceId && assistants.length" class="table-shell">
            <t-table row-key="id" :data="assistants" :columns="assistantColumns" size="medium" hover>
              <template #assistant="{ row }">
                <div class="primary-cell">
                  <span class="primary-cell__title">{{ row.display_name || row.name }}</span>
                  <span class="primary-cell__meta">{{ row.name }}</span>
                </div>
              </template>
              <template #agent="{ row }">
                <span v-if="effectiveAgentId(row)" class="primary-cell__title">{{ boundAgentName(row) }}</span>
                <span v-else class="muted">未配置</span>
              </template>
              <template #availability="{ row }">
                <t-tag :theme="agentAvailability(row).theme" size="small" variant="light">
                  {{ agentAvailability(row).label }}
                </t-tag>
              </template>
              <template #template_id="{ row }">
                <span>{{ templateName(row.template_id) }}</span>
              </template>
              <template #status="{ row }">
                <t-tag :theme="statusTheme(row.status)" size="small" variant="light">
                  {{ statusLabel(row.status) }}
                </t-tag>
              </template>
              <template #actions="{ row }">
                <div class="row-actions">
                  <t-button size="small" variant="text" @click="openAssistantEdit(row)">编辑</t-button>
                  <t-popconfirm
                    :content="`确认删除助手「${row.display_name || row.name}」？`"
                    :confirm-btn="{ content: '删除', theme: 'danger' }"
                    @confirm="removeAssistant(row)"
                  >
                    <t-button size="small" variant="text" theme="danger">删除</t-button>
                  </t-popconfirm>
                </div>
              </template>
            </t-table>
          </div>
          <t-empty v-else-if="selectedWorkspaceId" description="当前业务空间尚未分配助手" class="empty" />
          <t-empty v-else description="请选择业务空间" class="empty" />
        </section>
      </div>
    </t-loading>

    <SettingDrawer
      v-model:visible="templateDialogVisible"
      :title="editingTemplateId ? '编辑模板' : '新建模板'"
      description="配置客户助手的默认能力基线，客户侧不会看到模板细节。"
      icon="layers"
      width="720px"
      :confirm-loading="saving"
      @confirm="saveTemplate"
    >
      <div class="product-form">
        <section class="form-section">
          <div class="form-section-head">
            <h3>模板信息</h3>
            <p>作为客户助手的默认能力基线，客户侧不会看到模板细节。</p>
          </div>
          <div class="form-grid">
            <label>
              模板名称
              <t-input v-model="templateForm.name" placeholder="例如：销售资料助手模板" />
            </label>
            <label>
              状态
              <t-select v-model="templateForm.status" :options="statusOptions" />
            </label>
            <label class="span-2">
              模板说明
              <t-textarea v-model="templateForm.description" :autosize="{ minRows: 2, maxRows: 4 }" />
            </label>
          </div>
        </section>

        <details class="advanced-section">
          <summary>高级配置（场景默认值）</summary>
          <div class="form-grid">
            <label class="span-2">
              提示词备注（不替代原生 Agent 提示词，仅作配置说明）
              <t-textarea v-model="templateForm.system_prompt" :autosize="{ minRows: 4, maxRows: 10 }" />
            </label>
            <label>
              知识范围 JSON（默认值）
              <t-textarea v-model="templateForm.knowledge_scope" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label>
              Agent 配置 JSON（可含默认 agent_id 作为回退）
              <t-textarea v-model="templateForm.agent_config" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label class="span-2">
              额度策略 JSON（默认值）
              <t-textarea v-model="templateForm.quota_strategy" :autosize="{ minRows: 4, maxRows: 8 }" />
            </label>
          </div>
        </details>
      </div>
    </SettingDrawer>

    <SettingDrawer
      v-model:visible="assistantDialogVisible"
      :title="editingAssistantId ? '编辑客户助手' : '新建客户助手'"
      description="把场景模板分配到客户空间，并绑定一个该客户租户可访问的 WeKnora 原生 Agent。"
      icon="user-talk"
      width="720px"
      :confirm-loading="saving"
      @confirm="saveAssistant"
    >
      <div class="product-form">
        <section class="form-section">
          <div class="form-section-head">
            <h3>客户与展示</h3>
            <p>助手分配到当前选中的业务空间，展示名称会出现在客户的新对话助手选择器中。</p>
          </div>
          <div class="form-grid">
            <label>
              客户空间
              <t-input :value="selectedWorkspace?.name || selectedWorkspaceId" readonly />
            </label>
            <label>
              场景模板（默认策略）
              <t-select
                v-model="assistantForm.template_id"
                :options="templateOptions"
                placeholder="请选择场景模板"
                filterable
                :disabled="Boolean(editingAssistantId)"
              />
            </label>
            <label>
              内部名称
              <t-input v-model="assistantForm.name" placeholder="例如：sales-assistant" />
            </label>
            <label>
              展示名称
              <t-input v-model="assistantForm.display_name" placeholder="例如：销售资料助手" />
            </label>
            <label>
              状态
              <t-select v-model="assistantForm.status" :options="statusOptions" />
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <h3>绑定原生 Agent <span class="required-mark">*</span></h3>
            <p>选择该客户租户可访问的 WeKnora 原生 Agent。提示词、模型、工具与知识库均由该 Agent 承载，客户助手不再单独配置这些内容。</p>
          </div>
          <t-alert
            v-if="weknoraAgentsError"
            theme="warning"
            :message="`无法代查可绑定 Agent：${weknoraAgentsError}。请确认管理员已授权访问该客户租户。`"
            class="form-alert"
          />
          <div class="form-grid">
            <label class="span-2">
              原生 Agent
              <t-select
                v-model="assistantForm.bound_agent_id"
                :options="weknoraAgentOptions"
                :placeholder="weknoraAgents.length ? '请选择原生 Agent' : '该客户租户暂无可绑定 Agent'"
                filterable
                :disabled="!weknoraAgents.length"
              />
            </label>
          </div>
          <div v-if="selectedAgent" class="agent-summary">
            <div class="agent-summary__row">
              <span class="agent-summary__label">模式</span>
              <span>{{ AGENT_MODE_LABELS[selectedAgent.agent_mode] || selectedAgent.agent_mode || '—' }}</span>
            </div>
            <div class="agent-summary__row">
              <span class="agent-summary__label">模型</span>
              <span>{{ selectedAgent.model_id || '—' }}</span>
            </div>
            <div class="agent-summary__row">
              <span class="agent-summary__label">知识来源</span>
              <span>{{ agentKbSummary(selectedAgent) }}</span>
            </div>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <h3>配额与高级覆盖</h3>
            <p>额度以预设为主；需要自定义时切换为「自定义（高级配置）」并以 JSON 覆盖。</p>
          </div>
          <div class="form-grid">
            <label>
              配额策略
              <t-select v-model="assistantQuotaPreset" :options="quotaPresetOptions" />
            </label>
          </div>
          <details class="advanced-section">
            <summary>高级配置</summary>
            <div v-if="assistantQuotaPreset === 'custom'" class="form-grid">
              <label class="span-2">
                覆盖额度策略 JSON
                <t-textarea v-model="assistantForm.quota_strategy" :autosize="{ minRows: 4, maxRows: 8 }" />
              </label>
            </div>
            <p v-else class="muted advanced-hint">
              当前预设：{{ quotaPresetOptions.find(option => option.value === assistantQuotaPreset)?.label }}。知识来源跟随绑定的原生 Agent，无需在此配置。
            </p>
          </details>
        </section>
      </div>
    </SettingDrawer>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { MessagePlugin } from 'tdesign-vue-next'
import SettingDrawer from '@/components/settings/SettingDrawer.vue'
import {
  createAgentTemplate,
  createWorkspaceCustomerAssistant,
  deleteAgentTemplate,
  deleteCustomerAssistant,
  getAdminWorkspaces,
  getAgentTemplates,
  getWorkspaceCustomerAssistants,
  getWorkspaceWeknoraAgents,
  updateAgentTemplate,
  updateCustomerAssistant,
  type KnowHubAgentTemplate,
  type KnowHubCustomerAssistant,
  type KnowHubWeknoraAgent,
  type KnowHubWorkspaceDetail,
} from '@/api/know-hub'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const templates = ref<KnowHubAgentTemplate[]>([])
const workspaces = ref<KnowHubWorkspaceDetail[]>([])
const assistants = ref<KnowHubCustomerAssistant[]>([])
const weknoraAgents = ref<KnowHubWeknoraAgent[]>([])
const weknoraAgentsError = ref('')
const selectedWorkspaceId = ref('')

const templateDialogVisible = ref(false)
const assistantDialogVisible = ref(false)
const editingTemplateId = ref('')
const editingAssistantId = ref('')
const assistantQuotaPreset = ref('')

const templateColumns = [
  { colKey: 'name', title: '模板', minWidth: 220 },
  { colKey: 'status', title: '状态', width: 96 },
  { colKey: 'description', title: '说明', minWidth: 220 },
  { colKey: 'actions', title: '操作', width: 128, align: 'right' as const },
]

const assistantColumns = [
  { colKey: 'assistant', title: '助手', minWidth: 200 },
  { colKey: 'agent', title: '绑定 Agent', minWidth: 200 },
  { colKey: 'availability', title: '可用性', width: 120 },
  { colKey: 'template_id', title: '模板', minWidth: 160 },
  { colKey: 'status', title: '状态', width: 88 },
  { colKey: 'actions', title: '操作', width: 128, align: 'right' as const },
]

const statusOptions = [
  { label: '启用', value: 'active' },
  { label: '停用', value: 'inactive' },
]

const quotaPresetOptions = [
  { label: '沿用模板默认', value: '' },
  { label: '试用标准额度', value: 'trial' },
  { label: '自定义（高级配置）', value: 'custom' },
]

const templateForm = reactive({
  name: '',
  description: '',
  system_prompt: '',
  knowledge_scope: '{}',
  agent_config: '{}',
  quota_strategy: '{}',
  status: 'active',
})

const assistantForm = reactive({
  name: '',
  display_name: '',
  template_id: '',
  status: 'active',
  // 绑定的 WeKnora 原生 Agent（主流程，必填）。Prompt/模型/知识库跟随该 Agent。
  bound_agent_id: '',
  quota_strategy: '',
})

const selectedWorkspace = computed(() => workspaces.value.find(w => w.id === selectedWorkspaceId.value))
const workspaceOptions = computed(() => workspaces.value.map(workspace => ({
  label: `${workspace.name} · ${workspace.owner_name || workspace.id}`,
  value: workspace.id,
})))
const templateOptions = computed(() => templates.value.map(template => ({
  label: template.name,
  value: template.id,
})))

const weknoraAgentOptions = computed(() => weknoraAgents.value.map(agent => ({
  label: agent.is_builtin ? `${agent.name}（内置）` : agent.name,
  value: agent.id,
})))

const selectedAgent = computed(() =>
  weknoraAgents.value.find(agent => agent.id === assistantForm.bound_agent_id),
)

function effectiveAgentId(assistant: KnowHubCustomerAssistant): string {
  const direct = (assistant.agent_config as Record<string, any> | null)?.agent_id
  if (direct) return String(direct)
  // 助手未直接绑定时回退到场景模板的默认 agent_id
  const template = templates.value.find(item => item.id === assistant.template_id)
  const fallback = (template?.agent_config as Record<string, any> | null)?.agent_id
  return fallback ? String(fallback) : ''
}

function agentAvailability(assistant: KnowHubCustomerAssistant): { label: string; theme: 'success' | 'warning' | 'default' } {
  const agentId = effectiveAgentId(assistant)
  if (!agentId) return { label: '未配置', theme: 'default' }
  if (weknoraAgents.value.some(agent => agent.id === agentId)) {
    return { label: '可用', theme: 'success' }
  }
  return { label: 'Agent 不可访问', theme: 'warning' }
}

function boundAgentName(assistant: KnowHubCustomerAssistant): string {
  const agentId = effectiveAgentId(assistant)
  const agent = weknoraAgents.value.find(item => item.id === agentId)
  return agent ? (agent.is_builtin ? `${agent.name}（内置）` : agent.name) : agentId
}

const AGENT_MODE_LABELS: Record<string, string> = {
  'quick-answer': '快速问答',
  'smart-reasoning': '智能推理',
}

function agentKbSummary(agent?: KnowHubWeknoraAgent): string {
  if (!agent) return ''
  if (agent.retrieve_kb_only_when_mentioned) return '仅 @ 提及时检索'
  switch (agent.kb_selection_mode) {
    case 'all': return '全部知识库'
    case 'selected': return `指定 ${agent.knowledge_bases.length} 个知识库`
    case 'none': return '不使用知识库'
    default: return agent.kb_selection_mode || '未知'
  }
}

function statusTheme(status: string): 'success' | 'default' {
  return status === 'active' ? 'success' : 'default'
}

function statusLabel(status: string): string {
  return status === 'active' ? '启用' : '停用'
}

function templateName(templateId: string): string {
  return templates.value.find(t => t.id === templateId)?.name || templateId
}

function parseJsonField(value: string, label: string, allowEmptyAsNull = false) {
  const trimmed = value.trim()
  if (!trimmed && allowEmptyAsNull) return null
  if (!trimmed) return {}
  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
      throw new Error(`${label} 必须是 JSON object`)
    }
    return parsed
  } catch (err: any) {
    throw new Error(`${label} 不是合法 JSON：${err?.message || err}`)
  }
}

function toJsonText(value: unknown, emptyAsBlank = false): string {
  if (value == null) return emptyAsBlank ? '' : '{}'
  return JSON.stringify(value, null, 2)
}

function assistantQuotaStrategyPayload() {
  if (assistantQuotaPreset.value === 'trial' && !assistantForm.quota_strategy.trim()) {
    return { preset: 'trial' }
  }
  return parseJsonField(assistantForm.quota_strategy, '覆盖额度策略', true)
}

async function loadAssistants() {
  if (!selectedWorkspaceId.value) {
    assistants.value = []
    return
  }
  assistants.value = await getWorkspaceCustomerAssistants(selectedWorkspaceId.value)
}

async function loadWeknoraAgents() {
  weknoraAgentsError.value = ''
  if (!selectedWorkspaceId.value) {
    weknoraAgents.value = []
    return
  }
  try {
    weknoraAgents.value = await getWorkspaceWeknoraAgents(selectedWorkspaceId.value)
  } catch (err: any) {
    // 代查失败不阻断主列表：可用性列会统一显示「Agent 不可访问」
    weknoraAgents.value = []
    weknoraAgentsError.value = err?.message || '无法代查该客户租户的可绑定 Agent'
  }
}

async function loadAll() {
  loading.value = true
  error.value = ''
  try {
    const [templatePayload, workspacePayload] = await Promise.all([
      getAgentTemplates(),
      getAdminWorkspaces(),
    ])
    templates.value = templatePayload
    workspaces.value = workspacePayload
    if (!selectedWorkspaceId.value && workspacePayload.length) {
      selectedWorkspaceId.value = workspacePayload[0].id
    }
    await Promise.all([loadAssistants(), loadWeknoraAgents()])
  } catch (err: any) {
    error.value = err?.message || '客户助手数据暂不可用'
  } finally {
    loading.value = false
  }
}

function openTemplateCreate() {
  editingTemplateId.value = ''
  Object.assign(templateForm, {
    name: '',
    description: '',
    system_prompt: '',
    knowledge_scope: '{}',
    agent_config: '{}',
    quota_strategy: '{}',
    status: 'active',
  })
  templateDialogVisible.value = true
}

function openTemplateEdit(template: KnowHubAgentTemplate) {
  editingTemplateId.value = template.id
  Object.assign(templateForm, {
    name: template.name,
    description: template.description,
    system_prompt: template.system_prompt,
    knowledge_scope: toJsonText(template.knowledge_scope),
    agent_config: toJsonText(template.agent_config),
    quota_strategy: toJsonText(template.quota_strategy),
    status: template.status,
  })
  templateDialogVisible.value = true
}

async function saveTemplate() {
  if (!templateForm.name.trim()) {
    MessagePlugin.warning('请填写模板名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: templateForm.name.trim(),
      description: templateForm.description,
      system_prompt: templateForm.system_prompt,
      knowledge_scope: parseJsonField(templateForm.knowledge_scope, '知识范围'),
      agent_config: parseJsonField(templateForm.agent_config, 'Agent 配置'),
      quota_strategy: parseJsonField(templateForm.quota_strategy, '额度策略'),
      status: templateForm.status,
    }
    if (editingTemplateId.value) {
      await updateAgentTemplate(editingTemplateId.value, payload)
    } else {
      await createAgentTemplate(payload)
    }
    templateDialogVisible.value = false
    MessagePlugin.success('模板已保存')
    await loadAll()
  } catch (err: any) {
    MessagePlugin.error(err?.message || '模板保存失败')
  } finally {
    saving.value = false
  }
}

async function removeTemplate(template: KnowHubAgentTemplate) {
  try {
    await deleteAgentTemplate(template.id)
    MessagePlugin.success('模板已删除')
    await loadAll()
  } catch (err: any) {
    MessagePlugin.error(err?.message || '模板删除失败')
  }
}

function openAssistantCreate() {
  if (!selectedWorkspace.value) {
    MessagePlugin.warning('请先选择业务空间')
    return
  }
  editingAssistantId.value = ''
  Object.assign(assistantForm, {
    name: '',
    display_name: '',
    template_id: templates.value[0]?.id || '',
    status: 'active',
    bound_agent_id: '',
    quota_strategy: '',
  })
  assistantQuotaPreset.value = ''
  // 打开表单时刷新一次该客户租户可绑定的 Agent
  loadWeknoraAgents()
  assistantDialogVisible.value = true
}

function openAssistantEdit(assistant: KnowHubCustomerAssistant) {
  editingAssistantId.value = assistant.id
  Object.assign(assistantForm, {
    name: assistant.name,
    display_name: assistant.display_name,
    template_id: assistant.template_id,
    status: assistant.status,
    bound_agent_id: effectiveAgentId(assistant),
    quota_strategy: toJsonText(assistant.quota_strategy, true),
  })
  assistantQuotaPreset.value = assistant.quota_strategy ? 'custom' : ''
  loadWeknoraAgents()
  assistantDialogVisible.value = true
}

async function saveAssistant() {
  if (!selectedWorkspaceId.value) {
    MessagePlugin.warning('请先选择业务空间')
    return
  }
  if (!assistantForm.name.trim() || !assistantForm.template_id) {
    MessagePlugin.warning('请填写助手名称并选择场景模板')
    return
  }
  if (!assistantForm.bound_agent_id) {
    MessagePlugin.warning('请绑定一个该客户租户可访问的原生 Agent')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: assistantForm.name.trim(),
      display_name: assistantForm.display_name.trim(),
      template_id: assistantForm.template_id,
      status: assistantForm.status,
      // 绑定的原生 Agent：Prompt/模型/知识库由该 Agent 承载，客户助手不覆盖。
      agent_config: { agent_id: assistantForm.bound_agent_id },
      quota_strategy: assistantQuotaStrategyPayload(),
    }
    if (editingAssistantId.value) {
      await updateCustomerAssistant(editingAssistantId.value, payload)
    } else {
      await createWorkspaceCustomerAssistant(selectedWorkspaceId.value, payload)
    }
    assistantDialogVisible.value = false
    MessagePlugin.success('客户助手已保存')
    await Promise.all([loadAssistants(), loadWeknoraAgents()])
  } catch (err: any) {
    MessagePlugin.error(err?.message || '客户助手保存失败')
  } finally {
    saving.value = false
  }
}

async function removeAssistant(assistant: KnowHubCustomerAssistant) {
  try {
    await deleteCustomerAssistant(assistant.id)
    MessagePlugin.success('客户助手已删除')
    await loadAssistants()
  } catch (err: any) {
    MessagePlugin.error(err?.message || '客户助手删除失败')
  }
}

watch(selectedWorkspaceId, () => {
  loadAssistants().catch((err: any) => {
    assistants.value = []
    error.value = err?.message || '客户助手列表暂不可用'
  })
  loadWeknoraAgents()
})

onMounted(loadAll)
</script>

<style scoped>
.assistant-admin-page {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 32px;
  background: #f7f8fa;
}

.page-header,
.layout {
  max-width: 1180px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.layout {
  display: grid;
  gap: 20px;
}

.panel {
  padding: 24px;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #00a870;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: #1f2329;
  font-size: 28px;
  line-height: 1.3;
}

h2 {
  color: #1f2329;
  font-size: 18px;
  line-height: 1.4;
}

.panel-header p {
  margin-top: 4px;
  color: #86909c;
  font-size: 13px;
}

.page-alert {
  max-width: 1180px;
  margin-bottom: 16px;
}

.workspace-row {
  display: grid;
  grid-template-columns: 88px minmax(220px, 420px);
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  color: #4e5969;
  font-size: 14px;
}

.muted {
  color: #86909c;
  font-size: 12px;
}

.table-shell {
  overflow: hidden;
  border: 1px solid #edf0f3;
  border-radius: 8px;
}

.table-shell :deep(.t-table th) {
  background: #f8fafb;
  color: #4e5969;
  font-weight: 600;
}

.primary-cell {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.primary-cell__title {
  color: #1f2329;
  font-size: 14px;
  font-weight: 600;
}

.primary-cell__meta {
  overflow: hidden;
  color: #86909c;
  font-size: 12px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row-actions {
  display: inline-flex;
  justify-content: flex-end;
  gap: 4px;
  width: 100%;
}

.empty {
  padding: 32px 24px;
  border-radius: 8px;
  background: #f7f8fa;
  color: #86909c;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.product-form {
  display: grid;
  gap: 18px;
}

.form-section {
  display: grid;
  gap: 14px;
}

.form-section-head {
  display: grid;
  gap: 4px;
}

.form-section-head h3 {
  margin: 0;
  color: #1f2329;
  font-size: 15px;
  line-height: 1.4;
}

.form-section-head p {
  color: #86909c;
  font-size: 13px;
  line-height: 1.6;
}

.advanced-section {
  border-top: 1px solid #f2f3f5;
  padding-top: 14px;
}

.advanced-section summary {
  color: #4e5969;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
}

.advanced-section .form-grid {
  margin-top: 14px;
}

.info-box {
  border: 1px solid #d8efe5;
  border-radius: 8px;
  background: #f0fbf6;
  color: #3f7f65;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px 14px;
}

.form-alert {
  margin-bottom: 4px;
}

.required-mark {
  color: #d54941;
  font-size: 14px;
  margin-left: 2px;
}

.advanced-hint {
  margin-top: 14px;
  font-size: 12px;
  line-height: 1.6;
}

.agent-summary {
  margin-top: 14px;
  border: 1px solid #edf0f3;
  border-radius: 8px;
  background: #f8fafb;
  padding: 12px 14px;
  display: grid;
  gap: 8px;
}

.agent-summary__row {
  display: grid;
  grid-template-columns: 72px 1fr;
  gap: 12px;
  font-size: 13px;
  color: #4e5969;
}

.agent-summary__label {
  color: #86909c;
}

.form-grid label {
  display: grid;
  gap: 6px;
  color: #4e5969;
  font-size: 13px;
}

.product-form :deep(.t-textarea__inner) {
  font-family: inherit;
}

.span-2 {
  grid-column: 1 / -1;
}

@media (max-width: 760px) {
  .assistant-admin-page {
    padding: 20px;
  }

  .page-header,
  .panel-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .workspace-row,
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
