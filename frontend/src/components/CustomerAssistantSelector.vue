<template>
  <Teleport to="body">
    <div v-if="visible" class="assistant-selector-overlay" @click="$emit('close')">
      <div class="assistant-selector-dropdown" :style="dropdownStyle" @click.stop>
        <div class="assistant-selector-header">
          <span>{{ $t('input.assistantSelector.title') }}</span>
        </div>

        <div class="assistant-selector-content">
          <button
            v-for="assistant in assistants"
            :key="assistant.id"
            type="button"
            class="assistant-option"
            :class="{ selected: assistant.id === currentAssistantId }"
            @click="selectAssistant(assistant)"
          >
            <span class="assistant-option-icon">
              <t-icon name="sparkles" />
            </span>
            <span class="assistant-option-main">
              <span class="assistant-option-name">{{ assistant.display_name || assistant.name }}</span>
              <span v-if="assistant.description || assistant.name" class="assistant-option-desc">
                {{ assistant.description || assistant.name }}
              </span>
            </span>
            <t-icon v-if="assistant.id === currentAssistantId" name="check" class="assistant-option-check" />
          </button>

          <div v-if="!assistants.length" class="assistant-option empty">
            {{ $t('input.assistantSelector.empty') }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { KnowHubCustomerAssistantBrief } from '@/api/know-hub'
import { getRootZoom, rectToCssPx, cssViewportSize } from '@/utils/zoom'

const props = defineProps<{
  visible: boolean
  anchorEl?: HTMLElement
  currentAssistantId: string
  assistants: KnowHubCustomerAssistantBrief[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'select', assistant: KnowHubCustomerAssistantBrief): void
}>()

const dropdownStyle = ref<Record<string, string>>({})
const dropdownWidth = 320

const activeAssistants = computed(() => props.assistants.filter((assistant) => assistant.status === 'active'))

function updatePosition() {
  const anchor = props.anchorEl
  if (!anchor) {
    dropdownStyle.value = {
      position: 'fixed',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      width: `${dropdownWidth}px`,
    }
    return
  }

  const zoom = getRootZoom()
  const rect = rectToCssPx(anchor.getBoundingClientRect(), zoom)
  const { width: viewportWidth, height: viewportHeight } = cssViewportSize(zoom)
  const left = Math.max(16, Math.min(Math.floor(rect.left), viewportWidth - dropdownWidth - 16))
  const spaceBelow = viewportHeight - rect.bottom
  const openBelow = spaceBelow > 260

  dropdownStyle.value = openBelow
    ? {
        position: 'fixed',
        width: `${dropdownWidth}px`,
        left: `${left}px`,
        top: `${Math.floor(rect.bottom + 8)}px`,
      }
    : {
        position: 'fixed',
        width: `${dropdownWidth}px`,
        left: `${left}px`,
        bottom: `${Math.floor(viewportHeight - rect.top + 8)}px`,
      }
}

function selectAssistant(assistant: KnowHubCustomerAssistantBrief) {
  emit('select', assistant)
  emit('close')
}

watch(
  () => props.visible,
  async (visible) => {
    if (!visible) return
    await nextTick()
    updatePosition()
  },
)

watch(activeAssistants, () => {
  if (props.visible) updatePosition()
})
</script>

<style scoped lang="less">
.assistant-selector-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: transparent;
}

.assistant-selector-dropdown {
  z-index: 3001;
  overflow: hidden;
  border: 1px solid var(--td-component-border, #e7e7e7);
  border-radius: 8px;
  background: var(--td-bg-color-container, #fff);
  box-shadow: 0 12px 36px rgba(15, 23, 42, 0.14);
}

.assistant-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 44px;
  padding: 0 14px;
  border-bottom: 1px solid var(--td-component-border, #eee);
  color: var(--td-text-color-primary, #1f2937);
  font-size: 14px;
  font-weight: 600;
}

.assistant-selector-content {
  max-height: 320px;
  overflow-y: auto;
  padding: 6px;
}

.assistant-option {
  display: flex;
  width: 100%;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  padding: 9px 10px;
  color: var(--td-text-color-primary, #1f2937);
  text-align: left;
  cursor: pointer;

  &:hover {
    background: var(--td-bg-color-container-hover, #f5f7fa);
  }

  &.selected {
    background: #e8f8ef;
    color: #0f8f55;
  }

  &.empty {
    justify-content: center;
    color: var(--td-text-color-placeholder, #9ca3af);
    cursor: default;

    &:hover {
      background: transparent;
    }
  }
}

.assistant-option-icon {
  display: inline-flex;
  width: 28px;
  height: 28px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: #ecfdf3;
  color: #10b981;
}

.assistant-option-main {
  min-width: 0;
  flex: 1;
}

.assistant-option-name,
.assistant-option-desc {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.assistant-option-name {
  font-size: 14px;
  font-weight: 600;
}

.assistant-option-desc {
  margin-top: 3px;
  color: var(--td-text-color-secondary, #6b7280);
  font-size: 12px;
}

.assistant-option-check {
  flex: 0 0 auto;
}
</style>
