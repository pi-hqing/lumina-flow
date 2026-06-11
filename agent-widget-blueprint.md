# Agent Desktop Widget Blueprint

# 1. 系统总览
graph TD

User[用户]

User --> Widget

Widget --> Conversation
Widget --> Task
Widget --> Notification

Conversation --> Agent

Task --> Agent

Notification --> Agent

Agent --> Escalation

Escalation --> MainApp

MainApp --> Database

Agent --> Database





# 2. Widget 生命周期



stateDiagram-v2

[*] --> Collapsed

Collapsed --> Expanded : Click
Collapsed --> Expanded : Hotkey
Collapsed --> Expanded : Notification

Expanded --> Thinking : Submit

Thinking --> Streaming : First Token

Thinking --> Error : Timeout

Streaming --> Idle : Complete

Idle --> Collapsed : Auto Collapse

Expanded --> Collapsed : Esc

Expanded --> Collapsed : Outside Click

Expanded --> Escalation

Escalation --> MainApp

MainApp --> Collapsed





# 3. 折叠态 → 展开态



flowchart TD

A[折叠态]

A --> B[点击悬浮球]

A --> C[快捷键]

A --> D[通知触发]

B --> E[展开态]

C --> E

D --> E





# 4. 用户旅程



journey

title Quick Answer Journey

section Working

正在工作: 5

遇到问题: 4

section Widget

快捷键打开: 5

输入问题: 5

获取答案: 5

自动收起: 4

section Continue

继续工作: 5





# 5. Agent 决策树



flowchart TD

Input[用户输入]

Input --> Intent

Intent --> A{任务类型}

A -->|信息获取| Answer

A -->|轻任务| Execute

A -->|模糊意图| Clarify

A -->|超出边界| SoftEscalation

A -->|不可逆操作| HardEscalation

SoftEscalation --> Continue

SoftEscalation --> MainApp

HardEscalation --> MainApp





# 6. Escalation 流程



flowchart TD

Request[用户请求]

Request --> Judge

Judge -->|符合Widget能力| Widget

Judge -->|超出边界| Escalation

Escalation --> Prompt

Prompt --> Continue

Prompt --> OpenMainApp

OpenMainApp --> ContextTransfer

ContextTransfer --> MainApp





# 7. 通知系统



flowchart TD

Event[事件产生]

Event --> Priority

Priority --> L1

Priority --> L2

Priority --> L3

L3 --> Focus

Focus -->|专注模式| Badge

Focus -->|正常模式| Popup

Popup --> Action

Action --> Close

Action --> OpenWidget





# 8. 专注模式



stateDiagram-v2

Normal --> FocusMode

FocusMode --> Normal

FocusMode --> L1Only

L1Only --> Badge

Badge --> Normal





# 9. Agent 状态机



stateDiagram-v2

Idle --> Thinking

Thinking --> Streaming

Thinking --> Error

Streaming --> Idle

Error --> Retry

Retry --> Thinking

Retry --> Idle





# 10. 后台任务流程



flowchart TD

Start[启动任务]

Start --> Running

Running --> Completed

Running --> Failed

Completed --> Notification

Failed --> Retry

Retry --> Running

Notification --> User





# 11. Widget 三层 IA



graph TD

Layer1["Layer1<br/>折叠态"]

Layer2["Layer2<br/>展开态"]

Layer3["Layer3<br/>主应用"]

Layer1 --> Layer2

Layer2 --> Layer1

Layer2 --> Layer3





# 12. 展开态结构



graph TD

ExpandedPanel

ExpandedPanel --> Header

ExpandedPanel --> Content

ExpandedPanel --> Input

ExpandedPanel --> Footer

Content --> ConversationMode

Content --> TaskMode

Content --> NotificationMode





# 13. React 组件树



graph TD

WidgetApp

WidgetApp --> WidgetShell

WidgetShell --> CollapsedEntry

WidgetShell --> ExpandedPanel

ExpandedPanel --> WidgetHeader

ExpandedPanel --> WidgetContent

ExpandedPanel --> WidgetInput

ExpandedPanel --> WidgetFooter

WidgetContent --> ConversationView

WidgetContent --> TaskView

WidgetContent --> NotificationView

ConversationView --> MessageBubble

ConversationView --> StreamingOutput

TaskView --> TaskCard

NotificationView --> NotificationCard





# 14. WebSocket 架构



graph LR

Widget

Widget --> WebSocket

WebSocket --> Agent

Agent --> Notification

Agent --> Task

Agent --> Response

Response --> Widget





# 15. 数据流



sequenceDiagram

User->>Widget: 输入问题

Widget->>Agent: 请求

Agent-->>Widget: Streaming

Widget-->>User: 展示结果

Agent->>Database: 保存会话

Database-->>Agent: 成功





# 16. 埋点体系



flowchart LR

Expand
--> SessionStart

SessionStart
--> MessageSent

MessageSent
--> ResponseReceived

ResponseReceived
--> Complete

ResponseReceived
--> Escalation

Escalation
--> MainApp





# 17. 多显示器迁移



flowchart TD

DisplayA

DisplayA --> FocusChange

FocusChange --> DisplayB

DisplayB --> WidgetMove

WidgetMove --> RestorePosition





# 18. 完整系统蓝图（推荐放文档首页）



graph TD

User

User --> Widget

Widget --> Conversation

Widget --> Task

Widget --> Notification

Conversation --> Agent

Task --> Agent

Notification --> Agent

Agent --> Database

Agent --> BackgroundTask

BackgroundTask --> Notification

Agent --> Escalation

Escalation --> MainApp

MainApp --> Database



这 18 张图已经覆盖了你这份 UX 文档的：

* IA
* User Journey
* State Machine
* Escalation
* Notification
* Agent Flow
* Component Architecture
* WebSocket Architecture
* Analytics

基本可以直接作为 Cursor/Copilot 的 UX Blueprint 输入源。
