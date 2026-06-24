<template>
  <div class="quota-audit-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Know Hub</p>
        <h1>额度审计</h1>
      </div>
      <t-button theme="default" variant="outline" :loading="loading" @click="load">刷新</t-button>
    </header>

    <t-loading :loading="loading" size="small">
      <t-alert v-if="error" theme="warning" :message="error" class="page-alert" />
      <div v-else-if="workspaces.length" class="card">
        <table class="quota-table">
          <thead>
            <tr>
              <th>业务空间</th>
              <th>状态</th>
              <th>总额度</th>
              <th>已用</th>
              <th>预留</th>
              <th>使用率</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ws in workspaces" :key="ws.id">
              <td>
                <div class="ws-name">{{ ws.name }}</div>
                <div class="ws-id">{{ ws.id }}</div>
              </td>
              <td>{{ ws.status }}</td>
              <td>{{ ws.total_quota ?? '—' }}</td>
              <td>{{ ws.consumed_quota ?? 0 }}</td>
              <td>{{ ws.reserved_quota ?? 0 }}</td>
              <td><span :class="usageClass(ws)">{{ usageRate(ws) }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-else class="card empty">暂无业务空间数据。</div>
    </t-loading>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { getAdminWorkspaces, type KnowHubWorkspaceDetail } from '@/api/know-hub'

const loading = ref(false)
const error = ref('')
const workspaces = ref<KnowHubWorkspaceDetail[]>([])

function usageRate(ws: KnowHubWorkspaceDetail): string {
  const total = ws.total_quota
  const consumed = ws.consumed_quota ?? 0
  if (!total || total <= 0) return '—'
  return `${Math.round((consumed / total) * 100)}%`
}

function usageClass(ws: KnowHubWorkspaceDetail): string {
  const total = ws.total_quota
  const consumed = ws.consumed_quota ?? 0
  if (!total || total <= 0) return 'rate-na'
  const rate = consumed / total
  if (rate >= 0.9) return 'rate-high'
  if (rate >= 0.7) return 'rate-mid'
  return 'rate-low'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    workspaces.value = await getAdminWorkspaces()
  } catch (err: any) {
    workspaces.value = []
    error.value = err?.message || '额度审计暂不可用'
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.quota-audit-page {
  box-sizing: border-box;
  min-height: 100%;
  padding: 32px;
  background: #f7f8fa;
}

.page-header {
  display: flex;
  max-width: 1040px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.card {
  max-width: 1040px;
  padding: 8px 24px;
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

.page-alert {
  max-width: 1040px;
}

.quota-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.quota-table th {
  padding: 12px;
  color: #4e5969;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #e7e7e7;
  background: #f7f8fa;
}

.quota-table td {
  padding: 12px;
  border-bottom: 1px solid #f2f3f5;
  color: #1f2329;
  vertical-align: top;
}

.ws-name {
  font-weight: 600;
  word-break: break-all;
}

.ws-id {
  color: #86909c;
  font-size: 12px;
  word-break: break-all;
}

.rate-na {
  color: #86909c;
}

.rate-low {
  color: #00a870;
}

.rate-mid {
  color: #ed7b2f;
}

.rate-high {
  color: #d54941;
}

.empty {
  padding: 32px;
  color: #86909c;
}

@media (max-width: 640px) {
  .quota-audit-page {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card {
    padding: 0 12px;
    overflow-x: auto;
  }
}
</style>
