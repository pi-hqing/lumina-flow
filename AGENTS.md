# Lumina Widget · Agent Instructions

## 项目性质

本仓库是 **Lumina Widget** 的产品设计规范文档库，全部内容为 Markdown，**没有可执行代码**。  
Widget 是主应用的轻量操作层（常驻悬浮窗），核心理念：**不打断、不跳转、快完成**。

## 代理工作方式

- 这是文档仓库，不是实现仓库；不要编造构建、测试或运行命令。
- 规范来源优先级：**[Agent Desktop Widget UX.md](Agent%20Desktop%20Widget%20UX.md)** > **[ux-flowchart.md](ux-flowchart.md)** > **[index.html](index.html)**。
- [index.html](index.html) 只作视觉与动效参考，不作为交互规则或边界定义的来源。
- 编辑规范前，先对照 **[spec-writing.instructions.md](.github/instructions/spec-writing.instructions.md)**；编辑流程图前对照 **[flowchart-edit.instructions.md](.github/instructions/flowchart-edit.instructions.md)**；编辑原型前对照 **[prototype-edit.instructions.md](.github/instructions/prototype-edit.instructions.md)**。
- 审查规范时使用 **[`/spec-review`](.github/skills/spec-review/SKILL.md)** 技能（自动加载审查提示词）；也可直接调用 **[规范审查](.github/prompts/spec-review.prompt.md)** 或 **[原型审查](.github/prompts/prototype-review.prompt.md)**。
- 涉及 Step 1 的边界、Non-Goals 或不可逆操作时，默认以 Escalation 处理，而不是扩展 Widget 能力边界。

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

补充参考：

- **[ux-flowchart.md](ux-flowchart.md)**：UX 综合流程图（Mermaid），覆盖生命周期、用户触发、Agent 决策、Escalation、通知、专注模式、Hover 快捷操作。
- **[index.html](index.html)**：交互式高保真原型，用于看视觉语言、动效和布局，不用于定义规则。
- **[规范审查](.github/prompts/spec-review.prompt.md)**：检查新增或修改内容是否与 Step 1、Step 7、Step 8、Step 9、Step 10 一致。
- **[原型审查](.github/prompts/prototype-review.prompt.md)**：检查 index.html 变更是否仍只承担视觉与交互演示职责。
- **[流程图编辑规则](.github/instructions/flowchart-edit.instructions.md)**：编辑 `ux-flowchart.md` 时的术语对齐和同步检查规则。
- **[原型编辑规则](.github/instructions/prototype-edit.instructions.md)**：编辑 `index.html` 时的视觉演示职责约束和注意事项。
- **[`/spec-review` 技能](.github/skills/spec-review/SKILL.md)**：一键触发规范/原型审查工作流，自动加载提示词并输出结构化报告。

---

## 关键术语约定

- **Escalation**：系统或用户判断任务超出 Widget 边界，携带上下文打开主应用。规范层统一用此术语，界面文案可写"打开主应用"。
- **Navigation**：用户主动跳转至主应用特定页面，不携带 Escalation 语义。
- **专注模式**：系统 API（macOS Focus Mode / Windows Focus Assist）OR Widget 手动开关，任意一个为真即触发。
- **L1 / L2 / L3 通知**：轻量提示 / 普通通知 / 高优打断，详见[§ Step 7](Agent%20Desktop%20Widget%20UX.md#step-7--通知策略)。

---

## 已拍板决策

以下决策为不可逆结论（原拟存入 `Final.md`，现直接维护于此）。修改下列规则前必须核对[§ 决策记录](Agent%20Desktop%20Widget%20UX.md#决策记录-d-01--d-04)：

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

---

## 工具与环境

- **[`.vscode/mcp.json`](.vscode/mcp.json)**：配置 Figma MCP 服务器（`figma`），用于从 Figma 设计稿提取设计上下文、截图和元数据。设计到规范或原型的对照时可使用。
- **记忆文件**：`/memories/repo/lumina-widget.md` 和 `/memories/repo/lumina-widget-prototype-instruction.md` 记录仓库级约定与历史决策，代理可查阅。
