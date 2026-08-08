# Employee OS 本地改动记录

> 用途：升级上游 WeKnora 时对照此文件处理冲突和保留本地改动。
> 代码内标记：所有改动点以 `[EmployeeOS]` 注释标注，`grep -rn '\[EmployeeOS\]' internal/` 可快速定位。

## 改动概览

| 文件 | 改动类型 | 影响 |
|------|---------|------|
| `internal/application/service/custom_agent.go` | 新增函数 + 调用点 | 旧租户兼容：智能推理 Agent 模型继承 |
| `internal/application/service/session_agent_qa.go` | 新增函数 + 修改调用 | Rerank 运行时校验粒度修正 |
| `internal/application/service/custom_agent_builtin_model_test.go` | 新增文件 | 模型继承测试 |
| `internal/application/service/agent_rerank_requirement_test.go` | 新增文件 | Rerank 校验测试 |

---

## 1. custom_agent.go — 旧租户智能推理 Agent 执行模型兼容

**关联需求**：`.trellis/tasks/08-02-fix-chat-to-background-task-flow/prd.md` R4

**问题**：早期租户的 `builtin-smart-reasoning` Agent 的 `model_id` 和 `rerank_model_id` 可能为空，
实际模型配置仅保存在 `builtin-quick-answer` Agent 上。Employee OS 在这些租户上启动数字员工任务时，
因模型缺失导致调用失败。

**改动内容**：

### 1.1 新增函数 `inheritLegacyBuiltinExecutionModels`（行 254-277）

```go
func inheritLegacyBuiltinExecutionModels(agents []*types.CustomAgent) {
    // 从快速问答 Agent 继承 ModelID / RerankModelID
    // 仅补齐缺失字段，不覆盖已有显式配置
}
```

### 1.2 新增方法 `applyLegacyBuiltinExecutionModelFallback`（行 279-298）

```go
func (s *customAgentService) applyLegacyBuiltinExecutionModelFallback(
    ctx context.Context, agent *types.CustomAgent, tenantID uint64,
) {
    // 仅处理 builtin-smart-reasoning 且模型字段为空的情况
    // 从数据库加载快速问答 Agent 后调用 inheritLegacyBuiltinExecutionModels
}
```

### 1.3 调用点（行 149、157、245）

- `GetAgentByID`：DB 路径和注册表路径各一处，返回 Agent 前补齐模型
- `ListAgents`：列表返回前批量补齐

**升级处理**：
- 如果上游调整了 `GetAgentByID` / `ListAgents` 的结构，保留这三处调用点
- 如果上游修改了 `CustomAgent.Config` 模型字段，检查 `ModelID` / `RerankModelID` 的访问路径
- 确认所有历史租户的智能推理 Agent 模型均已配置后，可安全移除

---

## 2. session_agent_qa.go — Rerank 运行时校验粒度修正

**关联需求**：`.trellis/tasks/08-02-fix-chat-to-background-task-flow/prd.md` R4

**问题**：原来的 `agentRequiresRerankModel()` 只看 Agent 是否启用 `knowledge_search` 工具，
但本轮请求的实际知识范围可能为空（无 KB/文档/Tag），此时不会调用知识库搜索，Rerank 模型用不上，
却仍被强制要求配置。这导致"一键直发任务"等场景被误拦截。

**改动内容**：

### 2.1 新增函数 `runtimeAgentRequiresRerankModel`（行 18-22）

```go
func runtimeAgentRequiresRerankModel(
    customAgent *types.CustomAgent, agentConfig *types.AgentConfig,
) bool {
    return agentRequiresRerankModel(customAgent) && agentHasKnowledgeScope(agentConfig)
}
```

在原 `agentRequiresRerankModel` 基础上追加 `agentHasKnowledgeScope` 判定：
空知识范围 → 不要求 Rerank 模型。

### 2.2 AgentQA 调用替换（行 101）

```go
// 旧：if agentRequiresRerankModel(req.CustomAgent) {
// 新：if runtimeAgentRequiresRerankModel(req.CustomAgent, agentConfig) {
```

**升级处理**：
- 如果上游修改了 `AgentQA` 中 Rerank 模型获取逻辑，确保保留 `runtimeAgentRequiresRerankModel` 替换
- 如果上游新增了知识范围类型（如新增 Tag 之外的筛选维度），检查 `agentHasKnowledgeScope` 是否需要更新

---

## 3. 测试文件（新增）

### custom_agent_builtin_model_test.go
- `TestInheritLegacyBuiltinExecutionModels`：正常继承路径
- `TestInheritLegacyBuiltinExecutionModelsPreservesExplicitSmartModels`：已有显式配置时不覆盖
- `TestInheritLegacyBuiltinExecutionModelsDoesNotUseUnrelatedAgent`：仅从快速问答继承

### agent_rerank_requirement_test.go
- 空 KB 列表 + 无文档 + 无 Tag 时不要求 Rerank
- 有 KB 列表时要求 Rerank
- 各种边界组合

**升级处理**：两个测试文件是新增的，与上游无冲突。如果上游调整了相关接口签名，
更新测试中的类型引用即可。

---

## 升级检查清单

升级上游 WeKnora 到新版本后，按以下步骤验证：

1. **定位所有改动**：
   ```bash
   grep -rn '\[EmployeeOS\]' internal/
   ```

2. **解决合并冲突**：重点检查 `custom_agent.go` 和 `session_agent_qa.go`

3. **编译验证**：
   ```bash
   go build ./internal/application/service/...
   ```

4. **测试验证**：
   ```bash
   go test ./internal/application/service/ -run "TestAgentRerank|TestInherit" -v
   ```

5. **功能回归**：在旧租户上验证数字员工任务能正常启动，空知识范围的直发任务不被 Rerank 拦截
