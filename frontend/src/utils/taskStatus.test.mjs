import assert from 'node:assert/strict'
import test from 'node:test'

const STATUS_LABEL_MAP = {
  QUEUED: '排队中',
  RUNNING: '执行中',
  NEED_HUMAN_REVIEW: '待审批',
  NEED_INFO: '待补充资料',
  SUCCESS: '成功交付',
  FAILED: '处理异常',
  CANCELLED: '已取消',
  TIMEOUT: '超时终止',
}

const STATUS_THEME_MAP = {
  QUEUED: 'default',
  RUNNING: 'primary',
  NEED_HUMAN_REVIEW: 'warning',
  NEED_INFO: 'warning',
  SUCCESS: 'success',
  FAILED: 'danger',
  CANCELLED: 'default',
  TIMEOUT: 'danger',
}

function getStatusLabel(status) {
  return STATUS_LABEL_MAP[status] || status
}

function getStatusTheme(status) {
  return STATUS_THEME_MAP[status] || 'default'
}

test('getStatusLabel returns Chinese label for each known status', () => {
  assert.equal(getStatusLabel('QUEUED'), '排队中')
  assert.equal(getStatusLabel('RUNNING'), '执行中')
  assert.equal(getStatusLabel('NEED_HUMAN_REVIEW'), '待审批')
  assert.equal(getStatusLabel('NEED_INFO'), '待补充资料')
  assert.equal(getStatusLabel('SUCCESS'), '成功交付')
  assert.equal(getStatusLabel('FAILED'), '处理异常')
  assert.equal(getStatusLabel('CANCELLED'), '已取消')
  assert.equal(getStatusLabel('TIMEOUT'), '超时终止')
})

test('getStatusLabel falls back to raw status for unknown values', () => {
  assert.equal(getStatusLabel('UNKNOWN_STATUS'), 'UNKNOWN_STATUS')
  assert.equal(getStatusLabel(''), '')
})

test('getStatusTheme returns tdesign theme for each known status', () => {
  assert.equal(getStatusTheme('QUEUED'), 'default')
  assert.equal(getStatusTheme('RUNNING'), 'primary')
  assert.equal(getStatusTheme('NEED_HUMAN_REVIEW'), 'warning')
  assert.equal(getStatusTheme('NEED_INFO'), 'warning')
  assert.equal(getStatusTheme('SUCCESS'), 'success')
  assert.equal(getStatusTheme('FAILED'), 'danger')
  assert.equal(getStatusTheme('CANCELLED'), 'default')
  assert.equal(getStatusTheme('TIMEOUT'), 'danger')
})

test('getStatusTheme falls back to default for unknown values', () => {
  assert.equal(getStatusTheme('UNKNOWN_STATUS'), 'default')
  assert.equal(getStatusTheme(''), 'default')
})
