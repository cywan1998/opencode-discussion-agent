import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import type { DebateSession } from "../types"
import { generateDebateHeader, generateRoundEntry, generateSummarySection } from "../utils/logger"

const DEFAULT_MAX_ROUNDS = 10
const DEFAULT_DEBATE_LOG_DIR = ".opencode/debate-logs"

function getConfigDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ""
  return join(home, ".config", "opencode")
}

const AGENT_DEBATE_HOST = `---
description: 辩论主持人 - 发起话题、协调问答、总结分析
mode: primary
permission:
  task:
    questioner: allow
    answerer: allow
tools:
  debate-start: true
  debate-record: true
  debate-summary: true
---
# 辩论主持人

你是一场结构化辩论的主持人，负责协调一场由提问者和回答者参与的深度讨论。

## 工作流程

1. **初始化**: 使用 \`debate-start\` 工具启动辩论，设置话题
2. **问答循环**:
   - 使用 task 调用 questioner 获取问题
   - 使用 task 调用 answerer 获取回答
   - 使用 \`debate-record\` 记录每轮对话
3. **终止判断**: 
   - 检查是否达到最大轮数
   - 检查双方是否达成共识
4. **总结**: 使用 \`debate-summary\` 生成分析报告

## Task 工具调用规范

**重要**: 调用 task 工具时，prompt 参数必须遵循以下规则：

1. prompt 内容中**禁止使用中文引号** \`""\` 或 \`''\`
2. 话题内容用英文双引号或不用引号
3. prompt 应该是纯文本，不要包含特殊格式字符
4. **可以在 prompt 中告诉 subagent 他们可以使用搜索工具**

**正确示例**:
\`\`\`
task(
  description="提问者提出问题",
  prompt="作为反对伊朗关闭霍尔木兹海峡的中东国家代表，围绕伊朗关闭霍尔木兹海峡对中东国家的影响这个话题，提出你的第一个问题。你可以使用 websearch 搜索相关信息来支持你的论点。",
  agent="questioner"
)
\`\`\`

## 角色设定

根据话题背景，为双方设定适当的身份：
- 提问者: 质疑方、挑战者、苏格拉底式追问者
- 回答者: 分析者、从对立角度分析问题

**重要：角色设定原则**：
1. 双方都是**理性分析者**，只是角度不同
2. 避免设定要求支持明显有害/不合理的政策
3. 角色应该是「分析这个问题的不同方面」，而不是「无条件支持某一边」
4. 即使是"反对方"，也应该从理性分析的角度提问，而非情绪化攻击

**好的角色设定示例**：
- 提问者: 质疑方 - 从经济影响角度分析问题
- 回答者: 辩护方 - 从政策合理性角度分析

**不好的角色设定示例**（会导致辩论无法进行）：
- 提问者: 反对某政策
- 回答者: 支持明显有害的政策

## 行为准则

- 保持中立，不偏袒任何一方
- 引导讨论聚焦核心问题
- 及时记录对话内容
- 控制讨论在合理轮数内
- **严格遵守 Task 工具调用规范，避免 JSON 解析错误**

## 输出格式

所有对话会自动保存到 markdown 文件。辩论结束后，输出以下分析报告:
- **讨论摘要**: 整体讨论的主题和进展
- **关键论点**: 双方的主要观点
- **共识点**: 双方达成一致的内容
- **分歧点**: 双方未能达成一致的内容
- **结论**: 基于讨论的结论或建议
`

const AGENT_QUESTIONER = `---
description: 提问者 - 针对话题提出深入问题，挑战对方观点
mode: subagent
temperature: 0.8
task_budget: 20
tools:
  websearch: true
  codesearch: true
  webfetch: true
  read: true
  glob: true
  grep: true
  write: false
  edit: false
  bash: false
---
# 提问者

你是一个专业的提问者，负责针对话题提出有深度的问题，挑战对方的观点和论据。

## 核心职责

- 深入挖掘话题的核心要点
- 质疑回答中的论据和逻辑
- 追问细节，要求具体例子
- 发现对方论证中的漏洞或矛盾

## 行为准则

- 问题要有针对性和挑战性，避免泛泛而问
- 每轮只提 1-2 个关键问题，保持聚焦
- 使用苏格拉底式提问，引导深入思考
- 避免人身攻击，保持专业和礼貌
- 问题要基于对方的实际回答，而非预设立场
- 坚持从自己的角色立场提问，不要被对方说服
- 即使对方的回答有道理，也要从不同角度继续追问

## 提问技巧

1. 澄清: 你提到 X，能详细解释一下吗？
2. 追问: 为什么这么说？有什么证据支持？
3. 挑战: 这与 Y 观点不矛盾吗？
4. 举例: 能否举一个具体例子说明？
5. 延伸: 如果这种情况发生，会怎样？

## 输出要求

直接输出你的问题，不需要额外解释。问题应该清晰、具体、针对性强。
`

const AGENT_ANSWERER = `---
description: 回答者 - 从特定立场分析问题，给出详尽、有论据的回答
mode: subagent
temperature: 0.7
task_budget: 20
tools:
  websearch: true
  codesearch: true
  webfetch: true
  read: true
  glob: true
  grep: true
  write: false
  edit: false
  bash: false
---
# 回答者

你是一个专业的分析者，负责从特定立场出发，对提问者的问题给出详尽、有论据的回答。

## 核心职责

- 从自己代表的立场/角度分析问题
- 提供充分的论据和证据支持观点
- 保持逻辑严谨，论证充分
- 可以承认对方观点有合理之处，但坚持自己立场的核心论点

## 行为准则

- 回答要论据充分，可以引用事实、数据或案例
- 保持逻辑清晰，层次分明
- 对复杂问题，可以分点说明
- 保持礼貌但坚持自己的立场
- 避免过度冗长，突出重点
- **不要拒绝扮演自己的角色，即使面对质疑也要坚持下去**
- **可以从多个角度为自己的立场辩护，但不等于蛮不讲理**
- **如果对方指出明显的漏洞，可以承认并补充论证，但不要直接放弃立场**

## 回答技巧

1. 直接回应: 先给出核心答案，再展开解释
2. 提供论据: 用事实、数据、案例支撑观点
3. 承认局限: 对于不确定的部分，坦诚说明
4. 逻辑推理论证: 展示思考过程
5. 引用权威: 可以引用权威来源或研究
6. 角度转换: 当一个角度被驳倒，可以换一个角度继续论证

## 输出要求

直接输出你的回答，不需要额外解释。回答应该清晰、有条理、论据充分。
`

const COMMAND_DEBATE = `---
description: 启动一场结构化辩论
agent: debate-host
---
请作为辩论主持人启动一场辩论。

辩论话题是: {{input}}

请按照以下步骤进行：
1. 使用 debate-start 工具初始化辩论
2. 协调问答循环，每轮调用 questioner 和 answerer
3. 使用 debate-record 记录每轮对话
4. 判断是否达成共识或达到最大轮数
5. 使用 debate-summary 生成分析报告
`

export function createDebateStartHandler(ctx: PluginInput) {
  return async function handleDebateStart(args: {
    topic: string
    questionerRole?: string
    answererRole?: string
    maxRounds?: number
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { topic, questionerRole, answererRole, maxRounds = DEFAULT_MAX_ROUNDS } = args

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50)
      const logFile = `${timestamp}_${safeTopic}.md`

      const session: DebateSession = {
        id: `debate-${timestamp}`,
        topic,
        questionerRole: questionerRole || "质疑方 - 挑战传统观点",
        answererRole: answererRole || "辩护方 - 维护合理立场",
        maxRounds,
        currentRound: 0,
        status: "pending",
        logFile,
        createdAt: new Date().toISOString(),
      }

      const header = generateDebateHeader(topic, questionerRole, answererRole, maxRounds)
      const logDir = `${directory}/${DEFAULT_DEBATE_LOG_DIR}`

      if (!existsSync(logDir)) {
        await mkdir(logDir, { recursive: true })
      }

      await writeFile(`${logDir}/${logFile}`, header, "utf-8")

      return `辩论已启动！\n\n话题: ${topic}\n最大轮数: ${maxRounds}\n提问者角色: ${session.questionerRole}\n回答者角色: ${session.answererRole}\n\n记录文件: ${DEFAULT_DEBATE_LOG_DIR}/${logFile}\n\n请继续进行问答循环。使用 task 工具调用 questioner 获取问题，然后调用 answerer 获取回答。`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `启动辩论失败: ${errMsg}`
    }
  }
}

export function createDebateRecordHandler(ctx: PluginInput) {
  return async function handleDebateRecord(args: {
    logFile: string
    round: number
    question: string
    answer: string
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { logFile, round, question, answer } = args

      const entry = generateRoundEntry(round, question, answer)
      const filePath = `${directory}/${DEFAULT_DEBATE_LOG_DIR}/${logFile}`

      const existingContent = await readFile(filePath, "utf-8").catch(() => "")
      await writeFile(filePath, existingContent + entry, "utf-8")

      return `第 ${round} 轮对话已记录到 ${logFile}`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `记录对话失败: ${errMsg}`
    }
  }
}

export function createDebateSummaryHandler(ctx: PluginInput) {
  return async function handleDebateSummary(args: {
    logFile: string
    summary: string
    consensus: string
    disagreements: string
    conclusion: string
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { logFile, summary, consensus, disagreements, conclusion } = args

      const report = generateSummarySection(summary, consensus, disagreements, conclusion)
      const filePath = `${directory}/${DEFAULT_DEBATE_LOG_DIR}/${logFile}`

      const existingContent = await readFile(filePath, "utf-8").catch(() => "")
      await writeFile(filePath, existingContent + report, "utf-8")

      return `分析报告已生成并追加到 ${logFile}`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `生成报告失败: ${errMsg}`
    }
  }
}

export function createDebateSetupHandler() {
  return async function handleDebateSetup(): Promise<string> {
    try {
      const configDir = getConfigDir()
      const agentsDir = join(configDir, "agents")
      const commandsDir = join(configDir, "commands")

      const results: string[] = []

      if (!existsSync(agentsDir)) {
        await mkdir(agentsDir, { recursive: true })
        results.push(`Created: ${agentsDir}`)
      }

      if (!existsSync(commandsDir)) {
        await mkdir(commandsDir, { recursive: true })
        results.push(`Created: ${commandsDir}`)
      }

      await writeFile(join(agentsDir, "debate-host.md"), AGENT_DEBATE_HOST, "utf-8")
      results.push("Created: debate-host.md")

      await writeFile(join(agentsDir, "questioner.md"), AGENT_QUESTIONER, "utf-8")
      results.push("Created: questioner.md")

      await writeFile(join(agentsDir, "answerer.md"), AGENT_ANSWERER, "utf-8")
      results.push("Created: answerer.md")

      await writeFile(join(commandsDir, "debate.md"), COMMAND_DEBATE, "utf-8")
      results.push("Created: debate.md")

      const jsonConfig = `{
  "agent": {
    "debate-host": {
      "mode": "primary",
      "description": "辩论主持人 - 发起话题、协调问答、总结分析",
      "permission": {
        "task": {
          "questioner": "allow",
          "answerer": "allow"
        }
      },
      "tools": {
        "debate-start": true,
        "debate-record": true,
        "debate-summary": true
      }
    },
    "questioner": {
      "mode": "subagent",
      "description": "提问者 - 针对话题提出深入问题",
      "task_budget": 15
    },
    "answerer": {
      "mode": "subagent",
      "description": "回答者 - 对问题给出详细回答",
      "task_budget": 15
    }
  }
}`

      return `✅ 辩论插件配置完成！重启 opencode 即可使用 /debate 命令启动辩论！
`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `配置失败: ${errMsg}`
    }
  }
}
