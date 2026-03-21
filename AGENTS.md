# AGENTS.md

This document provides guidance for AI agents operating in this repository.

## Project Overview

This is an OpenCode plugin that enables structured debate discussions between AI agents.
The plugin provides tools for orchestrating Q&A debates between a Questioner and Answerer.

## Build / Lint / Test Commands

### Setup
```bash
bun install
```

### Build
```bash
bun run build
# Or with watch mode:
bun run dev
```

### Type Checking
```bash
bun run typecheck
```

### Lint
```bash
bun run lint
# Note: No linter is currently configured
```

### Testing
```bash
bun test
# Run a single test file (bun requires specific pattern):
bun test <path/to/test.file>
```

## Code Style Guidelines

### TypeScript Configuration
- **Target**: ES2022
- **Module**: ESNext with bundler resolution
- **Strict mode**: Enabled
- Use `bun-types` for type definitions

### Imports
- Use `node:` prefix for built-in Node.js modules (e.g., `node:fs/promises`, `node:path`)
- Use `type` modifier for type-only imports: `import type { Foo } from "..."`
- Group imports: external packages first, then internal modules, then local files
- Use named exports unless default export is semantically appropriate (see plugin pattern below)

### Formatting
- Use 2-space indentation
- No semicolons at end of statements
- Use template literals for multi-line strings
- Max line length: ~120 characters (soft)

### Types
- Use `interface` for object shapes; `type` for unions, intersections, aliases
- Mark fields as `readonly` when they should not be mutated after initialization
- Use explicit return types on exported functions
- Avoid `any`; use `unknown` when type is truly unknown, then narrow appropriately

### Naming Conventions
- **Files**: kebab-case for utilities (e.g., `logger.ts`), pascal-case for types (e.g., `types/index.ts`)
- **Functions**: camelCase (e.g., `createDebateStartHandler`)
- **Types/Interfaces**: PascalCase (e.g., `DebateSession`, `DebateStatus`)
- **Constants**: SCREAMING_SNAKE_CASE for module-level primitives (e.g., `DEFAULT_MAX_ROUNDS`)
- **Boolean variables**: prefix with `is`, `has`, `can`, or `should` when appropriate

### Error Handling
- Use `try/catch` in async functions that perform I/O
- On error, extract message safely: `error instanceof Error ? error.message : String(error)`
- Return user-facing error messages as strings; do not throw for expected failure cases
- Use `DebateErrorCode` union type for structured error categorization (see `types/index.ts`)

### Async / Promises
- Use `async/await` exclusively; avoid raw `Promise` chains
- Top-level await is allowed in build scripts (this is a bun project)

### Tool/Plugin Pattern
The plugin follows the OpenCode plugin pattern:
- Export a named `debateAgent: Plugin` and a `default` export
- Handler functions are created via factory functions (`createDebateStartHandler`, etc.)
- Each tool uses the `tool()` helper from `@opencode-ai/plugin` with `description`, `args`, and `execute`
- Tool args use schema builders: `tool.schema.string()`, `.number()`, `.optional()`, `.default()`

### Markdown Output
- For markdown output (debate logs), use template literals with `${}` interpolation
- Use `---` as section dividers
- Chinese punctuation is acceptable in content strings

### File Organization
```
.opencode/plugin/
├── index.ts          # Plugin entry, tool registration
├── tools/
│   └── debate.ts     # Tool implementations, agent/command templates
├── types/
│   └── index.ts      # Type definitions and interfaces
└── utils/
    └── logger.ts     # Markdown generation utilities
```

### Node.js / Bun Compatibility
- This project uses `bun` as the runtime and bundler
- Node built-ins are imported with `node:` prefix
- The build output targets `node` with `esm` format

## Important Implementation Notes

### Task Tool Prompts (from debate.ts)
When calling the `task` tool in debate prompts:
- **Do NOT use Chinese quotation marks** (`""`, `''`) in prompt content
- Use English quotes or no quotes for topic content
- Keep prompts as plain text, no special formatting characters
- Task prompts are embedded in the agent template strings in `tools/debate.ts`

### Debate Agent Role Setting
When defining questioner/answerer roles:
- Both should be **rational analysts** with different perspectives
- Avoid roles requiring support of obviously harmful or unreasonable positions
- Roles should analyze different aspects of a problem, not blindly support one side
- Even "opposing" roles should question from a rational analysis perspective

## Key Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies, scripts, entry points |
| `tsconfig.json` | TypeScript configuration |
| `build.ts` | Bun build script |
| `.opencode/plugin/index.ts` | Plugin registration and tool definitions |
| `.opencode/plugin/tools/debate.ts` | Tool implementations, agent templates |
| `.opencode/plugin/types/index.ts` | TypeScript interfaces and types |
| `.opencode/plugin/utils/logger.ts` | Markdown formatting helpers |
