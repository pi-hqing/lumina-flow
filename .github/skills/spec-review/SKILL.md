---
name: spec-review
description: "审查 Lumina Widget 的规范变更或原型变更。自动加载对应的审查提示词，对照 Agent Desktop Widget UX.md 执行三轮校验（范围、规则一致性、可实施性），输出结构化审查报告。适用场景：提交规范 MR 前自查、原型变更验证、新增规则的边界检查。"
user-invocable: true
---

# Lumina Widget 规范审查

## 工作流程

### 1. 确定审查类型

根据用户输入判断审查对象：

- 用户提供了 `Agent Desktop Widget UX.md` 的新增/修改内容 → **规范审查**
- 用户提供了 `index.html` 的变更描述或 diff → **原型审查**
- 用户未明确 → 追问确认审查类型

### 2. 加载审查提示词

- 规范审查：读取 `../prompts/spec-review.prompt.md` 的内容作为审查框架
- 原型审查：读取 `../prompts/prototype-review.prompt.md` 的内容作为审查框架

### 3. 加载参照规范

读取 [Agent Desktop Widget UX.md](../../Agent%20Desktop%20Widget%20UX.md) 的以下章节作为审查基准：

| 审查维度 | 参照章节 |
|----------|---------|
| 边界合规 | [§ Step 1](../../Agent%20Desktop%20Widget%20UX.md#step-1--明确边界) |
| 交互规则 | [§ Step 4](../../Agent%20Desktop%20Widget%20UX.md#step-4--交互规则) |
| 状态生命周期 | [§ Step 5](../../Agent%20Desktop%20Widget%20UX.md#step-5--状态体验与生命周期) |
| Agent 行为 | [§ Step 6](../../Agent%20Desktop%20Widget%20UX.md#step-6--agent-行为) |
| 通知策略 | [§ Step 7](../../Agent%20Desktop%20Widget%20UX.md#step-7--通知策略) |
| 工程映射 | [§ Step 8](../../Agent%20Desktop%20Widget%20UX.md#step-8--工程映射) |
| 数据闭环 | [§ Step 9](../../Agent%20Desktop%20Widget%20UX.md#step-9--数据闭环) |
| 决策记录 | [§ 决策记录](../../Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04) |

### 4. 执行三轮校验

按审查提示词中的三轮结构逐项检查：

1. **范围校验**：内容是否在 Widget 边界内？是否触及 Non-Goals？
2. **规则一致性校验**：是否与现有规则冲突？术语是否正确？
3. **可实施性校验**：工程映射是否完整？埋点是否定义？

### 5. 输出审查报告

以表格形式输出结论：

```
## 审查报告

| 轮次 | 结果 | 说明 |
|------|------|------|
| 第一轮：范围 | ✓/✕ | ... |
| 第二轮：规则一致性 | ✓/✕ | ... |
| 第三轮：可实施性 | ✓/✕ | ... |

### 问题清单
- [ ] 问题 1
- [ ] 问题 2

### 建议
...
```

## 注意事项

- 审查以 [Agent Desktop Widget UX.md](../../Agent%20Desktop%20Widget%20UX.md) 为唯一真相来源
- `index.html` 不作为交互规则来源，仅检查其是否越界
- 如发现术语混用（如 Escalation 写成"升级"），标记为规则不一致
- 已拍板决策 D-01 ~ D-04 不可挑战，标记冲突但不建议修改
