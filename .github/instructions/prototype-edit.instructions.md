---
description: "编辑 prototype.html 时使用。约束原型页只做视觉与交互演示，避免把规范、实现细节或不可逆决策写进原型。"
applyTo: "prototype.html"
---

# Lumina Widget 原型页编辑规则

## 目标

- `prototype.html` 是交互式高保真原型，只用于展示视觉语言、动效和交互演示。
- 它不是实现代码，也不是规范正文的替代品。
- 任何交互边界、术语定义或决策结论，优先以 [Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md) 为准。

## 编辑原则

- 优先保留现有结构、状态演示和动效节奏，避免无必要的整页重写。
- 除非明确需要改版，尽量保留 Tailwind CDN、GSAP、字体与现有的视觉变量配置。
- 修改视觉样式时，保持与 Widget 的定位一致：轻量、不中断、强调快速完成。
- 原型中的文案、状态和按钮命名应与规范术语一致，特别是 Escalation、Navigation、专注模式、L1/L2/L3。

## 参照顺序

- 视觉与动效参考：`prototype.html`
- 结构与边界来源：[Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md)
- 状态机与流程草图：[ux-flowchart.md](../ux-flowchart.md)
- 规范写作约定：[spec-writing.instructions.md](spec-writing.instructions.md)

## 禁止事项

- 不要把原型页写成完整业务实现。
- 不要在原型里引入与规范冲突的新能力或新边界。
- 不要把原型里的临时展示状态当成最终规范结论。
- 不要为演示目的破坏现有可读性、可交互性或设备适配。

## 变更检查

- 如果改动涉及边界、通知策略、专注模式或 Escalation 判定，先对照 [Agent Desktop Widget UX.md](../Agent%20Desktop%20Widget%20UX.md) 的对应章节。
- 如果改动只是视觉或布局微调，保持与现有主题、信息层级和状态反馈一致即可。
