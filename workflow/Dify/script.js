const ANALYZE_DELAY_MS = 2000;

const DIFY_CONFIG = {
  endpoint: "https://api.dify.ai/v1/workflows/run",
  apiKey: "app-o0AvVr6idQRvBYXUqVjvuxhS", // 填入你的 Dify API Key，例如: app-xxxx
  user: "abc-123",
  responseMode: "blocking", // 可选: streaming | blocking
  forceApiCall: true
};

const MOCK_RESPONSE = {
  status: "健康",
  risk: "中等",
  score: 92,
  confidence: 98,
  analysis: "电池健康度轻微下降。温度保持正常。",
  suggestion: "建议在 7 天内更换电池。"
};

function getDomRefs() {
  return {
    form: document.getElementById("deviceForm"),
    analyzeBtn: document.getElementById("analyzeBtn"),
    btnLabel: document.querySelector(".btn-label"),
    statusText: document.getElementById("statusText"),
    riskText: document.getElementById("riskText"),
    analysisText: document.getElementById("analysisText"),
    suggestionText: document.getElementById("suggestionText"),
    scoreText: document.getElementById("scoreText"),
    riskSummaryText: document.getElementById("riskSummaryText"),
    confidenceText: document.getElementById("confidenceText"),
    historyBody: document.getElementById("historyBody")
  };
}

function setLoadingState(refs, isLoading) {
  refs.analyzeBtn.disabled = isLoading;
  refs.analyzeBtn.classList.toggle("loading", isLoading);
  refs.btnLabel.textContent = isLoading ? "分析中..." : "开始分析";
}

function toStatusEmoji(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("healthy") || normalized.includes("健康")) return "🟢";
  if (normalized.includes("warning") || normalized.includes("预警")) return "🟡";
  return "🔴";
}

function toRiskEmoji(risk) {
  const normalized = risk.toLowerCase();
  if (normalized.includes("low") || normalized.includes("低")) return "🟢";
  if (normalized.includes("medium") || normalized.includes("中")) return "🟡";
  return "🔴";
}

function statusClass(status) {
  const normalized = status.toLowerCase();
  if (normalized.includes("healthy") || normalized.includes("健康")) return "healthy";
  if (normalized.includes("warning") || normalized.includes("预警")) return "warning";
  return "danger";
}

function riskClass(risk) {
  const normalized = risk.toLowerCase();
  if (normalized.includes("low") || normalized.includes("低")) return "low";
  if (normalized.includes("medium") || normalized.includes("中")) return "medium";
  return "high";
}

function formatAnalysisParagraph(text) {
  return text.replace(/([。.!?])\s*/g, "$1\n").trim();
}

function updateResultView(refs, result) {
  refs.statusText.className = `status-text ${statusClass(result.status)}`;
  refs.statusText.textContent = `${toStatusEmoji(result.status)} ${result.status}`;

  refs.riskText.className = `risk-text ${riskClass(result.risk)}`;
  refs.riskText.textContent = `${toRiskEmoji(result.risk)} ${result.risk}`;

  refs.analysisText.textContent = formatAnalysisParagraph(result.analysis);
  refs.suggestionText.textContent = formatAnalysisParagraph(result.suggestion);

  refs.scoreText.textContent = String(result.score);
  refs.riskSummaryText.textContent = result.risk;
  refs.confidenceText.textContent = `${result.confidence}%`;
}

function createHistoryRiskChip(risk) {
  const normalized = risk.toLowerCase();
  if (normalized.includes("low") || normalized.includes("低")) {
    return '<span class="chip chip-success">低</span>';
  }
  if (normalized.includes("medium") || normalized.includes("中")) {
    return '<span class="chip chip-warning">中等</span>';
  }
  return '<span class="chip chip-danger">高</span>';
}

function prependHistoryRow(refs, payload, result) {
  const row = document.createElement("tr");
  const now = new Date();
  const time = now.toLocaleString("sv-SE", { hour12: false }).replace("T", " ");

  row.innerHTML = `
    <td>${time}</td>
    <td>${payload.deviceId}</td>
    <td>${createHistoryRiskChip(result.risk)}</td>
    <td>${result.status}</td>
    <td>${result.suggestion}</td>
  `;

  refs.historyBody.prepend(row);

  while (refs.historyBody.children.length > 6) {
    refs.historyBody.removeChild(refs.historyBody.lastElementChild);
  }
}

function collectFormPayload(refs) {
  const formData = new FormData(refs.form);
  const parsedDeviceId = Number(formData.get("deviceId"));

  return {
    deviceId: Number.isFinite(parsedDeviceId) ? parsedDeviceId : 0,
    deviceType: String(formData.get("deviceType") || "").trim(),
    temperature: Number(formData.get("temperature") || 0),
    battery: Number(formData.get("battery") || 0),
    signal: String(formData.get("signal") || "").trim(),
    location: String(formData.get("location") || "").trim(),
    prompt: String(formData.get("prompt") || "").trim()
  };
}

function createDifyInputs(payload) {
  return {
    // 与工作流变量对齐：优先使用驼峰字段，兼容下划线字段
    deviceId: payload.deviceId,
    deviceType: payload.deviceType,
    temperature: payload.temperature,
    battery: payload.battery,
    signal: payload.signal,
    location: payload.location,
    prompt: payload.prompt
  };
}

function validatePayload(payload) {
  if (!Number.isFinite(payload.deviceId) || payload.deviceId <= 0) {
    throw new Error("deviceId 必填，且必须是大于 0 的数字。");
  }
}

function normalizeText(value, fallback = "") {
  if (value === null || value === undefined) return fallback;
  return String(value).trim() || fallback;
}

function normalizeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function pickFirstDefined(source, keys, fallback) {
  if (!source || typeof source !== "object") return fallback;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") {
      return source[key];
    }
  }
  return fallback;
}

function normalizeDifyOutputs(outputs) {
  if (!outputs || typeof outputs !== "object") return {};

  const normalized = { ...outputs };
  const text = normalizeText(outputs.text, "");

  if (!text) {
    return normalized;
  }

  const cleanedText = text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    const parsed = JSON.parse(cleanedText);
    if (parsed && typeof parsed === "object") {
      return {
        ...normalized,
        ...parsed
      };
    }
  } catch (_error) {
    // text 不是 JSON 时，按普通文本兜底展示
  }

  if (!normalized.analysis && !normalized.reason) {
    normalized.analysis = text;
  }

  return normalized;
}

function mapDifyOutputsToViewModel(outputs) {
  const normalizedOutputs = normalizeDifyOutputs(outputs);

  const status = normalizeText(
    pickFirstDefined(normalizedOutputs, ["status", "device_status", "health_status", "healthStatus", "状态", "设备状态"], MOCK_RESPONSE.status),
    MOCK_RESPONSE.status
  );

  const risk = normalizeText(
    pickFirstDefined(normalizedOutputs, ["risk", "risk_level", "riskLevel", "level", "风险", "风险等级"], MOCK_RESPONSE.risk),
    MOCK_RESPONSE.risk
  );

  const score = normalizeNumber(
    pickFirstDefined(normalizedOutputs, ["score", "health_score", "healthScore", "健康分", "评分"], MOCK_RESPONSE.score),
    MOCK_RESPONSE.score
  );

  const confidence = normalizeNumber(
    pickFirstDefined(normalizedOutputs, ["confidence", "confidence_score", "置信度"], MOCK_RESPONSE.confidence),
    MOCK_RESPONSE.confidence
  );

  const analysis = normalizeText(
    pickFirstDefined(normalizedOutputs, ["analysis", "reason", "summary", "结论", "分析"], MOCK_RESPONSE.analysis),
    MOCK_RESPONSE.analysis
  );

  const suggestion = normalizeText(
    pickFirstDefined(normalizedOutputs, ["suggestion", "advice", "recommendation", "建议"], MOCK_RESPONSE.suggestion),
    MOCK_RESPONSE.suggestion
  );

  return {
    status,
    risk,
    score,
    confidence,
    analysis,
    suggestion
  };
}

function parseSseChunkToEvents(chunk) {
  const blocks = chunk
    .split("\n\n")
    .map((block) => block.trim())
    .filter(Boolean);

  const events = [];

  for (const block of blocks) {
    const dataLine = block
      .split("\n")
      .find((line) => line.startsWith("data:"));

    if (!dataLine) continue;

    const raw = dataLine.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;

    try {
      events.push(JSON.parse(raw));
    } catch (_error) {
      // 忽略非 JSON 的 data 行
    }
  }

  return events;
}

async function parseDifyStreamingResponse(response) {
  if (!response.body) {
    throw new Error("Dify streaming 响应为空");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  const allEvents = [];
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    const lastDoubleBreak = buffer.lastIndexOf("\n\n");
    if (lastDoubleBreak === -1) continue;

    const parseable = buffer.slice(0, lastDoubleBreak);
    buffer = buffer.slice(lastDoubleBreak + 2);
    allEvents.push(...parseSseChunkToEvents(parseable));
  }

  if (buffer.trim()) {
    allEvents.push(...parseSseChunkToEvents(buffer));
  }

  return allEvents;
}

function extractOutputsFromStreamingEvents(events) {
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const current = events[i];
    const data = current?.data;
    const outputs =
      data?.outputs ||
      current?.outputs ||
      (data && typeof data === "object" ? data : null);

    if (outputs && typeof outputs === "object") {
      return outputs;
    }
  }
  return null;
}

async function runDifyWorkflow(payload) {
  const requestWithInputs = async (inputs) => {
    const requestBody = {
      inputs,
      response_mode: DIFY_CONFIG.responseMode,
      user: DIFY_CONFIG.user
    };

    return fetch(DIFY_CONFIG.endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${DIFY_CONFIG.apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });
  };

  let response = await requestWithInputs(createDifyInputs(payload));

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Dify 请求失败: ${response.status} ${errorText}`);
  }

  if (DIFY_CONFIG.responseMode === "blocking") {
    const data = await response.json();
    const outputs = data?.data?.outputs || data?.outputs || {};
    return mapDifyOutputsToViewModel(outputs);
  }

  const events = await parseDifyStreamingResponse(response);
  const outputs = extractOutputsFromStreamingEvents(events);
  if (!outputs) {
    throw new Error("未从 Dify 流式响应中解析到 outputs");
  }

  return mapDifyOutputsToViewModel(outputs);
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockAnalyzeRequest(payload) {
  await sleep(ANALYZE_DELAY_MS);
  return { ...MOCK_RESPONSE, deviceId: payload.deviceId };
}

async function analyzeDevice(payload) {
  const hasApiKey = Boolean(DIFY_CONFIG.apiKey && DIFY_CONFIG.apiKey.trim());

  if (DIFY_CONFIG.forceApiCall && !hasApiKey) {
    throw new Error("未配置 Dify API Key，请先在 DIFY_CONFIG.apiKey 中填写后再分析。");
  }

  if (!hasApiKey) {
    return mockAnalyzeRequest(payload);
  }

  return runDifyWorkflow(payload);
}

async function handleAnalyze(event, refs) {
  event.preventDefault();

  try {
    setLoadingState(refs, true);
    const payload = collectFormPayload(refs);
    validatePayload(payload);
    const result = await analyzeDevice(payload);

    updateResultView(refs, result);
    prependHistoryRow(refs, payload, result);
  } catch (error) {
    console.error("分析失败:", error);
    alert(error?.message || "分析失败，请稍后重试。");
  } finally {
    setLoadingState(refs, false);
  }
}

function init() {
  const refs = getDomRefs();
  refs.form.addEventListener("submit", (event) => handleAnalyze(event, refs));
}

init();
