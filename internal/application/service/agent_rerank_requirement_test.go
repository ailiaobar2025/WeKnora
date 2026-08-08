// [EmployeeOS] Rerank 运行时校验测试：覆盖空知识范围跳过校验、有效范围严格校验等场景。
// 升级上游 WeKnora 时请保留此测试文件。
// 关联：session_agent_qa.go 中的 runtimeAgentRequiresRerankModel
package service

import (
	"testing"

	"github.com/Tencent/WeKnora/internal/agent/tools"
	"github.com/Tencent/WeKnora/internal/types"
	"github.com/stretchr/testify/assert"
)

func TestAgentRequiresRerankModel(t *testing.T) {
	tests := []struct {
		name  string
		agent *types.CustomAgent
		want  bool
	}{
		{
			name: "knowledge search with all knowledge bases",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "all",
				AllowedTools:    []string{tools.ToolKnowledgeSearch},
			}},
			want: true,
		},
		{
			name: "knowledge search with selected knowledge bases",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "selected",
				AllowedTools:    []string{tools.ToolKnowledgeSearch},
			}},
			want: true,
		},
		{
			name: "knowledge search with knowledge bases disabled",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "none",
				AllowedTools:    []string{tools.ToolKnowledgeSearch},
			}},
			want: false,
		},
		{
			name: "default tools with knowledge bases disabled",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "none",
			}},
			want: false,
		},
		{
			name: "wiki tools do not use reranker",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "all",
				AllowedTools:    []string{"wiki_search", "wiki_read_page"},
			}},
			want: false,
		},
		{
			name:  "nil agent",
			agent: nil,
			want:  false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, agentRequiresRerankModel(tt.agent))
		})
	}
}

func TestRuntimeAgentRequiresRerankModel(t *testing.T) {
	knowledgeSearchAgent := func(kbSelectionMode string) *types.CustomAgent {
		return &types.CustomAgent{Config: types.CustomAgentConfig{
			KBSelectionMode: kbSelectionMode,
			AllowedTools:    []string{tools.ToolKnowledgeSearch},
		}}
	}

	tests := []struct {
		name        string
		agent       *types.CustomAgent
		agentConfig *types.AgentConfig
		want        bool
	}{
		{
			name:        "all knowledge bases with empty runtime scope",
			agent:       knowledgeSearchAgent("all"),
			agentConfig: &types.AgentConfig{},
			want:        false,
		},
		{
			name:  "all knowledge bases with resolved knowledge base",
			agent: knowledgeSearchAgent("all"),
			agentConfig: &types.AgentConfig{
				KnowledgeBases: []string{"kb-1"},
			},
			want: true,
		},
		{
			name:  "all knowledge bases with resolved knowledge document",
			agent: knowledgeSearchAgent("all"),
			agentConfig: &types.AgentConfig{
				KnowledgeIDs: []string{"document-1"},
			},
			want: true,
		},
		{
			name:  "all knowledge bases with tag-only search target",
			agent: knowledgeSearchAgent("all"),
			agentConfig: &types.AgentConfig{
				SearchTargets: types.SearchTargets{
					{
						Type:            types.SearchTargetTypeKnowledgeBase,
						KnowledgeBaseID: "kb-1",
						TagIDs:          []string{"tag-1"},
					},
				},
			},
			want: true,
		},
		{
			name:  "disabled knowledge bases with resolved runtime scope",
			agent: knowledgeSearchAgent("none"),
			agentConfig: &types.AgentConfig{
				KnowledgeBases: []string{"kb-1"},
			},
			want: false,
		},
		{
			name: "wiki-only agent with resolved runtime scope",
			agent: &types.CustomAgent{Config: types.CustomAgentConfig{
				KBSelectionMode: "all",
				AllowedTools:    []string{"wiki_search", "wiki_read_page"},
			}},
			agentConfig: &types.AgentConfig{
				KnowledgeBases: []string{"kb-1"},
			},
			want: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.Equal(t, tt.want, runtimeAgentRequiresRerankModel(tt.agent, tt.agentConfig))
		})
	}
}
