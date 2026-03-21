# OpenCode Discussion Agent

An OpenCode plugin that enables collaborative discussion between multiple AI agents to explore topics and develop solutions together.

## Overview

This plugin provides a discussion framework with:
- **Discussion Host** (primary agent): Orchestrates the discussion and coordinates analysts
- **Analysts** (subagents): Multiple specialists analyzing from different angles

The agents collaborate rather than debate - each brings their expertise to collectively deepen understanding and develop better solutions. All discussions are recorded for reference.

## Features

- Custom tools for discussion management:
  - `discussion-setup`: Auto-configure agents and commands (run once after install)
  - `discussion-start`: Initialize a discussion session
  - `discussion-record`: Record each analyst's analysis
  - `discussion-summary`: Generate analysis report
- Flexible analyst roles - customize based on topic needs (technical, economic, risk, legal, etc.)
- Detailed logging with both summary and individual analyst records
- Consensus detection and configurable round limits
- Web search capabilities for real-time information

## Quick Start

### 1. Install Plugin

Add to your `opencode.json`:

```json
{
  "plugin": ["opencode-debate-agent"]
}
```

### 2. Restart OpenCode

Restart your OpenCode session.

### 3. Run Setup

Input this during AI init:

```
use discussion-setup to init discussion agents
```

This will automatically create:
- `~/.config/opencode/agents/discussion-host.md`
- `~/.config/opencode/agents/analyst.md`
- `~/.config/opencode/commands/discussion.md`

### 4. Restart and Use

Restart OpenCode, then start a discussion:

```
/discussion 如何优化团队协作流程
```

## Discussion Workflow

1. **Host** starts the discussion with a topic
2. **Host** assigns roles to analysts (e.g., Technical Expert, Economic Analyst, Risk Analyst)
3. Each **Analyst**:
   - Reviews previous discussions
   - Provides analysis from their perspective
   - Responds to other analysts' viewpoints
   - Records their analysis
4. **Host** summarizes consensus and disagreements
5. Final report generated

## Logging Structure

```
discussion-logs/{topic}/
├── record.log           # Summary of all discussions
├── summarize.log        # Final analysis report
└── analyst-{name}.log  # Individual analyst's detailed records
```

## Customizing Analysts

The host can assign any roles based on the topic. Examples:

| Topic Type | Suggested Analysts |
|------------|------------------|
| Technical decisions | Technical Lead, User Experience, Security Expert |
| Business planning | Market Analyst, Financial Analyst, Operations Expert |
| Policy making | Legal Advisor, Ethics Expert, Stakeholder Representative |
| Project planning | Project Manager, Risk Analyst, Resource Planner |

Each analyst receives context including:
- Their assigned role and focus areas
- The discussion topic
- Access to previous discussion records
- Web search capabilities for research

## Customizing Models

The default configuration does not specify models. You can customize by editing the agent files:

### Edit Agent Markdown Files

Edit `~/.config/opencode/agents/discussion-host.md`:

```yaml
---
description: 讨论主持人
mode: primary
model: qwen3-max  # Add your preferred model
---
```

Edit `~/.config/opencode/agents/analyst.md`:

```yaml
---
description: 分析者
mode: subagent
model: claude-opus-4-5  # Add your preferred model
task_budget: 20
---
```

### Recommended Models

| Agent | Recommended Models |
|-------|------------------|
| discussion-host | qwen3-max, claude-sonnet-4-5 |
| analyst | qwen3-coder-plus, claude-opus-4-5 |

## Project Structure

```
opencode-debate-agent/
├── .opencode/
│   └── plugin/
│       ├── index.ts       # Plugin entry point
│       ├── tools/
│       │   └── debate.ts # Discussion tool implementations
│       ├── types/
│       │   └── index.ts  # Type definitions
│       └── utils/
│           └── logger.ts # Markdown formatting utilities
├── package.json
├── tsconfig.json
└── README.md
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Type checking
bun run typecheck
```

## License

MIT
