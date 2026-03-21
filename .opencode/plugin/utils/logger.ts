export function generateDiscussionHeader(
  topic: string,
  analystRoles?: string,
  maxRounds?: number
): string {
  const now = new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })
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

### 综合建议

${conclusion}

---

*讨论结束*
`
}
