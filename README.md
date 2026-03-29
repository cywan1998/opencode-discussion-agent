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

## Installation

### 1. Install the package

```bash
npm install opencode-discussion-agent
# or
bun add opencode-discussion-agent
```

### 2. Configure OpenCode

Add the plugin to your `opencode.json`:

```json
{
  "plugin": ["opencode-discussion-agent"]
}
```

### 3. Restart OpenCode

Restart your OpenCode session to load the plugin.

### 4. Run Setup

During your OpenCode session, tell the AI:

```
请使用 discussion-setup 来初始化讨论代理
```

This will automatically create the following configuration files:
- `~/.config/opencode/agents/discussion-host.md` - Discussion host agent configuration
- `~/.config/opencode/agents/analyst.md` - Analyst agent configuration
- `~/.config/opencode/commands/discussion.md` - Discussion command definition

### 5. Restart OpenCode Again

Restart to load the new agents and commands.

## Usage

### Start a Discussion

Use the `/discussion` command to start a new discussion:

```
/discussion 如何优化团队协作流程
```

The discussion host will:
1. Assign roles to analysts based on the topic
2. Guide the discussion through multiple rounds
3. Summarize consensus and disagreements
4. Generate a final analysis report

### Discussion Workflow

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

Discussion logs are saved in the current working directory:

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

### Edit Discussion Host Agent

Edit `~/.config/opencode/agents/discussion-host.md`:

```yaml
---
description: 讨论主持人
mode: primary
model: qwen3-max
---
```

### Edit Analyst Agent

Edit `~/.config/opencode/agents/analyst.md`:

```yaml
---
description: 分析者
mode: subagent
model: qwen3-coder-plus
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
opencode-discussion-agent/
├── .opencode/
│   └── plugin/
│       ├── index.ts       # Plugin entry point
│       ├── tools/
│       │   └── debate.ts  # Discussion tool implementations
│       ├── types/
│       │   └── index.ts   # Type definitions
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
