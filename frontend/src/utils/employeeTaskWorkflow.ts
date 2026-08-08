import type { CreateTaskPayload } from '@/api/employeeOs'
import type { AgentRuntimeMode } from '@/utils/agent-mode'

interface EmployeeChatEntryInput {
  sessionId: string
  employeeId: string
  employeeName: string
  agentId: string
  agentMode: AgentRuntimeMode
}

interface TaskConversionInput {
  employeeId: string
  conversationId: string
  title?: string
}

const EMPLOYEE_SESSION_DESCRIPTION_PREFIX = 'employee-os:employee:'

export function buildEmployeeChatSessionTitle(employeeName: string): string {
  return `与【${employeeName || '数字员工'}】的需求沟通`
}

export function buildEmployeeChatSessionDescription(employeeId: string): string {
  return `${EMPLOYEE_SESSION_DESCRIPTION_PREFIX}${employeeId}`
}

export function parseEmployeeIdFromSessionDescription(description?: string): string {
  if (!description?.startsWith(EMPLOYEE_SESSION_DESCRIPTION_PREFIX)) return ''
  return description.slice(EMPLOYEE_SESSION_DESCRIPTION_PREFIX.length).trim()
}

export function buildEmployeeChatEntry(input: EmployeeChatEntryInput) {
  const title = buildEmployeeChatSessionTitle(input.employeeName)
  const description = buildEmployeeChatSessionDescription(input.employeeId)
  return {
    title,
    menuItem: {
      title,
      path: `chat/${input.sessionId}`,
      id: input.sessionId,
      isMore: false,
      isNoTitle: false,
      description,
    },
    route: {
      path: `/platform/chat/${input.sessionId}`,
      query: {
        employeeId: input.employeeId,
        agent_id: input.agentId,
        agent_mode: input.agentMode,
      },
    },
  }
}

export function buildTaskConversionPayload(input: TaskConversionInput): CreateTaskPayload {
  return {
    employeeId: input.employeeId,
    conversationId: input.conversationId,
    title: input.title?.trim() || '与数字员工前置沟通下发的任务',
  }
}
