# Lumina Widget · Agent Instructions

## 项目性质

本仓库是 **Lumina Widget** 的产品设计规范文档库，全部内容为 Markdown，**没有可执行代码**。  
Widget 是主应用的轻量操作层（常驻悬浮窗），核心理念：**不打断、不跳转、快完成**。

---

## 文档结构

所有规范已合并为单一文件：

**[Agent Desktop Widget UX.md](Agent%20Desktop%20Widget%20UX.md)**

| 章节锚点 | 内容 |
|----------|------|
| [§ Step 1](Agent%20Desktop%20Widget%20UX.md#step-1--明确边界) | Widget 定位、边界与非目标（Non-Goals） |
| [§ Step 2](Agent%20Desktop%20Widget%20UX.md#step-2--用户与场景) | 用户状态模型与核心画像 |
| [§ Step 3](Agent%20Desktop%20Widget%20UX.md#step-3--信息架构ia) | 信息架构（IA） |
| [§ Step 4](Agent%20Desktop%20Widget%20UX.md#step-4--交互规则) | 交互规则（展开/折叠、输入、键盘） |
| [§ Step 5](Agent%20Desktop%20Widget%20UX.md#step-5--状态体验与生命周期) | 状态体验与生命周期（空态、加载、错误、离线等） |
| [§ Step 6](Agent%20Desktop%20Widget%20UX.md#step-6--agent-行为) | Agent 行为规范（澄清、Escalation、工具调用） |
| [§ Step 7](Agent%20Desktop%20Widget%20UX.md#step-7--通知策略) | 通知策略（L1/L2/L3 三级、冷却期、专注模式） |
| [§ Step 8](Agent%20Desktop%20Widget%20UX.md#step-8--工程映射) | 工程映射（组件清单、Design Tokens、状态管理、事件流、WebSocket） |
| [§ Step 9](Agent%20Desktop%20Widget%20UX.md#step-9--数据闭环) | 数据闭环（埋点事件、指标、A/B 测试） |
| [§ Step 10](Agent%20Desktop%20Widget%20UX.md#step-10--一致性校验) | 一致性校验（范围、规则、可实施性三轮校验） |
| [§ 决策记录](Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04) | 决策记录 D-01 ~ D-04（已拍板，不可逆） |

---

## 关键术语约定

- **Escalation**：系统或用户判断任务超出 Widget 边界，携带上下文打开主应用。规范层统一用此术语，界面文案可写"打开主应用"。
- **Navigation**：用户主动跳转至主应用特定页面，不携带 Escalation 语义。
- **专注模式**：系统 API（macOS Focus Mode / Windows Focus Assist）OR Widget 手动开关，任意一个为真即触发。
- **L1 / L2 / L3 通知**：轻量提示 / 普通通知 / 高优打断，详见[§ Step 7](Agent%20Desktop%20Widget%20UX.md#step-7--通知策略)。

---

## 已拍板决策（Final.md）

修改下列规则前必须核对[§ 决策记录](Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04)：

| 决策 | 结论 |
|------|------|
| D-01 专注模式检测 | 系统 API OR Widget 手动开关，任意为真即进入专注模式 |
| D-02 冷却期时长 | MVP 固定 30 秒；后续以 `widget.notification.expired` 比例做 A/B |
| D-03 点击外部收起 | 默认开启；输入中或 Agent 响应中豁免；可在设置中关闭 |
| D-04 折叠态 WebSocket | 有后台 Agent 任务时保持连接；其余断开 + 30 秒轮询 |

---

## 写作约定

- 所有文档均为简体中文。
- 新增规则须遵循 Step 1 的边界定义（Non-Goals 列表是硬约束）。
- 涉及工程实现的内容放入 Step 8；涉及埋点的内容放入 Step 9。
- 引用跨章节内容时使用文件链接，不重复粘贴原文。
