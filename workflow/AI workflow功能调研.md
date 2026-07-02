# AI workflow功能调研

## 调研背景
了解企业 AI 工作流平台，对其功能、架构、API、扩展能力进行调研，并与其他主流方案进行对比

## 调研对象
 - [x] 50%：Dify（重点，做完整 Demo）
 - [ ] 20%：n8n（做自动化 Demo）
 - [ ] 15%：Flowise（体验 AI Workflow）
 - [ ] 15%：LangChain（理解框架思想）

### 1. Dify 功能调研
Dify 是一个开源 AI 应用开发平台，通过 Workflow、Prompt、Knowledge、Agent 等能力，实现低代码 AI 应用开发。
#### 核心能力
**Workflow**使流程无需编写代码，通过节点配置即可直接完成 AI 流程的构建。
**Prompt** 管理直接在 Dify 配置。
**HTTP Request** 节点可直接调用接口，返回结果若为字符串可使用code节点进行处理。
**Knowledge**（RAG）
支持上传：
* PDF
* Word
* Markdown
* FAQ
* 产品说明

Workflow 可直接查询知识库。

适合：
* 产品文档
* 故障手册
* 公司制度
* 使用说明

**Agent** 能够自主调用工具完成任务。
查询天气 -> 调用天气 API -> 继续分析 -> 返回结果

**多模型支持** Dify 支持多模型调用，支持 OpenAI、Anthropic、Cohere、HuggingFace 等模型。



#### Dify 与 FastAPI 的职责划分

推荐架构：

```text
UI
↓
Dify（AI Workflow 平台，多工具接口调用）
↓
FastAPI
↓
数据库
```

FastAPI：

负责：

* Dify的API-Key
* 数据接口
* MQTT
* 数据库
* Redis
* 文件
* 图片
* 权限
* YOLO（目标检测）
* OCR

Dify：

负责：

* Prompt
* AI Workflow
* AI 决策
* Tool Calling
* Agent
* Knowledge
* 模型调用
* 输出格式

职责更加清晰。

#### API 调用方式
请求示例：

```text
# local
POST /api/v1/workflow/run
# cloud
curl -X POST 'https://api.dify.ai/v1/workflows/run' \
--header 'Authorization: Bearer {api_key}' \
--header 'Content-Type: application/json' \
--data-raw '{
  "inputs": {},
  "response_mode": "streaming",
  "user": "abc-123"
}'
```


#### 部署方式

Dify 不一定需要本地部署。

原则：

> Dify 必须能够访问 FastAPI。

情况：

1. Dify Cloud + 公网 FastAPI（推荐）

2. 本地 Dify + 本地 FastAPI

3. 本地 Dify + 公网 FastAPI


---

### 2. n8n 功能调研
n8n开源工具，更偏向于自动化工作流，支持多种触发器和节点，适合处理数据集成和自动化任务。
而dify更专注于AI工作流和低代码AI应用开发，一些触发流程需要通过工具来实现。

#### 核心能力
同dify并无什么不同，功能基本相似，若要使用可以直接使用dify的workflow功能，或者使用n8n的workflow功能。
若更偏向流程自动化，n8n可能更适合，能够及时触发流程，且支持多种触发器和节点，适合处理数据集成和自动化任务。

#### n8n & Dify & FastAPI 的职责划分
UI -> FastAPI(封装调用) -> n8n(触发) -> Dify（ai分析） -> FastAPI（调用接口分析数据） -> 数据库 -> n8n（自动化任务） -> mqtt -> UI

#### API 调用方式
可视化调用同dify相似

#### 部署方式
本地部署使用，cloud收费

### 3. Flowise 功能调研
