// [EmployeeOS] 内置智能推理 Agent 执行模型继承测试：覆盖 ModelID/RerankModelID 为空的补齐逻辑。
// 升级上游 WeKnora 时请保留此测试文件。
// 关联：custom_agent.go 中的 inheritLegacyBuiltinExecutionModels
package service

import (
	"context"
	"testing"

	"github.com/Tencent/WeKnora/internal/application/repository"
	"github.com/Tencent/WeKnora/internal/types"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type builtinModelFallbackRepo struct {
	agents map[string]*types.CustomAgent
}

func loadBuiltinAgentsForModelFallbackTest(t *testing.T) {
	t.Helper()
	require.NoError(t, types.LoadBuiltinAgentsConfig("../../../config"))
}

func (r *builtinModelFallbackRepo) CreateAgent(context.Context, *types.CustomAgent) error {
	return nil
}

func (r *builtinModelFallbackRepo) GetAgentByID(_ context.Context, id string, _ uint64) (*types.CustomAgent, error) {
	agent, ok := r.agents[id]
	if !ok {
		return nil, repository.ErrCustomAgentNotFound
	}
	clone := *agent
	return &clone, nil
}

func (r *builtinModelFallbackRepo) ListAgentsByTenantID(context.Context, uint64) ([]*types.CustomAgent, error) {
	agents := make([]*types.CustomAgent, 0, len(r.agents))
	for _, agent := range r.agents {
		clone := *agent
		agents = append(agents, &clone)
	}
	return agents, nil
}

func (r *builtinModelFallbackRepo) UpdateAgent(context.Context, *types.CustomAgent) error {
	return nil
}

func (r *builtinModelFallbackRepo) DeleteAgent(context.Context, string, uint64) error {
	return nil
}

func (r *builtinModelFallbackRepo) CountByModelID(context.Context, uint64, string) (int64, error) {
	return 0, nil
}

func TestInheritLegacyBuiltinExecutionModels(t *testing.T) {
	quickAnswer := &types.CustomAgent{
		ID: types.BuiltinQuickAnswerID,
		Config: types.CustomAgentConfig{
			AgentMode:     types.AgentModeQuickAnswer,
			ModelID:       " tenant-chat-model ",
			RerankModelID: " tenant-rerank-model ",
		},
	}
	smartReasoning := &types.CustomAgent{
		ID: types.BuiltinSmartReasoningID,
		Config: types.CustomAgentConfig{
			AgentMode:    types.AgentModeSmartReasoning,
			AllowedTools: []string{"knowledge_search"},
		},
	}

	inheritLegacyBuiltinExecutionModels([]*types.CustomAgent{smartReasoning, quickAnswer})

	assert.Equal(t, "tenant-chat-model", smartReasoning.Config.ModelID)
	assert.Equal(t, "tenant-rerank-model", smartReasoning.Config.RerankModelID)
	assert.Equal(t, types.AgentModeSmartReasoning, smartReasoning.Config.AgentMode)
	assert.Equal(t, []string{"knowledge_search"}, smartReasoning.Config.AllowedTools)
}

func TestInheritLegacyBuiltinExecutionModelsPreservesExplicitSmartModels(t *testing.T) {
	quickAnswer := &types.CustomAgent{
		ID: types.BuiltinQuickAnswerID,
		Config: types.CustomAgentConfig{
			ModelID:       "quick-chat-model",
			RerankModelID: "quick-rerank-model",
		},
	}
	smartReasoning := &types.CustomAgent{
		ID: types.BuiltinSmartReasoningID,
		Config: types.CustomAgentConfig{
			ModelID:       "smart-chat-model",
			RerankModelID: "smart-rerank-model",
		},
	}

	inheritLegacyBuiltinExecutionModels([]*types.CustomAgent{quickAnswer, smartReasoning})

	assert.Equal(t, "smart-chat-model", smartReasoning.Config.ModelID)
	assert.Equal(t, "smart-rerank-model", smartReasoning.Config.RerankModelID)
}

func TestInheritLegacyBuiltinExecutionModelsDoesNotUseUnrelatedAgent(t *testing.T) {
	smartReasoning := &types.CustomAgent{ID: types.BuiltinSmartReasoningID}

	inheritLegacyBuiltinExecutionModels([]*types.CustomAgent{
		smartReasoning,
		{ID: "custom-agent", Config: types.CustomAgentConfig{ModelID: "custom-model"}},
	})

	assert.Empty(t, smartReasoning.Config.ModelID)
}

func TestGetBuiltinSmartReasoningInheritsConfiguredBuiltinModels(t *testing.T) {
	loadBuiltinAgentsForModelFallbackTest(t)
	repo := &builtinModelFallbackRepo{agents: map[string]*types.CustomAgent{
		types.BuiltinQuickAnswerID: {
			ID: types.BuiltinQuickAnswerID,
			Config: types.CustomAgentConfig{
				ModelID:       "tenant-chat-model",
				RerankModelID: "tenant-rerank-model",
			},
		},
		types.BuiltinSmartReasoningID: {
			ID: types.BuiltinSmartReasoningID,
			Config: types.CustomAgentConfig{
				AgentMode: types.AgentModeSmartReasoning,
			},
		},
	}}
	service := &customAgentService{repo: repo}
	ctx := context.WithValue(context.Background(), types.TenantIDContextKey, uint64(7))

	agent, err := service.GetAgentByID(ctx, types.BuiltinSmartReasoningID)

	require.NoError(t, err)
	assert.Equal(t, "tenant-chat-model", agent.Config.ModelID)
	assert.Equal(t, "tenant-rerank-model", agent.Config.RerankModelID)
	assert.Equal(t, types.AgentModeSmartReasoning, agent.Config.AgentMode)
}

func TestListAgentsInheritsConfiguredBuiltinModels(t *testing.T) {
	loadBuiltinAgentsForModelFallbackTest(t)
	repo := &builtinModelFallbackRepo{agents: map[string]*types.CustomAgent{
		types.BuiltinQuickAnswerID: {
			ID:     types.BuiltinQuickAnswerID,
			Config: types.CustomAgentConfig{ModelID: "tenant-chat-model"},
		},
		types.BuiltinSmartReasoningID: {
			ID:     types.BuiltinSmartReasoningID,
			Config: types.CustomAgentConfig{AgentMode: types.AgentModeSmartReasoning},
		},
	}}
	service := &customAgentService{repo: repo}
	ctx := context.WithValue(context.Background(), types.TenantIDContextKey, uint64(7))

	agents, err := service.ListAgents(ctx)

	require.NoError(t, err)
	for _, agent := range agents {
		if agent.ID == types.BuiltinSmartReasoningID {
			assert.Equal(t, "tenant-chat-model", agent.Config.ModelID)
			assert.Equal(t, types.AgentModeSmartReasoning, agent.Config.AgentMode)
			return
		}
	}
	t.Fatal("smart-reasoning built-in agent was not returned")
}
