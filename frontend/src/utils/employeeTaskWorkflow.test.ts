import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildEmployeeChatEntry,
  buildEmployeeChatSessionDescription,
  buildTaskConversionPayload,
  parseEmployeeIdFromSessionDescription,
} from './employeeTaskWorkflow'

test('builds a titled chat entry bound to the selected employee and agent', () => {
  assert.deepEqual(
    buildEmployeeChatEntry({
      sessionId: 'session-1',
      employeeId: 'employee-1',
      employeeName: '售前专家',
      agentId: 'agent-1',
      agentMode: 'smart-reasoning',
    }),
    {
      title: '与【售前专家】的需求沟通',
      menuItem: {
        title: '与【售前专家】的需求沟通',
        path: 'chat/session-1',
        id: 'session-1',
        isMore: false,
        isNoTitle: false,
        description: 'employee-os:employee:employee-1',
      },
      route: {
        path: '/platform/chat/session-1',
        query: {
          employeeId: 'employee-1',
          agent_id: 'agent-1',
          agent_mode: 'smart-reasoning',
        },
      },
    },
  )
})

test('persists and restores employee identity through the session description', () => {
  const description = buildEmployeeChatSessionDescription('employee-1')
  assert.equal(description, 'employee-os:employee:employee-1')
  assert.equal(parseEmployeeIdFromSessionDescription(description), 'employee-1')
  assert.equal(parseEmployeeIdFromSessionDescription('regular session'), '')
})

test('builds task conversion payload from the current employee and session', () => {
  assert.deepEqual(
    buildTaskConversionPayload({
      employeeId: 'employee-1',
      conversationId: 'session-1',
      title: ' 已确认的报价方案 ',
    }),
    {
      employeeId: 'employee-1',
      conversationId: 'session-1',
      title: '已确认的报价方案',
    },
  )
})

test('uses a stable fallback title for an untitled session', () => {
  assert.equal(
    buildTaskConversionPayload({
      employeeId: 'employee-1',
      conversationId: 'session-1',
      title: '  ',
    }).title,
    '与数字员工前置沟通下发的任务',
  )
})
