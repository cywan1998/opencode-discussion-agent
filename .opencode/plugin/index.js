// .opencode/plugin/index.ts
import { tool } from "@opencode-ai/plugin";

// .opencode/plugin/tools/debate.ts
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve, join } from "node:path";

// .opencode/plugin/utils/logger.ts
function generateDiscussionHeader(topic, analystRoles, maxRounds) {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
  return `# 讨论记录

          ## 基本信息

          - **话题**: ${topic}
          - **时间**: ${now}
          - **最大轮数**: ${maxRounds || 10}
          - **状态**: 进行中

          ---

          ## 参与方

          ${analystRoles ? `分析者角色: ${analystRoles}` : "待定"}

          ---

          ## 讨论记录

          ---
        `;
}
function generateSummarySection(summary, consensus, disagreements, conclusion) {
  return `## 分析报告

          ### 讨论摘要

          ${summary}

          ---

          ### 共识点

          ${consensus || "无"}

          ---

          ### 分歧点

          ${disagreements || "无"}

          ---

          ### 综合建议

          ${conclusion}

          ---

          *讨论结束*
          `;
}

// .opencode/plugin/prompts/agents/discussion-host.mdx
var discussion_host_default = `---
description: 讨论主持人 - 发起话题、协调讨论、总结分析
mode: primary
permission:
  task:
    analyst: allow
tools:
  discussion-start: true
  discussion-record: true
  discussion-summary: true
---
# 讨论主持人

你是一场协作式讨论的主持人，负责协调多个分析者从不同角度深入探讨话题，共同形成更完善的理解和方案。

**重要：你是在代替用户与各分析者协作。用户是观察者，只会观察讨论过程和结果。不要询问用户的意见或打扰用户。**

## 核心原则

1. **协作而非对立**: 各位分析者是协作关系，共同目标是深化理解和形成更好的方案
2. **角度互补**: 每个分析者从不同角度分析问题，补充彼此的视角
3. **建设性讨论**: 关注方案的合理性和可行性，而非争论胜负
4. **知识共享**: 鼓励分享资料、研究成果，相互学习
5. **自主决策**: 所有决策由你做出，不需要询问用户意见

## 工作流程

1. **初始化**: 使用 \`discussion-start\` 工具启动讨论
2. **讨论循环**:
   - 根据话题自主确定参与的分析者数量和角色（如2-3个不同领域的专家）
   - 依次或并行调用各分析者，请他们从各自角度分析问题
   - 使用 \`discussion-record\` 记录每位分析者的观点
   - 鼓励分析者阅读其他人的观点，进行回应和补充
   - **提示**: 每次调用分析者时，可以告诉他们讨论记录位置：\`{讨论目录}/record.log\`
3. **终止判断**: 
   - 检查是否达到最大轮数
   - 检查是否已形成较为完善的共识或方案
4. **总结**: 使用 \`discussion-summary\` 生成分析报告后，向用户汇报结果

## 分析者角色设定

**重要：角色设定原则**：
1. 每个分析者代表一个**专业角度**或**关注领域**
2. 角色应该互补，从不同维度分析问题
3. 避免设定"支持/反对"的对立角色
4. 每个角色都应该对问题的解决有建设性贡献

**角色设定示例**：
- 分析师A: 技术专家 - 关注技术可行性和实现难度
- 分析师B: 经济专家 - 关注成本收益和资源分配
- 分析师C: 风险分析师 - 关注潜在风险和应对措施

**根据话题灵活设定**：
- 分析者数量: 2-6人，根据场景决定数量
- 角色类型: 技术/经济/法律/伦理/实践/用户视角等
- 具体角色应根据话题特点来确定

## Task 工具调用规范

**重要**: 调用 task 工具时，prompt 参数必须遵循以下规则：

1. prompt 内容中**禁止使用中文引号** \`""\` 或 \`''\`
2. 话题内容用英文双引号或不用引号
3. prompt 应该是纯文本，不要包含特殊格式字符
4. **可以在 prompt 中告诉分析者他们可以使用搜索工具**
5. **可以提醒分析者使用 read 工具查阅之前的讨论内容**

**正确示例**:

    task(
      description="技术专家分析",
      prompt="讨论话题是"Java学习规划"，你的角色是 tech（技术专家），当前是第 1 轮。主持人的问题是：请从技术可行性角度分析，重点关注：1) 技术难度 2) 实现路径 3) 潜在技术风险。分析完成后，使用 analyst-record 工具记录：topic=Java学习规划, role=tech, round=1, question=请从技术可行性角度分析，重点关注技术难度、实现路径和潜在技术风险, content=你的分析内容。",
      agent="analyst"
    )

## 行为准则

- 保持中立，促进协作而非对立
- 引导讨论聚焦核心问题和方案的完善
- 及时记录讨论内容
- 控制讨论在合理轮数内
- **严格遵守 Task 工具调用规范，避免 JSON 解析错误**

## 输出格式

所有讨论会自动保存到文件。讨论结束后，输出以下分析报告:
- **讨论摘要**: 整体讨论的主题和进展
- **各方观点**: 各分析者从不同角度的分析
- **共识点**: 各方达成一致的内容
- **分歧点**: 各方观点不一致的地方
- **综合建议**: 基于讨论的综合性建议
`;

// .opencode/plugin/prompts/agents/analyst.mdx
var analyst_default = `---
description: 分析者 - 从特定角度分析问题，与其他分析者协作讨论
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
  analyst-record: true
  write: false
  edit: false
  bash: false
---
# 分析者

你是一个专业的分析者，负责从指定角度深入分析问题，并与主持人和其他分析者协作讨论。

## 核心职责

- 从你代表的专业角度分析问题
- 查阅资料，提供有据可查的分析
- 回应其他分析者的观点，进行补充或提出建设性意见
- 与其他分析者协作，共同完善对问题的理解和方案

## 行为准则

- **协作心态**: 你是讨论的参与者，不是对手。目标是共同完善方案，而非战胜他人
- **专业深度**: 从你的专业角度提供深入分析
- **知识共享**: 分享相关资料、研究和案例
- **建设性反馈**: 对其他人的观点，可以提出补充建议，而不是简单否定
- **承认局限**: 对不确定或有争议的部分，坦诚说明
- **逻辑严谨**: 论点需要有依据支撑

## 分析方法

1. **问题拆解**: 将复杂问题分解为多个维度
2. **资料收集**: 使用搜索工具查阅相关资料和数据
3. **利弊分析**: 分析方案的优缺点
4. **风险评估**: 识别潜在风险和应对措施
5. **可行性论证**: 评估方案的现实可行性
6. **综合建议**: 基于分析给出建设性建议

## 输出要求

直接输出你的分析内容，不需要额外解释。内容应该清晰、有条理、有依据。

## 记录要求

完成分析后，使用 analyst-record 工具记录：
- topic: 讨论话题（主持人在任务中已告知）
- role: 你的角色名称（主持人在任务中已告知）
- round: 当前轮次（主持人在任务中已告知）
- question: 主持人的问题（主持人在任务中已告知）
- content: 你的完整分析内容

分析会自动保存到你的个人日志文件中。
`;

// .opencode/plugin/prompts/commands/discussion.mdx
var discussion_default = `---
description: 启动一场协作式讨论
agent: discussion-host
---
请作为讨论主持人启动一场协作式讨论。

讨论话题是: {{input}}

请按照以下步骤进行：
1. 使用 discussion-start 工具初始化讨论
2. 确定参与的分析者数量和角色（如技术专家、经济专家等）
3. 协调讨论循环，每轮调用各分析者
4. 使用 discussion-record 记录每轮分析
5. 判断是否形成共识或达到最大轮数
6. 使用 discussion-summary 生成分析报告
`;

// .opencode/plugin/tools/debate.ts
var DEFAULT_MAX_ROUNDS = 10;
var DEFAULT_DISCUSSION_LOG_DIR = "discussion-logs";
var RECORD_FILE = "record.log";
var SUMMARY_FILE = "summarize.log";
function getConfigDir() {
  const home = process.env.HOME || process.env.USERPROFILE || "";
  return join(home, ".config", "opencode");
}
function createDiscussionStartHandler(ctx) {
  return async function handleDiscussionStart(args) {
    try {
      const { directory } = ctx;
      const { topic, analystRoles, maxRounds = DEFAULT_MAX_ROUNDS } = args;
      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
      const topicFolder = safeTopic;
      const session = {
        id: `discussion-${safeTopic}`,
        topic,
        questionerRole: analystRoles || "待定",
        answererRole: "",
        maxRounds,
        currentRound: 0,
        status: "pending",
        logFile: topicFolder,
        createdAt: new Date().toISOString()
      };
      const header = generateDiscussionHeader(topic, analystRoles, maxRounds);
      const logsDir = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR);
      const topicDir = join(logsDir, topicFolder);
      if (!existsSync(logsDir)) {
        await mkdir(logsDir, { recursive: true });
      }
      if (existsSync(topicDir)) {
        return `讨论主题文件夹已存在: ${DEFAULT_DISCUSSION_LOG_DIR}/${topicFolder}

请使用新的讨论话题，或删除现有文件夹后重试。`;
      }
      await mkdir(topicDir, { recursive: true });
      await writeFile(join(topicDir, RECORD_FILE), header, "utf-8");
      await writeFile(join(topicDir, SUMMARY_FILE), "", "utf-8");
      return `讨论已启动！

话题: ${topic}
最大轮数: ${maxRounds}
${analystRoles ? `分析者角色: ${analystRoles}` : ""}

记录文件: ${DEFAULT_DISCUSSION_LOG_DIR}/${topicFolder}/${RECORD_FILE}

请确定参与的分析者数量和角色（如技术专家、经济专家等），然后开始讨论循环。`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return `启动讨论失败: ${errMsg}`;
    }
  };
}
function createDiscussionRecordHandler(ctx) {
  return async function handleDiscussionRecord(args) {
    try {
      const { directory } = ctx;
      const { topic, round, analystName, content } = args;
      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
      const entry = `### 第 ${round} 轮 - ${analystName}

${content}

---
`;
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, safeTopic, RECORD_FILE);
      const existingContent = await readFile(filePath, "utf-8").catch(() => "");
      await writeFile(filePath, existingContent + entry, "utf-8");
      return `${analystName} 第 ${round} 轮分析已记录到 record.log`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return `记录失败: ${errMsg}`;
    }
  };
}
function createAnalystRecordHandler(ctx) {
  return async function handleAnalystRecord(args) {
    try {
      const { directory } = ctx;
      const { topic, role, round, question, content } = args;
      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
      const safeRole = role.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_");
      const analystLogFile = `analyst-${safeRole}_${round}.log`;
      const entry = `### 第 ${round} 轮 - ${role}

          **主持人的问题**: ${question || ""}

          **分析内容**:
          ${content}
      ---
      `;
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, safeTopic, analystLogFile);
      const existingContent = await readFile(filePath, "utf-8").catch(() => "");
      await writeFile(filePath, existingContent + entry, "utf-8");
      return `${role} 第 ${round} 轮分析已记录到 ${analystLogFile}`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return `记录失败: ${errMsg}`;
    }
  };
}
function createDiscussionSummaryHandler(ctx) {
  return async function handleDiscussionSummary(args) {
    try {
      const { directory } = ctx;
      const { topic, summary, consensus, disagreements, conclusion } = args;
      const safeTopic = topic.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "_").slice(0, 50);
      const report = generateSummarySection(summary, consensus, disagreements, conclusion);
      const filePath = resolve(directory, DEFAULT_DISCUSSION_LOG_DIR, safeTopic, SUMMARY_FILE);
      const existingContent = await readFile(filePath, "utf-8").catch(() => "");
      await writeFile(filePath, existingContent + report, "utf-8");
      return `分析报告已生成并追加到 ${safeTopic}/${SUMMARY_FILE}`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return `生成报告失败: ${errMsg}`;
    }
  };
}
function createDiscussionSetupHandler() {
  return async function handleDiscussionSetup() {
    try {
      const configDir = getConfigDir();
      const agentsDir = join(configDir, "agents");
      const commandsDir = join(configDir, "commands");
      const results = [];
      if (!existsSync(agentsDir)) {
        await mkdir(agentsDir, { recursive: true });
        results.push(`Created: ${agentsDir}`);
      }
      if (!existsSync(commandsDir)) {
        await mkdir(commandsDir, { recursive: true });
        results.push(`Created: ${commandsDir}`);
      }
      await writeFile(join(agentsDir, "discussion-host.md"), discussion_host_default, "utf-8");
      results.push("Created: discussion-host.md");
      await writeFile(join(agentsDir, "analyst.md"), analyst_default, "utf-8");
      results.push("Created: analyst.md");
      await writeFile(join(commandsDir, "discussion.md"), discussion_default, "utf-8");
      results.push("Created: discussion.md");
      return `✅ 讨论插件配置完成！重启 opencode 即可使用 /discussion 命令启动讨论！`;
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      return `配置失败: ${errMsg}`;
    }
  };
}

// .opencode/plugin/index.ts
var discussionAgent = async (ctx) => {
  const handleDiscussionStart = createDiscussionStartHandler(ctx);
  const handleDiscussionRecord = createDiscussionRecordHandler(ctx);
  const handleDiscussionSummary = createDiscussionSummaryHandler(ctx);
  const handleDiscussionSetup = createDiscussionSetupHandler();
  const handleAnalystRecord = createAnalystRecordHandler(ctx);
  return {
    tool: {
      "discussion-setup": tool({
        description: "自动配置讨论插件 - 创建agent和command配置文件",
        args: {},
        async execute() {
          return await handleDiscussionSetup();
        }
      }),
      "discussion-start": tool({
        description: "启动一场协作式讨论",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          analystRoles: tool.schema.string().optional().describe("分析者角色描述，多个角色用分号分隔"),
          maxRounds: tool.schema.number().default(10).describe("最大讨论轮数")
        },
        async execute(args, context) {
          return await handleDiscussionStart(args);
        }
      }),
      "discussion-record": tool({
        description: "汇总记录 - 主持人使用，记录每轮各分析者的观点摘要到record.log",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          round: tool.schema.number().describe("当前轮次"),
          analystName: tool.schema.string().describe("分析者名称"),
          content: tool.schema.string().describe("分析内容摘要")
        },
        async execute(args, context) {
          return await handleDiscussionRecord(args);
        }
      }),
      "analyst-record": tool({
        description: "分析者记录 - 分析者使用，将自己的分析记录到个人日志",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          role: tool.schema.string().describe("分析者角色名，如 tech, economic, risk"),
          round: tool.schema.number().describe("当前轮次"),
          question: tool.schema.string().optional().describe("主持人的问题"),
          content: tool.schema.string().describe("分析内容")
        },
        async execute(args, context) {
          return await handleAnalystRecord(args);
        }
      }),
      "discussion-summary": tool({
        description: "生成讨论分析报告",
        args: {
          topic: tool.schema.string().describe("讨论话题"),
          summary: tool.schema.string().describe("讨论摘要"),
          consensus: tool.schema.string().describe("共识点"),
          disagreements: tool.schema.string().describe("分歧点"),
          conclusion: tool.schema.string().describe("综合建议")
        },
        async execute(args, context) {
          return await handleDiscussionSummary(args);
        }
      })
    }
  };
};
var plugin_default = discussionAgent;
export {
  discussionAgent,
  plugin_default as default
};

//# debugId=4876201D84658B3264756E2164756E21
//# sourceMappingURL=index.js.map
