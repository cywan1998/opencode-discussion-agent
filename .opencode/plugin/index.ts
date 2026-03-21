import { type Plugin, tool } from "@opencode-ai/plugin"
import {
  createDebateStartHandler,
  createDebateRecordHandler,
  createDebateSummaryHandler,
  createDebateSetupHandler,
} from "./tools/debate"

export const debateAgent: Plugin = async (ctx) => {
  const handleDebateStart = createDebateStartHandler(ctx)
  const handleDebateRecord = createDebateRecordHandler(ctx)
  const handleDebateSummary = createDebateSummaryHandler(ctx)
  const handleDebateSetup = createDebateSetupHandler()

  return {
    tool: {
      "debate-setup": tool({
        description: "自动配置辩论插件 - 创建agent和command配置文件",
        args: {},
        async execute() {
          return await handleDebateSetup()
        },
      }),
      "debate-start": tool({
        description: "启动一场辩论讨论",
        args: {
          topic: tool.schema.string().describe("辩论话题"),
          questionerRole: tool.schema
            .string()
            .optional()
            .describe("提问者角色描述"),
          answererRole: tool.schema
            .string()
            .optional()
            .describe("回答者角色描述"),
          maxRounds: tool.schema
            .number()
            .default(10)
            .describe("最大辩论轮数"),
        },
        async execute(args, context) {
          return await handleDebateStart(args)
        },
      }),
      "debate-record": tool({
        description: "记录辩论对话到文件",
        args: {
          logFile: tool.schema.string().describe("日志文件名"),
          round: tool.schema.number().describe("当前轮次"),
          question: tool.schema.string().describe("提问者的提问"),
          answer: tool.schema.string().describe("回答者的回答"),
        },
        async execute(args, context) {
          return await handleDebateRecord(args)
        },
      }),
      "debate-summary": tool({
        description: "生成辩论分析报告",
        args: {
          logFile: tool.schema.string().describe("日志文件名"),
          summary: tool.schema.string().describe("讨论摘要"),
          consensus: tool.schema.string().describe("共识点"),
          disagreements: tool.schema.string().describe("分歧点"),
          conclusion: tool.schema.string().describe("结论"),
        },
        async execute(args, context) {
          return await handleDebateSummary(args)
        },
      }),
    },
  }
}

export default debateAgent
