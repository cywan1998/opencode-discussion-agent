export function generateDebateHeader(
  topic: string,
  questionerRole?: string,
  answererRole?: string,
  maxRounds?: number
): string {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
  return `# 辩论记录

## 基本信息

- **话题**: ${topic}
- **时间**: ${now}
- **最大轮数**: ${maxRounds || 10}
- **状态**: 进行中

---

## 参与方

### 提问者 (Questioner)

- **身份**: ${questionerRole || "质疑方 - 挑战传统观点"}
- **职责**: 针对话题提出深入问题，挑战对方观点

### 回答者 (Answerer)

- **身份**: ${answererRole || "辩护方 - 维护合理立场"}
- **职责**: 对问题给出详细、有论据的回答

---

## 对话记录

---
`
}

export function generateRoundEntry(round: number, question: string, answer: string): string {
  return `### 第 ${round} 轮

**Q (提问者)**:

${question}

---

**A (回答者)**:

${answer}

---
`
}

export function generateSummarySection(
  summary: string,
  consensus: string,
  disagreements: string,
  conclusion: string
): string {
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

### 结论

${conclusion}

---

*辩论结束*
`
}
