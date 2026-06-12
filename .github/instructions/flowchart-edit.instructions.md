---
description: "编辑 ux-flowchart.md 时使用。约束 Mermaid 流程图节点命名必须对齐规范术语，确保流程逻辑与 Agent Desktop Widget UX.md 一致。"
applyTo: "ux-flowchart.md"
---

# Lumina Widget 流程图编辑规则

## 核心原则

`ux-flowchart.md` 是 [Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md) 的流程可视化，**不能独立于规范定义新规则或新边界**。

## 术语强制对齐

流程图中所有节点命名必须使用以下规范术语，**禁止混用同义词**：

| 流程图节点 | 对应规范术语 | 禁止写法 |
|-----------|-------------|---------|
| Escalation | 系统判断超出边界，携带上下文打开主应用 | 升级、跳转、转发 |
| Navigation | 用户主动跳转至主应用（无 Escalation 语义） | 导航跳转（当有 Escalation 语义时） |
| 专注模式 | 系统 API OR 手动开关触发 | 免打扰、勿扰模式 |
| L1 / L2 / L3 | 轻量提示 / 普通通知 / 高优打断 | 一级/二级/三级通知 |
| 软 Escalation | 超出软限制（>3轮 / >200字 / >2分钟），用户可选继续 | 建议升级 |
| 硬 Escalation | 不可逆操作（批量删除 / 权限 / 资金），强制跳转 | 强制升级 |

## Mermaid 书写约定

- 保持现有章节结构：系统总览 → 生命周期 → 触发路径 → Agent 决策树 → Escalation 流程 → 通知策略
- 使用中文节点名，必要时用 `<br/>` 添加英文注释
- 状态机使用 `stateDiagram-v2`，流程使用 `flowchart TD/LR`
- 注释用 `%%`，避免放在节点内部
- 新增流程图前先在 [Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md) 中找到对应的交互规则

## 同步检查

流程图变更时，逐项检查：

1. 每个流程图节点是否在规范中有对应的交互规则？
2. Escalation 判定条件是否与 [§ Step 6](../Agent%20Desktop%20Widget%20UX.md#step-6--agent-行为) 一致？
3. 通知分级逻辑是否与 [§ Step 7](../Agent%20Desktop%20Widget%20UX.md#step-7--通知策略) 一致？
4. 生命周期状态转换是否与 [§ Step 5](../Agent%20Desktop%20Widget%20UX.md#step-5--状态体验与生命周期) 一致？
5. 专注模式降级逻辑是否与 D-01 一致？

## 禁止事项

- 不要用流程图定义新的交互规则或边界（规范为准）
- 不要在节点中使用与规范不一致的术语
- 不要跳过 Escalation 判定直接连接用户操作到主应用
- 不要删除现有流程图章节而不在规范中找到对应变更依据
