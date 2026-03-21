import { type Plugin, tool } from "@opencode-ai/plugin"
import {
  createDiscussionStartHandler,
  createDiscussionRecordHandler,
  createDiscussionSummaryHandler,
  createDiscussionSetupHandler,
  createAnalystRecordHandler,
} from "./tools/debate"

export const discussionAgent: Plugin = async (ctx) => {
  const handleDiscussionStart = createDiscussionStartHandler(ctx)
  const handleDiscussionRecord = createDiscussionRecordHandler(ctx)
  const handleDiscussionSummary = createDiscussionSummaryHandler(ctx)
  const handleDiscussionSetup = createDiscussionSetupHandler()
  const handleAnalystRecord = createAnalystRecordHandler(ctx)

  return {
    tool: {
      "discussion-setup": tool({
        description: "自动配置讨论插件 - 创建agent和command配置文件",
        args: {},
        async execute() {
          return await handleDiscussionSetup()
        },
      }),
      "discussion-start": tool({
        description: "启动一场协作式讨论",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          analystRoles: tool.schema
            .string()
            .optional()
            .describe("分析者角色描述，多个角色用分号分隔"),
          maxRounds: tool.schema
            .number()
            .default(10)
            .describe("最大讨论轮数"),
        },
        async execute(args, context) {
          return await handleDiscussionStart(args)
        },
      }),
      "discussion-record": tool({
        description: "汇总记录 - 主持人使用，记录每轮各分析者的观点摘要到record.log",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          round: tool.schema.number().describe("当前轮次"),
          analystName: tool.schema.string().describe("分析者名称"),
          content: tool.schema.string().describe("分析内容摘要"),
        },
        async execute(args, context) {
          return await handleDiscussionRecord(args)
        },
      }),
      "analyst-record": tool({
        description: "分析者记录 - 分析者使用，将自己的分析记录到个人日志",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          role: tool.schema.string().describe("分析者角色名，如 tech, economic, risk"),
          round: tool.schema.number().describe("当前轮次"),
          content: tool.schema.string().describe("分析内容"),
        },
        async execute(args, context) {
          return await handleAnalystRecord(args)
        },
      }),
      "discussion-summary": tool({
        description: "生成讨论分析报告",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          summary: tool.schema.string().describe("讨论摘要"),
          consensus: tool.schema.string().describe("共识点"),
          disagreements: tool.schema.string().describe("分歧点"),
          conclusion: tool.schema.string().describe("综合建议"),
        },
        async execute(args, context) {
          return await handleDiscussionSummary(args)
        },
      }),
    },
  }
}

export default discussionAgent
