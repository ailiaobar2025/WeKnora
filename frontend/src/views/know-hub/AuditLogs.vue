<template>
  <div class="audit-logs-page">
    <header class="page-header">
      <div>
        <p class="eyebrow">Know Hub</p>
        <h1>审计日志</h1>
      </div>
      <t-button theme="default" variant="outline" :loading="loading" @click="load">刷新</t-button>
    </header>

    <t-loading :loading="loading" size="small">
      <t-alert v-if="error" theme="warning" :message="error" class="page-alert" />
      <div v-else-if="logs.length" class="card">
        <table class="audit-table">
          <thead>
            <tr>
              <th>时间</th>
              <th>管理员</th>
              <th>操作</th>
              <th>资源</th>
              <th>方法 · 路径</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id">
              <td class="cell-time">{{ formatTime(log.created_at) }}</td>
              <td>
                <div>{{ log.admin_user_name || log.admin_user_id }}</div>
                <div class="muted">{{ log.admin_tenant_id }}</div>
              </td>
              <td>{{ log.action }}</td>
              <td>
                <div>{{ log.resource_type }}</div>
                <div class="muted">{{ log.resource_id || log.target_workspace_id || '—' }}</div>
              </td>
              <td>
                <div>{{ log.request_method }}</div>
                <div class="muted path-cell">{{ log.request_path }}</div>
              </td>
              <td>
                <span :class="statusClass(log)">{{ log.response_status }}</span>
                <div v-if="log.error_message" class="err-msg">{{ log.error_message }}</div>
              </td>
            </tr>
          </tbody>
        </table>
        <div class="pager">
          <t-button size="small" variant="outline" :disabled="offset === 0 || loading" @click="prev">上一页</t-button>
          <span class="page-info">共 {{ total }} 条 · 第 {{ page }} / {{ totalPages }} 页</span>
          <t-button size="small" variant="outline" :disabled="offset + limit >= total || loading" @click="next">下一页</t-button>
        </div>
      </div>
      <div v-else class="card empty">暂无审计日志。</div>
    </t-loading>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { getAdminAuditLogs, type KnowHubAuditLog } from '@/api/know-hub'

const loading = ref(false)
const error = ref('')
const logs = ref<KnowHubAuditLog[]>([])
const total = ref(0)
const limit = 20
const offset = ref(0)

const page = computed(() => Math.floor(offset.value / limit) + 1)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / limit)))

function statusClass(log: KnowHubAuditLog): string {
  const s = log.response_status
  if (s && s.startsWith('2')) return 'status-ok'
  if (s && (s.startsWith('4') || s.startsWith('5'))) return 'status-err'
  return 'status-na'
}

function formatTime(ts: string | null): string {
  if (!ts) return '—'
  try {
    return new Date(ts).toLocaleString()
  } catch {
    return ts
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    const payload = await getAdminAuditLogs({ limit, offset: offset.value })
    logs.value = payload.items
    total.value = payload.total
  } catch (err: any) {
    logs.value = []
    total.value = 0
    error.value = err?.message || '审计日志暂不可用'
  } finally {
    loading.value = false
  }
}

function prev() {
  offset.value = Math.max(0, offset.value - limit)
}

function next() {
  offset.value = offset.value + limit
}

watch(offset, load)
onMounted(load)
</script>

<style scoped>
.audit-logs-page {
  box-sizing: border-box;
  height: 100%;
  overflow-y: auto;
  padding: 32px;
  background: #f7f8fa;
}

.page-header {
  display: flex;
  max-width: 1120px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 16px;
}

.card {
  max-width: 1120px;
  padding: 8px 24px;
  border: 1px solid #e7e7e7;
  border-radius: 8px;
  background: #fff;
  overflow-x: auto;
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
  max-width: 1120px;
}

.audit-table {
  width: 100%;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
}

.audit-table th {
  padding: 12px;
  color: #4e5969;
  font-weight: 600;
  text-align: left;
  border-bottom: 1px solid #e7e7e7;
  background: #f7f8fa;
}

.audit-table td {
  padding: 10px 12px;
  border-bottom: 1px solid #f2f3f5;
  color: #1f2329;
  vertical-align: top;
}

.muted {
  color: #86909c;
  font-size: 12px;
  word-break: break-all;
}

.path-cell {
  max-width: 260px;
}

.cell-time {
  white-space: nowrap;
  color: #4e5969;
}

.status-ok {
  color: #00a870;
  font-weight: 600;
}

.status-err {
  color: #d54941;
  font-weight: 600;
}

.status-na {
  color: #86909c;
}

.err-msg {
  margin-top: 2px;
  color: #d54941;
  font-size: 12px;
  word-break: break-all;
}

.pager {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
}

.page-info {
  color: #4e5969;
  font-size: 13px;
}

.empty {
  padding: 32px;
  color: #86909c;
}

@media (max-width: 640px) {
  .audit-logs-page {
    padding: 20px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .card {
    padding: 0 8px;
    overflow-x: auto;
  }
}
</style>
