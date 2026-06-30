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
          <summary>高级配置</summary>
          <div class="form-grid">
            <label class="span-2">
              系统提示词
              <t-textarea v-model="templateForm.system_prompt" :autosize="{ minRows: 4, maxRows: 10 }" />
            </label>
            <label>
              知识范围 JSON
              <t-textarea v-model="templateForm.knowledge_scope" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label>
              Agent 配置 JSON
              <t-textarea v-model="templateForm.agent_config" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label class="span-2">
              额度策略 JSON
              <t-textarea v-model="templateForm.quota_strategy" :autosize="{ minRows: 4, maxRows: 8 }" />
            </label>
          </div>
        </details>
      </div>
    </SettingDrawer>

    <SettingDrawer
      v-model:visible="assistantDialogVisible"
      :title="editingAssistantId ? '编辑客户助手' : '新建客户助手'"
      description="把模板分配给客户空间，并按需覆盖展示名称、提示词和额度策略。"
      icon="user-talk"
      width="720px"
      :confirm-loading="saving"
      @confirm="saveAssistant"
    >
      <div class="product-form">
        <section class="form-section">
          <div class="form-section-head">
            <h3>客户与模板</h3>
            <p>助手会分配到当前选中的业务空间，客户只能使用被分配的助手。</p>
          </div>
          <div class="form-grid">
            <label>
              客户空间
              <t-input :value="selectedWorkspace?.name || selectedWorkspaceId" readonly />
            </label>
            <label>
              场景模板
              <t-select
                v-model="assistantForm.template_id"
                :options="templateOptions"
                placeholder="请选择模板"
                filterable
                :disabled="Boolean(editingAssistantId)"
              />
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <h3>助手信息</h3>
            <p>展示名称会出现在客户的新对话助手选择器中。</p>
          </div>
          <div class="form-grid">
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
            <label>
              配额策略
              <t-select v-model="assistantQuotaPreset" :options="quotaPresetOptions" />
            </label>
          </div>
        </section>

        <section class="form-section">
          <div class="form-section-head">
            <h3>知识来源</h3>
            <p>常规配置沿用模板知识范围；需要按客户覆盖时，在高级配置中填写范围策略。</p>
          </div>
          <div class="info-box">
            当前版本沿用模板知识范围。下一步可接入知识库选择器，实现按客户勾选知识库。
          </div>
        </section>

        <details class="advanced-section">
          <summary>高级配置</summary>
          <div class="form-grid">
            <label class="span-2">
              覆盖系统提示词
              <t-textarea v-model="assistantForm.system_prompt" :autosize="{ minRows: 4, maxRows: 10 }" />
            </label>
            <label>
              覆盖知识范围 JSON
              <t-textarea v-model="assistantForm.knowledge_scope" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label>
              覆盖 Agent 配置 JSON
              <t-textarea v-model="assistantForm.agent_config" :autosize="{ minRows: 5, maxRows: 10 }" />
            </label>
            <label class="span-2">
              覆盖额度策略 JSON
              <t-textarea v-model="assistantForm.quota_strategy" :autosize="{ minRows: 4, maxRows: 8 }" />
            </label>
          </div>
        </details>
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
  updateAgentTemplate,
  updateCustomerAssistant,
  type KnowHubAgentTemplate,
  type KnowHubCustomerAssistant,
  type KnowHubWorkspaceDetail,
} from '@/api/know-hub'

const loading = ref(false)
const saving = ref(false)
const error = ref('')
const templates = ref<KnowHubAgentTemplate[]>([])
const workspaces = ref<KnowHubWorkspaceDetail[]>([])
const assistants = ref<KnowHubCustomerAssistant[]>([])
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
  { colKey: 'assistant', title: '助手', minWidth: 220 },
  { colKey: 'template_id', title: '模板', minWidth: 180 },
  { colKey: 'status', title: '状态', width: 96 },
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
  system_prompt: '',
  knowledge_scope: '',
  agent_config: '',
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
    await loadAssistants()
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
    system_prompt: '',
    knowledge_scope: '',
    agent_config: '',
    quota_strategy: '',
  })
  assistantQuotaPreset.value = ''
  assistantDialogVisible.value = true
}

function openAssistantEdit(assistant: KnowHubCustomerAssistant) {
  editingAssistantId.value = assistant.id
  Object.assign(assistantForm, {
    name: assistant.name,
    display_name: assistant.display_name,
    template_id: assistant.template_id,
    status: assistant.status,
    system_prompt: assistant.system_prompt || '',
    knowledge_scope: toJsonText(assistant.knowledge_scope, true),
    agent_config: toJsonText(assistant.agent_config, true),
    quota_strategy: toJsonText(assistant.quota_strategy, true),
  })
  assistantQuotaPreset.value = assistant.quota_strategy ? 'custom' : ''
  assistantDialogVisible.value = true
}

async function saveAssistant() {
  if (!selectedWorkspaceId.value) {
    MessagePlugin.warning('请先选择业务空间')
    return
  }
  if (!assistantForm.name.trim() || !assistantForm.template_id) {
    MessagePlugin.warning('请填写助手名称并选择模板')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: assistantForm.name.trim(),
      display_name: assistantForm.display_name.trim(),
      template_id: assistantForm.template_id,
      status: assistantForm.status,
      system_prompt: assistantForm.system_prompt.trim() || null,
      knowledge_scope: parseJsonField(assistantForm.knowledge_scope, '覆盖知识范围', true),
      agent_config: parseJsonField(assistantForm.agent_config, '覆盖 Agent 配置', true),
      quota_strategy: assistantQuotaStrategyPayload(),
    }
    if (editingAssistantId.value) {
      await updateCustomerAssistant(editingAssistantId.value, payload)
    } else {
      await createWorkspaceCustomerAssistant(selectedWorkspaceId.value, payload)
    }
    assistantDialogVisible.value = false
    MessagePlugin.success('客户助手已保存')
    await loadAssistants()
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
