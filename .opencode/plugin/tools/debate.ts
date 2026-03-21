import { readFile, writeFile, mkdir } from "node:fs/promises"
import { existsSync } from "node:fs"
import { resolve, dirname, join } from "node:path"
import type { PluginInput } from "@opencode-ai/plugin"
import type { DebateSession } from "../types"
import { generateDebateHeader, generateRoundEntry, generateSummarySection } from "../utils/logger"
import AGENT_DISCUSSION_HOST from "../prompts/agents/discussion-host.mdx"
import AGENT_ANALYST from "../prompts/agents/analyst.mdx"
import COMMAND_DISCUSSION from "../prompts/commands/discussion.mdx"

const DEFAULT_MAX_ROUNDS = 10
const DEFAULT_DISCUSSION_LOG_DIR = "discussion-logs"
const RECORD_FILE = "record.log"
const SUMMARY_FILE = "summarize.log"

function getConfigDir(): string {
  const home = process.env.HOME || process.env.USERPROFILE || ""
  return join(home, ".config", "opencode")
}

export function createDiscussionStartHandler(ctx: PluginInput) {
  return async function handleDiscussionStart(args: {
    topic: string
    analystRoles?: string
    maxRounds?: number
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { topic, analystRoles, maxRounds = DEFAULT_MAX_ROUNDS } = args

      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50)
      const topicFolder = safeTopic

      const session: DebateSession = {
        id: `discussion-${safeTopic}`,
        topic,
        questionerRole: analystRoles || "待定",
        answererRole: "",
        maxRounds,
        currentRound: 0,
        status: "pending",
        logFile: topicFolder,
        createdAt: new Date().toISOString(),
      }

      const header = generateDebateHeader(topic, analystRoles, "", maxRounds)
      const logsDir = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR)
      const topicDir = join(logsDir, topicFolder)

      if (!existsSync(logsDir)) {
        await mkdir(logsDir, { recursive: true })
      }

      if (existsSync(topicDir)) {
        return `讨论主题文件夹已存在: ${DEFAULT_DISCUSSION_LOG_DIR}/${topicFolder}\n\n请使用新的讨论话题，或删除现有文件夹后重试。`
      }

      await mkdir(topicDir, { recursive: true })

      await writeFile(join(topicDir, RECORD_FILE), header, "utf-8")
      await writeFile(join(topicDir, SUMMARY_FILE), "", "utf-8")

      return `讨论已启动！\n\n话题: ${topic}\n最大轮数: ${maxRounds}\n${analystRoles ? `分析者角色: ${analystRoles}` : ""}\n\n记录文件: ${DEFAULT_DISCUSSION_LOG_DIR}/${topicFolder}/${RECORD_FILE}\n\n请确定参与的分析者数量和角色（如技术专家、经济专家等），然后开始讨论循环。`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `启动讨论失败: ${errMsg}`
    }
  }
}

export function createDiscussionRecordHandler(ctx: PluginInput) {
  return async function handleDiscussionRecord(args: {
    logFile: string
    round: number
    analystName: string
    content: string
    thinking?: string
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { logFile, round, analystName, content, thinking } = args

      const analystLogFile = `analyst-${analystName}.log`
      const entry = `### 第 ${round} 轮 - ${analystName}\n\n**思考过程**: ${thinking || ""}\n\n**分析内容**:\n${content}\n\n---\n`
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, logFile, analystLogFile)
      const existingContent = await readFile(filePath, "utf-8").catch(() => "")
      await writeFile(filePath, existingContent + entry, "utf-8")

      const summaryEntry = `### 第 ${round} 轮 - ${analystName}\n\n${content}\n\n---\n`
      const recordPath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, logFile, RECORD_FILE)
      const recordContent = await readFile(recordPath, "utf-8").catch(() => "")
      await writeFile(recordPath, recordContent + summaryEntry, "utf-8")

      return `${analystName} 第 ${round} 轮分析已记录`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `记录失败: ${errMsg}`
    }
  }
}

export function createAnalystRecordHandler(ctx: PluginInput) {
  return async function handleAnalystRecord(args: {
    role: string
    round: number
    content: string
  }): Promise<string> {
    try {
      const { directory } = ctx
      const { role, round, content } = args

      const safeRole = role.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_")
      const analystLogFile = `analyst-${safeRole}.log`

      const entry = `### 第 ${round} 轮 - ${role}\n\n${content}\n\n---\n`
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, analystLogFile)
      const existingContent = await readFile(filePath, "utf-8").catch(() => "")
      await writeFile(filePath, existingContent + entry, "utf-8")

      return `分析者 ${role} 第 ${round} 轮分析已记录到 ${analystLogFile}`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `记录失败: ${errMsg}`
    }
  }
}

export function createDiscussionSummaryHandler(ctx: PluginInput) {
  return async function handleDiscussionSummary(args: {
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
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, logFile, SUMMARY_FILE)

      const existingContent = await readFile(filePath, "utf-8").catch(() => "")
      await writeFile(filePath, existingContent + report, "utf-8")

      return `分析报告已生成并追加到 ${DEFAULT_DISCUSSION_LOG_DIR}/${logFile}/${SUMMARY_FILE}`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `生成报告失败: ${errMsg}`
    }
  }
}

export function createDiscussionSetupHandler() {
  return async function handleDiscussionSetup(): Promise<string> {
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

      await writeFile(join(agentsDir, "discussion-host.md"), AGENT_DISCUSSION_HOST, "utf-8")
      results.push("Created: discussion-host.md")

      await writeFile(join(agentsDir, "analyst.md"), AGENT_ANALYST, "utf-8")
      results.push("Created: analyst.md")

      await writeFile(join(commandsDir, "discussion.md"), COMMAND_DISCUSSION, "utf-8")
      results.push("Created: discussion.md")

      const jsonConfig = `{
  "agent": {
    "discussion-host": {
      "mode": "primary",
      "description": "讨论主持人 - 发起话题、协调讨论、总结分析",
      "permission": {
        "task": {
          "analyst": "allow"
        }
      },
      "tools": {
        "discussion-start": true,
        "discussion-record": true,
        "discussion-summary": true
      }
    },
    "analyst": {
      "mode": "subagent",
      "description": "分析者 - 从特定角度分析问题，与其他分析者协作讨论",
      "task_budget": 15
    }
  }
}`

      return `✅ 讨论插件配置完成！重启 opencode 即可使用 /discussion 命令启动讨论！
`
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error)
      return `配置失败: ${errMsg}`
    }
  }
}
