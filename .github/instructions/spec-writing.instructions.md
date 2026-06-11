---
description: "编辑 Lumina Widget 规范文档（Agent Desktop Widget UX.md）时使用。涵盖写作约定、边界约束、术语规范、章节归属规则，防止内容越界或术语混用。"
applyTo: "Agent Desktop Widget UX.md"
---

# Lumina Widget 规范写作规则

## 语言与格式

- 全部使用**简体中文**
- 标题层级：`#` 章标题，`###` 小节，`####` 子项；不使用 `##`
- 表格用于对比/列举，代码块用于示例规则或状态机片段
- 跨章节引用：使用 Markdown 文件链接，**不复制原文**

## 边界约束（硬规则）

新增任何规则前，先对照 [§ Step 1](../Agent%20Desktop%20Widget%20UX.md#step-1--明确边界) §1.2.1 Non-Goals：

```
禁止放入 Widget 的内容：
  ✕ 替代主应用的功能
  ✕ 完整工作流（超出 1~3 轮会话应触发 Escalation）
  ✕ 复杂信息架构（多面板、嵌套导航）
  ✕ 长期阅读界面
  ✕ 多任务工作台
```

如新规则与上述任一条冲突，**不得直接写入**，应改为触发 Escalation 的条件。

## 已拍板决策（不可修改，参见 [§ 决策记录](../Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04)）

| 决策 | 固定值 | 涉及章节 |
|------|--------|---------|
| D-01 专注模式 | 系统 API OR 手动开关，任意为真即触发 | Step 1、Step 4、Step 7 |
| D-02 冷却期 | MVP 固定 30 秒 | Step 7 |
| D-03 点击外部收起 | 默认开启；输入中/Agent响应中豁免 | Step 4、Step 8 |
| D-04 折叠态 WebSocket | 有后台任务时保持连接；其余断开+30秒轮询 | Step 8 |

**修改上述任一值前，必须先更新[§ 决策记录](../Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04)并说明变更原因。**

## 术语规范

| 正确用法 | 禁止混用 | 区别 |
|----------|----------|------|
| **Escalation** | 升级、跳转、转发 | 系统判断任务超出边界，携带上下文打开主应用 |
| **Navigation** | 导航跳转（当有 Escalation 语义时） | 用户**主动**跳转至主应用特定页面，无上下文携带 |
| **专注模式** | 免打扰、勿扰模式 | 系统 API 或手动开关触发，见 D-01 |
| **L1 / L2 / L3** | 一级/二级/三级通知 | 轻量提示/普通通知/高优打断，定义见[§ Step 7](../Agent%20Desktop%20Widget%20UX.md#step-7--通知策略) |

界面文案中 Escalation 和 Navigation 的按钮均可写「打开主应用」，但**规范内部必须区分**。

## 章节归属

所有内容在 [Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md) 的对应章节中编辑：

- 新组件、Design Tokens、状态机、事件流、WebSocket 变更 → [§ Step 8](../Agent%20Desktop%20Widget%20UX.md#step-8--工程映射)
- 新埋点事件、指标、A/B 测试方案 → [§ Step 9](../Agent%20Desktop%20Widget%20UX.md#step-9--数据闭环)
- 影响多章节的决策 → 各章节更新后同步至 [§ 决策记录](../Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04)
- 用户画像/使用场景变更 → [§ Step 2](../Agent%20Desktop%20Widget%20UX.md#step-2--用户与场景)
- 通知策略变更 → [§ Step 7](../Agent%20Desktop%20Widget%20UX.md#step-7--通知策略)
