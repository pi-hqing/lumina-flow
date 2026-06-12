# Lumina Widget · UX 综合流程图

> 基于 [Agent Desktop Widget UX.md](Agent%20Desktop%20Widget%20UX.md) Final 版本生成  
> 覆盖：生命周期、用户触发、Agent 决策、Escalation、通知、专注模式、Spotlight Command Center

---

## 0. Spotlight Command Center 流程

```mermaid
flowchart TD
    Trigger["⌨️ Ctrl+K / Ctrl+Shift+Space<br/>唤起 Spotlight"] --> Open["✨ Spotlight 打开<br/>弹性模态面板"]

    Open --> ModeCheck{"输入框内容?"}

    ModeCheck -->|空| Suggestions["💡 建议模式<br/>suggestions"]
    ModeCheck -->|有输入| Search["🔍 搜索模式<br/>search"]

    Suggestions --> ContextSuggestions["🧠 上下文建议<br/>· 继续执行计划<br/>· 跟进会议笔记<br/>· 查看紧急邮件<br/>· 检查 Jira 工单"]
    Suggestions --> ActionSuggestions["⚡ 快捷操作<br/>· AI 摘要 (⌘↩)<br/>· 创建执行计划 (⌘P)"]

    Search --> FilteredResults["📋 按来源分组的搜索结果<br/>全部 / Jira / 邮件 / 文档 / 代码"]

    Open --> PlanEntry{"有活跃执行计划?"}
    PlanEntry -->|是| ActivePlanCard["📊 活跃计划卡片<br/>进度条 + 当前步骤"]
    ActivePlanCard -->|点击查看详情| PlanPreview["🔄 计划预览模式<br/>plan_preview"]

    Open --> ShortcutPlan["⌘P 快捷键"]
    Open --> ShortcutAI["⌘↩ 快捷键"]

    ShortcutPlan --> PlanPreview
    ShortcutAI --> AISummaryPanel

    PlanPreview --> PlanInput["✏️ 输入计划目标"]
    PlanInput --> PlanGenerate["🤖 生成执行步骤<br/>Streaming 骨架屏"]
    PlanGenerate --> PlanEdit["📝 可编辑预览<br/>· 重排序<br/>· 删除<br/>· 插入<br/>· 重命名"]
    PlanEdit --> PlanConfirm["✅ 确认并执行"]
    PlanConfirm --> ActivePlanCard

    AISummaryPanel["📄 AI 摘要面板<br/>ai_summary"] --> Sources["📚 引用来源"]
    AISummaryPanel --> StreamingSummary["🔄 流式生成摘要"]
    AISummaryPanel --> FollowUpActions["⚡ 后续操作<br/>· 在 Widget 中询问<br/>· 复制<br/>· 打开来源"]

    Open --> Esc{"Esc 键"}
    Esc --> Close["✖ 关闭 Spotlight"]

    subgraph Keyboard_Shortcuts["⌨️ 键盘导航"]
        Nav["↑↓ 导航条目"]
        Enter["Enter 选择/打开预览"]
        Tab["Tab 切换来源标签"]
        Cmd1_5["⌘1-5 切换来源"]
        Esc["Esc 关闭/返回"]
        CmdP["⌘P 创建执行计划"]
        CmdEnter["⌘↩ AI 摘要"]
    end

    subgraph Content_Priority["📊 内容优先级"]
        P1["P1: 上下文建议<br/>(输入为空时)"]
        P2["P2: 活跃执行计划<br/>(如有运行中计划)"]
        P3["P3: 快捷操作建议<br/>(用户输入时)"]
        P4["P4: 搜索结果<br/>(按来源分组)"]
    end
```

---

## 1. 系统总览

```mermaid
graph TD
    User["👤 用户"]

    User --> Widget["🖥️ Widget<br/>轻量操作层"]

    Widget --> Conversation["💬 统一会话<br/>问答 · 轻任务 · 通知"]

    Conversation --> Agent["🤖 Agent"]

    Agent --> Escalation["📤 Escalation<br/>携带上下文"]

    Escalation --> MainApp["🏠 主应用<br/>完整能力层"]

    MainApp --> Database["🗄️ 数据层"]

    Agent --> Database
```

---

## 2. Widget 生命周期状态机

```mermaid
stateDiagram-v2
    [*] --> Collapsed : 启动

    Collapsed --> Expanded : 点击悬浮球
    Collapsed --> Expanded : 快捷键唤起
    Collapsed --> Expanded : 通知触发 (High 优先级)

    Expanded --> Thinking : 提交请求

    Thinking --> Streaming : 首 Token 到达
    Thinking --> Error : 超时 / 失败

    Streaming --> Idle : 响应完成

    Idle --> Collapsed : 自动收起 (3s)
    Idle --> Expanded : 用户继续输入

    Expanded --> Collapsed : Esc 键
    Expanded --> Collapsed : 点击外部区域
    Expanded --> Collapsed : 点击 × 关闭

    Expanded --> EscalationState : 触发 Escalation
    EscalationState --> MainApp : 打开主应用
    MainApp --> Collapsed : Widget 收起

    Error --> Idle : 重试成功
    Error --> Collapsed : 用户关闭
```

---

## 3. 折叠态 → 展开态触发路径

```mermaid
flowchart LR
    A["🔵 折叠态<br/>Layer 1"] --> B["🟢 点击悬浮球"]
    A --> C["⌨️ 全局快捷键<br/>Ctrl+Shift+Space"]
    A --> D["🔔 通知触发<br/>仅 High 优先级"]

    B --> E["📂 展开态<br/>Layer 2"]
    C --> E
    D --> E

    E --> F["输入框自动聚焦"]
    F --> G["用户输入 / 操作"]
```

---

## 4. 展开态 → 收起态路径

```mermaid
flowchart TD
    E["📂 展开态"] --> Check1{"输入框有内容?"}

    Check1 -->|是| EscFirst["按 Esc → 清空输入框"]
    EscFirst --> EscSecond["再按 Esc → 收起"]
    EscSecond --> C["🔵 折叠态"]

    Check1 -->|否| EscDirect["按 Esc → 直接收起"]
    EscDirect --> C

    E --> ClickOutside{"点击外部区域?"}
    ClickOutside -->|输入中 / Agent 响应中| Stay["保持展开"]
    ClickOutside -->|其他情况| C

    E --> ClickX["点击 × 按钮"]
    ClickX --> C

    E --> TaskDone["任务完成"]
    TaskDone --> Delay["显示完成态 3s"]
    Delay --> C
```

---

## 5. Agent 决策树

```mermaid
flowchart TD
    Input["📝 用户输入"] --> Intent["🎯 意图识别"]

    Intent --> Classify{"📋 任务分类"}

    Classify -->|"信息获取<br/>问答 / 翻译 / 解释"| Answer["💬 会话中流式输出"]
    Answer --> Done["✅ 完成"]

    Classify -->|"轻任务<br/>待办 / 消息 / 自动化"| Execute["📋 会话中执行<br/>InlineCard 反馈"]
    Execute --> Done

    Classify -->|"通知查看/响应"| NotifyCard["🔔 会话中插入<br/>通知 InlineCard"]
    NotifyCard --> Done

    Classify -->|"模糊意图<br/>无法确定"| Clarify["❓ 澄清追问<br/>提供选项引导"]
    Clarify --> Input

    Classify -->|"超出边界 (软限制)<br/>>3轮 / >200字 / >2分钟"| SoftEscalation["⚠️ 软 Escalation"]
    SoftEscalation --> UserChoice{"用户选择?"}
    UserChoice -->|继续在这里| Answer
    UserChoice -->|打开主应用| MainApp["🏠 主应用"]

    Classify -->|"不可逆操作 (硬限制)<br/>批量删除 / 权限 / 资金"| HardEscalation["🚫 硬 Escalation"]
    HardEscalation --> MainAppForce["强制打开主应用"]
    MainAppForce --> MainApp
```

---

## 6. Escalation 完整流程

```mermaid
flowchart TD
    Request["📝 用户请求"] --> Judge{"🔍 Escalation 判定"}

    Judge -->|"符合 Widget 能力<br/>轻量 / 短时 / 安全"| WidgetExec["🖥️ Widget 内执行"]
    WidgetExec --> Done["✅ 完成"]

    Judge -->|"软限制触发<br/>>3轮 / >200字 / >2分钟"| SoftPrompt["💬 展示建议提示<br/>「建议在主应用中完成」"]
    SoftPrompt --> SoftChoice{"用户选择?"}
    SoftChoice -->|"继续在这里"| WidgetExec
    SoftChoice -->|"打开主应用"| EscalationFlow

    Judge -->|"硬限制触发<br/>不可逆操作"| HardPrompt["🚫 展示强制提示<br/>仅「打开主应用」选项"]
    HardPrompt --> EscalationFlow

    EscalationFlow["📤 上下文传递"]
    EscalationFlow --> ContextPacket["打包数据：<br/>· session_id<br/>· 输入草稿<br/>· 操作意图<br/>· 最近 3 条消息"]
    ContextPacket --> OpenMain["🏠 打开主应用"]
    OpenMain --> WidgetCollapse["Widget 自动收起"]
    WidgetCollapse --> MainContinue["用户在主应用无缝接续"]
```

---

## 7. 通知三级策略

```mermaid
flowchart TD
    Event["📢 事件产生"] --> Priority{"⚡ 优先级判定"}

    Priority -->|L1 轻量| L1["🔹 折叠角标<br/>不打断用户"]
    Priority -->|L2 普通| L2["🔸 折叠角标 + 摘要<br/>用户自主查看"]
    Priority -->|L3 高优| L3["🔴 需打断判定"]

    L3 --> FocusCheck{"🧘 专注模式?"}
    FocusCheck -->|是| L3Badge["降级为角标<br/>不打断"]
    FocusCheck -->|否| FullScreen{"🖥️ 全屏 / 演示?"}

    FullScreen -->|是| Silent["🔇 完全静默"]
    FullScreen -->|否| DND{"🔕 免打扰?"}

    DND -->|是| Silent
    DND -->|否| Popup["Widget 展开<br/>消息流中插入通知 InlineCard"]

    Popup --> Action{"用户响应?"}
    Action -->|点击行动按钮| ExecuteAction["执行快捷操作"]
    Action -->|关闭| Close["收起至折叠态"]
    Action -->|忽略| Dismiss["标为已忽略"]

    L1 --> BadgeClick{"用户点击角标?"}
    L2 --> BadgeClick
    BadgeClick -->|是| OpenWidget
    BadgeClick -->|否| KeepBadge["保留角标"]

    L3Badge --> BadgeClick
```

---

## 8. 专注模式行为

```mermaid
stateDiagram-v2
    Normal --> FocusMode : 系统 Focus API OR 手动开关
    FocusMode --> Normal : 两者均关闭

    state FocusMode {
        [*] --> L1Only : 仅 L1 角标
        L1Only --> Badge : 角标提示
        Badge --> L1Only : 用户查看后
    }

    Normal --> FullScreen : 进入全屏
    FullScreen --> Normal : 退出全屏

    state FullScreen {
        [*] --> Silent : 完全静默
    }
```

---

## 9. 三层 IA 转换

```mermaid
flowchart TD
    L1["🔵 Layer 1 · 折叠态<br/>悬浮入口 / 角标 / 摘要<br/>零注意力占用"] -->|"用户点击 / 快捷键 / 通知触发"| L2

    L2["📂 Layer 2 · 展开态<br/>迷你会话 / 轻任务 / 通知详情<br/>边缘注意力占用"] -->|"任务完成 / Esc / 外部点击 / 超时"| L1

    L2 -->|"Escalation (携带上下文)"| L3
    L2 -->|"Navigation (用户主动跳转)"| L3Nav["🏠 Layer 3 · 主应用<br/>Navigation 跳转"]

    L3["🏠 Layer 3 · 主应用<br/>Escalation 接续<br/>完整能力层"]

    L3 -->|"任务完成"| L1
```

---

## 10. 用户旅程：快速问答（UC-01，核心路径）

```mermaid
flowchart TD
    S1["🧑‍💻 用户处于专注状态"] --> S2["❓ 遇到需要解决的问题"]
    S2 --> S3["⌨️ 快捷键唤起 Widget<br/>打断代价 < 1s"]
    S3 --> S4["📝 输入问题<br/>焦点自动落入输入框"]
    S4 --> S5["⏎ 回车提交"]
    S5 --> S6["🤖 Agent 思考<br/>目标 < 3s"]
    S6 --> S7["📤 Agent 流式输出<br/>首字响应 < 1s"]
    S7 --> S8["✅ 获取答案"]
    S8 --> S9["⏱️ 停留 3s 显示完成态"]
    S9 --> S10["🔵 自动收起至折叠态"]
    S10 --> S11["🧑‍💻 回到专注状态<br/>总打断 < 20s"]

    style S3 fill:#4CAF50,color:#fff
    style S6 fill:#FF9800,color:#fff
    style S7 fill:#2196F3,color:#fff
    style S10 fill:#9E9E9E,color:#fff
```

---

## 11. 用户旅程：Escalation 路径（UC-10）

```mermaid
flowchart TD
    U1["🧑‍💻 用户处于任务间隙"] --> U2["⌨️ 唤起 Widget"]
    U2 --> U3["📝 输入复杂任务请求"]
    U3 --> U4["🤖 Agent 判定触发 Escalation"]
    U4 --> U5{"限制类型?"}

    U5 -->|"软限制"| U6["💬 展示建议提示<br/>[继续在这里] [打开主应用]"]
    U6 --> U7{"用户选择?"}
    U7 -->|继续在这里| U8["🖥️ Widget 内继续"]
    U7 -->|打开主应用| U9

    U5 -->|"硬限制"| U9Hard["🚫 强制提示<br/>仅 [打开主应用]"]

    U9Hard --> U9["📤 传递上下文包"]
    U9 --> U10["🏠 主应用打开"]
    U10 --> U11["🔵 Widget 自动收起"]
    U11 --> U12["🧑‍💻 在主应用中无缝接续"]

    style U4 fill:#FF9800,color:#fff
    style U9 fill:#F44336,color:#fff
    style U10 fill:#4CAF50,color:#fff
```

---

## 12. 通知冷却期与存在感矩阵

```mermaid
flowchart TD
    NotifSent["📢 通知已推送"] --> Cooldown{"⏱️ 30s 冷却期内?"}

    Cooldown -->|是| Suppress["🔇 同类通知静默"]
    Cooldown -->|否| Matrix

    Matrix{"用户状态 / 事件优先级"} -->|"普通 + High"| Interrupt["打断展开"]
    Matrix -->|"普通 + Medium"| Badge["折叠角标"]
    Matrix -->|"普通 + Low"| Silent["完全静默"]
    Matrix -->|"专注模式 + High"| Badge
    Matrix -->|"专注模式 + 其他"| Silent
    Matrix -->|"全屏 / 演示 / 免打扰 + 任意"| Silent
```

---

## 13. Agent 状态机（技术视角）

```mermaid
stateDiagram-v2
    Idle --> Thinking : 用户提交
    Thinking --> Streaming : 首 Token
    Thinking --> Error : 超时

    Streaming --> Idle : 完成
    Streaming --> Error : 流中断

    Error --> Retry : 用户重试
    Retry --> Thinking : 重新请求
    Retry --> Idle : 放弃
```

---

## 14. 后台任务流程

```mermaid
flowchart TD
    Start["▶️ 启动后台任务"] --> Running["⏳ 执行中"]
    Running --> Completed["✅ 完成"]
    Running --> Failed["❌ 失败"]

    Completed --> Notify["🔔 通知用户"]
    Failed --> Retry{"🔄 自动重试?"}
    Retry -->|是| Running
    Retry -->|否| NotifyFail["🔔 通知失败"]

    Notify --> UserAction{"用户操作?"}
    NotifyFail --> UserAction
    UserAction -->|查看详情| OpenWidget["展开 Widget"]
    UserAction -->|忽略| Close["保持折叠"]
```

---

## 15. Hover 快捷动作（Copilot 模式）

```mermaid
flowchart TD
    HoverStart["🖱️ 鼠标 Hover 悬浮球"] --> Timer{"⏱️ Hover > 300ms?"}
    Timer -->|否| Nothing["无动作"]
    Timer -->|是| ContextDetect["🔍 检测焦点应用"]

    ContextDetect --> General["通用场景<br/>总结页面 / 解释内容 / 会议纪要"]
    ContextDetect --> Jira["Jira<br/>测试用例 / 阻塞分析 / 拆分 Subtask"]
    ContextDetect --> Email["邮件<br/>起草回复 / 提取待办 / 总结邮件链"]
    ContextDetect --> Code["代码编辑器<br/>解释代码 / 优化性能 / 写单元测试"]

    General --> Chips["💊 胶囊按钮组淡入"]
    Jira --> Chips
    Email --> Chips
    Code --> Chips

    Chips --> Click{"用户点击?"}
    Click -->|是| AutoExpand["面板展开 + 自动发送指令"]
    Click -->|鼠标移出 > 400ms| FadeOut["按钮组淡出"]

    AutoExpand --> AgentProcess["🤖 Agent 处理"]
```

---

> **颜色约定：** 🟢 成功 / 正常 · 🟡 警告 / 思考中 · 🔴 错误 / 硬限制 · 🔵 折叠 / 静默 · ⚪ 中性 / 过渡
