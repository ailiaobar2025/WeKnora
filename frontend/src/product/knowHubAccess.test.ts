import assert from 'node:assert/strict'
import test from 'node:test'

import {
  isKnowHubKnowledgeBaseEditorSectionVisible,
  isKnowHubMenuVisible,
  isKnowHubSettingsSectionVisible,
} from './knowHubAccess.ts'

test('customer menu excludes trial reports and technical entries', () => {
  assert.equal(isKnowHubMenuVisible('creatChat', false), true)
  assert.equal(isKnowHubMenuVisible('knowledge-bases', false), true)
  assert.equal(isKnowHubMenuVisible('settings', false), true)
  assert.equal(isKnowHubMenuVisible('trial-report', false), false)
  assert.equal(isKnowHubMenuVisible('quota-audit', false), false)
  assert.equal(isKnowHubMenuVisible('audit-logs', false), false)
  assert.equal(isKnowHubMenuVisible('agents', false), false)
})

test('limited admin menu includes trial reports but keeps technical entries hidden', () => {
  assert.equal(isKnowHubMenuVisible('trial-report', true), true)
  assert.equal(isKnowHubMenuVisible('quota-audit', true), true)
  assert.equal(isKnowHubMenuVisible('audit-logs', true), true)
  assert.equal(isKnowHubMenuVisible('agents', true), false)
  assert.equal(isKnowHubMenuVisible('organizations', true), false)
})

test('system admin menu keeps native operational entries visible', () => {
  assert.equal(isKnowHubMenuVisible('trial-report', true, true), true)
  assert.equal(isKnowHubMenuVisible('quota-audit', true, true), true)
  assert.equal(isKnowHubMenuVisible('audit-logs', true, true), true)
  assert.equal(isKnowHubMenuVisible('agents', true, true), true)
  assert.equal(isKnowHubMenuVisible('organizations', true, true), true)
})

test('customer settings keep only account and tenant basics', () => {
  assert.equal(isKnowHubSettingsSectionVisible('general', false), true)
  assert.equal(isKnowHubSettingsSectionVisible('userprofile', false), true)
  assert.equal(isKnowHubSettingsSectionVisible('tenant', false), true)
  assert.equal(isKnowHubSettingsSectionVisible('models', false), false)
  assert.equal(isKnowHubSettingsSectionVisible('websearch', false), false)
  assert.equal(isKnowHubSettingsSectionVisible('mcp', false), false)
  assert.equal(isKnowHubSettingsSectionVisible('parser', false), false)
  assert.equal(isKnowHubSettingsSectionVisible('storage', false), false)
})

test('limited admin settings keep operational read surfaces but hide technical configuration', () => {
  assert.equal(isKnowHubSettingsSectionVisible('members', true), true)
  assert.equal(isKnowHubSettingsSectionVisible('system', true), true)
  assert.equal(isKnowHubSettingsSectionVisible('models', true), false)
  assert.equal(isKnowHubSettingsSectionVisible('websearch', true), false)
  assert.equal(isKnowHubSettingsSectionVisible('mcp', true), false)
  assert.equal(isKnowHubSettingsSectionVisible('vectorstore', true), false)
  assert.equal(isKnowHubSettingsSectionVisible('system-global', true), false)
})

test('system admin settings keep native technical configuration visible', () => {
  assert.equal(isKnowHubSettingsSectionVisible('members', true, true), true)
  assert.equal(isKnowHubSettingsSectionVisible('models', true, true), true)
  assert.equal(isKnowHubSettingsSectionVisible('websearch', true, true), true)
  assert.equal(isKnowHubSettingsSectionVisible('mcp', true, true), true)
  assert.equal(isKnowHubSettingsSectionVisible('vectorstore', true, true), true)
  assert.equal(isKnowHubSettingsSectionVisible('system-global', true, true), true)
})

test('knowledge base editor keeps only basic settings in product mode', () => {
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('basic'), true)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('models'), false)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('vectorStore'), false)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('parser'), false)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('chunking'), false)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('graph'), false)
  assert.equal(isKnowHubKnowledgeBaseEditorSectionVisible('advanced'), false)
})
