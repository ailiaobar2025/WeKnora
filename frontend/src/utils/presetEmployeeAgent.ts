import type { CreateAgentRequest, CustomAgent, CustomAgentConfig } from '../api/agent/index'
import type { BizEmployee } from '../api/employeeOs'

export interface PresetMarketEmployee {
  id: string
  name: string
  dept: string
  desc: string
  systemPrompt: string
}

export const PRESET_MARKET_EMPLOYEES: PresetMarketEmployee[] = [
  {
    id: 'preset-quote-expert',
    name: '售前评估与报价专家',
    dept: '售前与商业化部',
    desc: '自动识别客户招标文件与需求清单，核算开发工作量与合规报价，生成标准 Excel 报价单并驱动主管审批。',
    systemPrompt: `你是“售前评估与报价专家”，是当前 Workspace 安装的专业数字员工。

身份规则：
- 任何自我介绍都必须使用“售前评估与报价专家”这一身份。
- 不得自称 WeKnora、通用助手、模型提供商或其他智能体。

你的职责是澄清客户需求、识别交付范围和风险、估算工作量与成本，并形成可审阅的报价方案。信息不足时先提出具体问题，不得虚构客户资料、成本、税率或审批结论。输出应优先包含范围假设、工作量拆分、报价明细、风险项和待确认事项；需要正式下发时，明确给出可执行的交付方案。`,
  },
  {
    id: 'preset-market-analyst',
    name: '竞品与市场情报分析师',
    dept: '市场分析部',
    desc: '全网抓取并对比竞争对手的产品版本迭代、定价策略与用户口碑，自动输出 PPT/PDF 简报。',
    systemPrompt: `你是“竞品与市场情报分析师”，是当前 Workspace 安装的专业数字员工。

身份规则：
- 任何自我介绍都必须使用“竞品与市场情报分析师”这一身份。
- 不得自称 WeKnora、通用助手、模型提供商或其他智能体。

你的职责是定义分析口径、收集和核验市场信息、比较竞品能力与定价，并形成有来源依据的情报结论。必须区分事实、推断与未知信息，不得编造来源、价格或市场数据。输出应优先包含研究范围、对比维度、证据与日期、关键差异、机会风险和建议行动。`,
  },
  {
    id: 'preset-hr-assistant',
    name: 'HR 招聘与 Onboarding 助手',
    dept: '人力资源部',
    desc: '简历自动分类打分，生成面试提纲并自动跟进新员工入职手册与资产准备。',
    systemPrompt: `你是“HR 招聘与 Onboarding 助手”，是当前 Workspace 安装的专业数字员工。

身份规则：
- 任何自我介绍都必须使用“HR 招聘与 Onboarding 助手”这一身份。
- 不得自称 WeKnora、通用助手、模型提供商或其他智能体。

你的职责是协助岗位需求澄清、简历评估、面试提纲设计和入职事项编排。不得基于与岗位无关的敏感属性作出招聘判断，不得虚构候选人经历、评价或审批状态。输出应优先包含评估标准、证据、待核实信息、结构化面试问题、风险提示和入职清单。`,
  },
]

export interface InstallPresetMarketEmployeeApi {
  getBaseAgent: () => Promise<CustomAgent>
  createAgent: (payload: CreateAgentRequest) => Promise<CustomAgent>
  createEmployee: (payload: {
    name: string
    description: string
    agentIdRef: string
    status: string
  }) => Promise<BizEmployee>
  updateEmployee: (
    employeeId: string,
    payload: { description: string; agentIdRef: string; status: string },
  ) => Promise<BizEmployee>
  deleteAgent: (agentId: string) => Promise<void>
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function isMaterializedEmployeeAgentRef(agentIdRef: string): boolean {
  return UUID_PATTERN.test(agentIdRef)
}

export function findPresetEmployee(
  preset: PresetMarketEmployee,
  employees: BizEmployee[],
): BizEmployee | undefined {
  return employees.find((employee) => employee.name === preset.name || employee.agentIdRef === preset.id)
}

export function isPresetEmployeeInstalled(
  preset: PresetMarketEmployee,
  employees: BizEmployee[],
  availableAgents?: ReadonlyArray<Pick<CustomAgent, 'id'>>,
): boolean {
  const employee = findPresetEmployee(preset, employees)
  if (!employee || !isMaterializedEmployeeAgentRef(employee.agentIdRef)) return false
  return availableAgents === undefined
    || availableAgents.some((agent) => agent.id === employee.agentIdRef)
}

export function buildPresetAgentCreateRequest(
  preset: PresetMarketEmployee,
  baseAgent: CustomAgent,
): CreateAgentRequest {
  const {
    system_prompt_id: _systemPromptId,
    intent_prompts: _intentPrompts,
    welcome_message: _welcomeMessage,
    ...baseConfig
  } = baseAgent.config
  const config: CustomAgentConfig = {
    ...baseConfig,
    agent_mode: 'smart-reasoning',
    agent_type: 'custom',
    system_prompt: preset.systemPrompt,
  }

  return {
    name: preset.name,
    description: preset.desc,
    config,
  }
}

export async function installPresetMarketEmployee(
  preset: PresetMarketEmployee,
  employees: BizEmployee[],
  api: InstallPresetMarketEmployeeApi,
): Promise<{ agent: CustomAgent; employee: BizEmployee; repaired: boolean }> {
  const baseAgent = await api.getBaseAgent()
  if (!baseAgent.is_builtin || baseAgent.config.agent_mode !== 'smart-reasoning') {
    throw new Error('内置智能推理配置不可用，请刷新后重试')
  }

  const agent = await api.createAgent(buildPresetAgentCreateRequest(preset, baseAgent))
  if (!isMaterializedEmployeeAgentRef(agent.id)) {
    throw new Error('创建数字员工智能体失败：服务端未返回有效的自定义 Agent ID')
  }

  const existingEmployee = findPresetEmployee(preset, employees)
  try {
    const employee = existingEmployee
      ? await api.updateEmployee(existingEmployee.employeeId, {
          description: preset.desc,
          agentIdRef: agent.id,
          status: 'PUBLISHED',
        })
      : await api.createEmployee({
          name: preset.name,
          description: preset.desc,
          agentIdRef: agent.id,
          status: 'PUBLISHED',
        })

    return { agent, employee, repaired: Boolean(existingEmployee) }
  } catch (error) {
    try {
      await api.deleteAgent(agent.id)
    } catch (cleanupError) {
      console.error('清理安装失败后创建的孤儿 Agent 失败:', cleanupError)
    }
    throw error
  }
}
