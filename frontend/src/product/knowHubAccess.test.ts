import assert from 'node:assert/strict'
import test from 'node:test'

import { isKnowHubMenuVisible } from './knowHubAccess.ts'

test('customer menu excludes trial reports and technical entries', () => {
  assert.equal(isKnowHubMenuVisible('creatChat', false), true)
  assert.equal(isKnowHubMenuVisible('knowledge-bases', false), true)
  assert.equal(isKnowHubMenuVisible('settings', false), true)
  assert.equal(isKnowHubMenuVisible('trial-report', false), false)
  assert.equal(isKnowHubMenuVisible('agents', false), false)
})

test('admin menu includes trial reports but keeps technical entries hidden', () => {
  assert.equal(isKnowHubMenuVisible('trial-report', true), true)
  assert.equal(isKnowHubMenuVisible('agents', true), false)
  assert.equal(isKnowHubMenuVisible('organizations', true), false)
})
