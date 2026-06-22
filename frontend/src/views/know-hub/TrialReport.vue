<template>
  <div class="trial-report-page">
    <header class="trial-report-header">
      <div>
        <p class="eyebrow">Know Hub</p>
        <h1>试用报告</h1>
      </div>
      <t-button theme="default" variant="outline" :loading="loading" @click="loadReport">
        刷新
      </t-button>
    </header>

    <t-loading :loading="loading" size="small">
      <t-alert v-if="error" theme="warning" :message="error" class="report-alert" />
      <div v-else-if="report" class="trial-report-card">
        <div class="report-meta">
          <span>业务空间</span>
          <strong>{{ workspaceId }}</strong>
        </div>
        <pre class="report-content">{{ report }}</pre>
      </div>
      <div v-else class="trial-report-card empty">
        暂无可展示的试用报告数据。
      </div>
    </t-loading>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getCurrentTenantReport } from '@/api/know-hub'

const loading = ref(false)
const error = ref('')
const workspaceId = ref('')
const report = ref('')

async function loadReport() {
  loading.value = true
  error.value = ''
  try {
    const payload = await getCurrentTenantReport()
    workspaceId.value = payload.workspace_id
    report.value = payload.report
  } catch (err: any) {
    report.value = ''
    error.value = err?.message || '试用报告暂不可用'
  } finally {
    loading.value = false
  }
}

onMounted(loadReport)
</script>

<style scoped>
.trial-report-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 32px;
  background: #f7f8fa;
}

.trial-report-header {
  display: flex;
  max-width: 960px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.trial-report-card {
  max-width: 960px;
  padding: 32px;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
}

.eyebrow {
  margin: 0 0 8px;
  color: #00a870;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  color: #1f2329;
  font-size: 28px;
  line-height: 1.3;
}

.report-alert {
  max-width: 960px;
}

.report-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  color: #4e5969;
  font-size: 14px;
}

.report-meta strong {
  color: #1f2329;
  font-weight: 600;
  word-break: break-all;
}

.report-content {
  box-sizing: border-box;
  width: 100%;
  margin: 0;
  padding: 20px;
  overflow-x: auto;
  border-radius: 8px;
  background: #f2f3f5;
  color: #1f2329;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  font-size: 14px;
  line-height: 1.7;
  white-space: pre-wrap;
}

.empty {
  color: #86909c;
}

@media (max-width: 640px) {
  .trial-report-page {
    padding: 20px;
  }

  .trial-report-header {
    align-items: flex-start;
    flex-direction: column;
  }

  .trial-report-card {
    padding: 20px;
  }
}
</style>
