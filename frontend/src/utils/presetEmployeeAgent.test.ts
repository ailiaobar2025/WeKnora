import assert from 'node:assert/strict'
import test from 'node:test'

import type { CustomAgent } from '../api/agent/index'
import type { BizEmployee } from '../api/employeeOs'
import {
  PRESET_MARKET_EMPLOYEES,
  buildPresetAgentCreateRequest,
  findPresetEmployee,
  installPresetMarketEmployee,
  isPresetEmployeeInstalled,
} from './presetEmployeeAgent'

const baseAgent: CustomAgent = {
  id: 'builtin-smart-reasoning',
  name: '智能推理',
  is_builtin: true,
  config: {
    agent_mode: 'smart-reasoning',
    agent_type: 'rag-qa',
    system_prompt: '',
    system_prompt_id: 'rag_qa',
    model_id: 'model-1',
    rerank_model_id: 'rerank-1',
    allowed_tools: ['knowledge_search'],
    kb_selection_mode: 'all',
    intent_prompts: { greeting: '你是通用 WeKnora 助手。' },
    welcome_message: '欢迎使用通用智能助手',
  },
}

const legacyEmployee: BizEmployee = {
  employeeId: 'employee-1',
  workspaceId: 'workspace-1',
  name: '售前评估与报价专家',
  avatarUrl: null,
  description: '旧安装',
  agentIdRef: 'builtin-smart-reasoning',
  status: 'PUBLISHED',
  createdAt: '2026-08-02T00:00:00.000Z',
  updatedAt: '2026-08-02T00:00:00.000Z',
}

test('builds a dedicated agent payload while preserving runtime model configuration', () => {
  const preset = PRESET_MARKET_EMPLOYEES[0]
  const payload = buildPresetAgentCreateRequest(preset, baseAgent)

  assert.equal(payload.name, preset.name)
  assert.equal(payload.description, preset.desc)
  assert.equal(payload.config?.agent_mode, 'smart-reasoning')
  assert.equal(payload.config?.agent_type, 'custom')
  assert.equal(payload.config?.model_id, 'model-1')
  assert.equal(payload.config?.rerank_model_id, 'rerank-1')
  assert.deepEqual(payload.config?.allowed_tools, ['knowledge_search'])
  assert.equal(payload.config?.system_prompt_id, undefined)
  assert.equal(payload.config?.intent_prompts, undefined)
  assert.equal(payload.config?.welcome_message, undefined)
  assert.match(payload.config?.system_prompt || '', new RegExp(preset.name))
  assert.match(payload.config?.system_prompt || '', /不得自称 WeKnora/)
  assert.equal(baseAgent.config.agent_type, 'rag-qa')
  assert.equal(baseAgent.config.system_prompt_id, 'rag_qa')
})

test('treats a same-name employee backed by a builtin agent as repairable, not installed', () => {
  const preset = PRESET_MARKET_EMPLOYEES[0]

  assert.equal(findPresetEmployee(preset, [legacyEmployee]), legacyEmployee)
  assert.equal(isPresetEmployeeInstalled(preset, [legacyEmployee]), false)
  assert.equal(
    isPresetEmployeeInstalled(preset, [
      { ...legacyEmployee, agentIdRef: '8d397d48-2a90-4b01-a4bc-f89c9bf4773f' },
    ]),
    true,
  )
})

test('repairs an existing employee with the newly materialized agent UUID', async () => {
  const calls: string[] = []
  const preset = PRESET_MARKET_EMPLOYEES[0]

  const result = await installPresetMarketEmployee(preset, [legacyEmployee], {
    getBaseAgent: async () => baseAgent,
    createAgent: async () => ({
      ...baseAgent,
      id: '0193b8a0-1111-7000-8000-000000000001',
      is_builtin: false,
    }),
    createEmployee: async () => {
      calls.push('create')
      return legacyEmployee
    },
    updateEmployee: async (employeeId, payload) => {
      calls.push(`update:${employeeId}:${payload.agentIdRef}`)
      return { ...legacyEmployee, ...payload }
    },
    deleteAgent: async (agentId) => {
      calls.push(`delete:${agentId}`)
    },
  })

  assert.equal(result.agent.id, '0193b8a0-1111-7000-8000-000000000001')
  assert.equal(result.employee.agentIdRef, '0193b8a0-1111-7000-8000-000000000001')
  assert.deepEqual(calls, [
    'update:employee-1:0193b8a0-1111-7000-8000-000000000001',
  ])
})

test('deletes the new agent when Employee OS persistence fails', async () => {
  const calls: string[] = []
  const failure = new Error('employee write failed')

  await assert.rejects(
    installPresetMarketEmployee(PRESET_MARKET_EMPLOYEES[0], [], {
      getBaseAgent: async () => baseAgent,
      createAgent: async () => ({
        ...baseAgent,
        id: '0193b8a0-2222-7000-8000-000000000002',
        is_builtin: false,
      }),
      createEmployee: async () => {
        throw failure
      },
      updateEmployee: async () => legacyEmployee,
      deleteAgent: async (agentId) => {
        calls.push(`delete:${agentId}`)
      },
    }),
    failure,
  )

  assert.deepEqual(calls, ['delete:0193b8a0-2222-7000-8000-000000000002'])
})

test('rejects non-UUID agent references as incomplete installations', () => {
  const preset = PRESET_MARKET_EMPLOYEES[0]

  assert.equal(
    isPresetEmployeeInstalled(preset, [{ ...legacyEmployee, agentIdRef: 'agent-missing' }]),
    false,
  )
})

test('treats a UUID reference missing from the current agent list as repairable', () => {
  const preset = PRESET_MARKET_EMPLOYEES[0]
  const materializedEmployee = {
    ...legacyEmployee,
    agentIdRef: '11111111-1111-4111-8111-111111111111',
  }

  assert.equal(isPresetEmployeeInstalled(preset, [materializedEmployee], []), false)
  assert.equal(
    isPresetEmployeeInstalled(preset, [materializedEmployee], [
      { id: materializedEmployee.agentIdRef },
    ]),
    true,
  )
})
