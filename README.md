# OpenCode Debate Agent

An OpenCode plugin that enables structured debate discussions between AI agents.

## Overview

This plugin provides a debate framework with:
- **Debate Host** (primary agent): Orchestrates the discussion
- **Questioner** (subagent): Poses challenging questions
- **Answerer** (subagent): Provides detailed responses

The agents engage in iterative Q&A until consensus is reached or max rounds are met. All discussions are recorded in Markdown format.

## Features

- Custom tools for debate management:
  - `debate-setup`: Auto-configure agents and commands (run once after install)
  - `debate-start`: Initialize a debate session
  - `debate-record`: Record each Q&A round
  - `debate-summary`: Generate analysis report
- Configurable roles for questioner and answerer
- Markdown-formatted debate logs
- Consensus detection and max round limits
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

input this to AI init:

```
use debate-setup to init debate agents
```

This will automatically create:
- `~/.config/opencode/agents/debate-host.md`
- `~/.config/opencode/agents/questioner.md`
- `~/.config/opencode/agents/answerer.md`
- `~/.config/opencode/commands/debate.md`

### 4. Restart and Use

Restart OpenCode, then start a debate:

```
/debate 人工智能是否会取代人类工作
```

## Customizing Models

The default configuration does not specify models. You can customize by editing the agent files:

### Edit Agent Markdown Files

Edit `~/.config/opencode/agents/debate-host.md`:

```yaml
---
description: 辩论主持人
mode: primary
model: qwen3-max  # Add your preferred model
---
```

Edit `~/.config/opencode/agents/questioner.md`:

```yaml
---
description: 提问者
mode: subagent
model: claude-opus-4-5  # Add your preferred model
task_budget: 20
---
```

Edit `~/.config/opencode/agents/answerer.md`:

```yaml
---
description: 回答者
mode: subagent
model: qwen3-max  # Add your preferred model
task_budget: 20
---
```

### Recommended Models

| Agent | Recommended Models |
|-------|------------------|
| debate-host | qwen3-max, claude-sonnet-4-5 |
| questioner | qwen3-coder-plus, claude-opus-4-5 |
| answerer | qwen3-max, claude-sonnet-4-5 |

## Project Structure

```
opencode-debate-agent/
├── .opencode/
│   └── plugin/
│       ├── index.ts       # Plugin entry point
│       ├── tools/
│       │   └── debate.ts # Debate tool implementations
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
