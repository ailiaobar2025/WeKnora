<template>
  <div class="my-assistants-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Know Hub</p>
        <h1>我的助手</h1>
        <p class="page-subtitle">选择一个助手后，将进入新对话继续使用完整聊天体验。</p>
      </div>
      <t-button theme="default" variant="outline" :loading="loadingAssistants" @click="loadAssistants">刷新</t-button>
    </header>

    <t-alert v-if="error" theme="warning" :message="error" class="page-alert" />

    <section v-if="assistants.length" class="assistant-grid">
      <button
        v-for="assistant in assistants"
        :key="assistant.id"
        type="button"
        class="assistant-card"
        :class="{ active: selectedAssistantId === assistant.id }"
        @click="startWithAssistant(assistant)"
      >
        <span class="assistant-card-title">{{ assistant.display_name || assistant.name }}</span>
        <small>{{ assistant.description || assistant.name }}</small>
        <span class="assistant-card-action">进入新对话</span>
      </button>
    </section>

    <section v-else-if="!loadingAssistants" class="empty">
      当前还没有可用助手，请联系管理员完成分配。
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { MessagePlugin } from 'tdesign-vue-next'
import { getMyCustomerAssistants, type KnowHubCustomerAssistantBrief } from '@/api/know-hub'
import { useSettingsStore } from '@/stores/settings'

const router = useRouter()
const settingsStore = useSettingsStore()

const loadingAssistants = ref(false)
const error = ref('')
const assistants = ref<KnowHubCustomerAssistantBrief[]>([])
const selectedAssistantId = ref(settingsStore.selectedCustomerAssistantId)

async function loadAssistants() {
  loadingAssistants.value = true
  error.value = ''
  try {
    assistants.value = await getMyCustomerAssistants()
    if (!selectedAssistantId.value && assistants.value.length) {
      selectedAssistantId.value = assistants.value[0].id
      settingsStore.selectCustomerAssistant(assistants.value[0].id)
    }
  } catch (err: any) {
    assistants.value = []
    error.value = err?.message || '助手列表暂不可用'
  } finally {
    loadingAssistants.value = false
  }
}

function startWithAssistant(assistant: KnowHubCustomerAssistantBrief) {
  selectedAssistantId.value = assistant.id
  settingsStore.selectCustomerAssistant(assistant.id)
  MessagePlugin.success(`已选择助手「${assistant.display_name || assistant.name}」`)
  router.push('/platform/creatChat')
}

onMounted(loadAssistants)
</script>

<style scoped>
.my-assistants-page {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 32px;
  background: #f7f8fa;
}

.page-header,
.page-alert,
.assistant-grid {
  width: 100%;
  max-width: 1040px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
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
p {
  margin: 0;
}

h1 {
  color: #1f2329;
  font-size: 28px;
  line-height: 1.3;
}

.page-subtitle {
  margin-top: 8px;
  color: #86909c;
  font-size: 14px;
}

.assistant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.assistant-card {
  display: grid;
  gap: 8px;
  min-height: 118px;
  padding: 16px;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  color: #1f2329;
  text-align: left;
  cursor: pointer;
  transition: border-color 0.16s ease, box-shadow 0.16s ease, transform 0.16s ease;
}

.assistant-card:hover {
  border-color: #00a870;
  transform: translateY(-1px);
}

.assistant-card.active {
  border-color: #00a870;
  box-shadow: 0 0 0 2px rgba(0, 168, 112, 0.12);
}

.assistant-card-title {
  font-size: 15px;
  font-weight: 600;
}

.assistant-card small {
  color: #86909c;
  font-size: 12px;
}

.assistant-card-action {
  align-self: end;
  color: #00a870;
  font-size: 13px;
  font-weight: 600;
}

.empty {
  max-width: 1040px;
  margin-bottom: 16px;
  padding: 24px;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  color: #86909c;
}

@media (max-width: 640px) {
  .my-assistants-page {
    padding: 20px;
  }

  .page-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
