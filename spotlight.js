/* ========================================== */
/* Spotlight Command Center – Unified Module  */
/* ========================================== */
/* Public API:
     openSpotlight()
     closeSpotlight()
     continueInWidget()
   All other functions are private to this module.
   Zero dependency on Widget internals except
   expandWidget / addBubble / showSandboxToast
   which are called via global scope.           */
/* ========================================== */

// =============================================
// TypeScript Interfaces (documented as JSDoc)
// =============================================

/**
 * @typedef {'suggestions'|'search'|'plan_preview'|'ai_summary'} SpotlightMode
 */

/**
 * @typedef {Object} SpotlightState
 * @property {boolean} isOpen
 * @property {string} query
 * @property {'all'|'jira'|'email'|'document'|'code'} activeTab
 * @property {SpotlightMode} mode
 * @property {number} selectedResultId
 */

/**
 * @typedef {Object} PlanStep
 * @property {string} id
 * @property {string} title
 * @property {string} system
 * @property {'auto'|'confirm'|'navigation'|'escalation'} executionType
 * @property {string} estimatedDuration
 * @property {string[]} dependency
 * @property {'pending'|'running'|'waiting'|'done'|'failed'|'skipped'} status
 */

/**
 * @typedef {Object} PlanState
 * @property {PlanStep[]} activePlans
 * @property {PlanStep[][]} planHistory
 */

// ── Mock Data ──────────────────────────────
const SPOTLIGHT_DATA = {
  jira: [
    { id: 'j1', title: 'WIDGET-234 · 新增用户权限管理模块', subtitle: '实现角色管理、用户绑定、权限分配', source: 'jira', badge: 'High', extra: '负责人: Epic · 截止: 2026-02-20 · 预计 3-5 天' },
    { id: 'j2', title: 'WIDGET-189 · 修复 WebSocket 断线重连 BUG', subtitle: '网关握手异常导致 502 错误', source: 'jira', badge: 'Critical', extra: '负责人: Steam · 截止: 2026-01-30 · 预计 2 天' },
    { id: 'j3', title: 'WIDGET-301 · 优化通知冷却期算法', subtitle: 'D-02 决策: MVP 30s → A/B 动态调整', source: 'jira', badge: 'Medium', extra: '负责人: Lumina Team · 截止: 2026-03-10 · 预计 5 天' },
    { id: 'j4', title: 'WIDGET-088 · L3 通知降级逻辑重构', subtitle: '专注模式下 L3→L2 降级链路优化', source: 'jira', badge: 'Low', extra: '负责人: Alice · 截止: 2026-04-01 · 预计 2 天' },
  ],
  email: [
    { id: 'e1', title: 'Re: Q3 产品规划会议纪要', subtitle: '发件人: pm@lumina.io · 3 个附件', source: 'email', badge: '未读', extra: '2026-06-10 14:32 · 含 Q3 Roadmap 草案与竞品分析' },
    { id: 'e2', title: '安全团队: 紧急漏洞修复通知', subtitle: '发件人: security@lumina.io · 高优先级', source: 'email', badge: '紧急', extra: '2026-06-11 09:15 · CVE-2026-XXXX 需 48h 内修复' },
    { id: 'e3', title: 'HR: 年度绩效考核提醒', subtitle: '发件人: hr@lumina.io · 需回复', source: 'email', badge: '待办', extra: '2026-06-08 10:00 · 截止日期 2026-06-20' },
  ],
  document: [
    { id: 'd1', title: 'Lumina Widget 技术设计文档 v2.3', subtitle: '最后编辑: 2026-06-05 · 42 页', source: 'document', badge: 'PDF', extra: '涵盖 Step 1-10 完整架构、WebSocket 协议、通知策略' },
    { id: 'd2', title: 'API 接口规范 - WebSocket 通信协议', subtitle: '最后编辑: 2026-05-28 · 18 页', source: 'document', badge: 'MD', extra: '消息格式、心跳机制、断线重连策略、错误码表' },
    { id: 'd3', title: '用户体验研究报告 Q2', subtitle: '最后编辑: 2026-06-01 · 35 页', source: 'document', badge: 'PPT', extra: 'Widget 折叠态使用率 +12%，Escalation 率降至 4.2%' },
  ],
  code: [
    { id: 'c1', title: 'src/pipelines/agent_orchestrator.rs', subtitle: 'Rust · 最后提交: 2 天前 · 284 行', source: 'code', badge: 'Rust', extra: '评估 Escalation 启发式规则、上下文传递、决策路由' },
    { id: 'c2', title: 'src/widget/notification_manager.ts', subtitle: 'TypeScript · 最后提交: 5 天前 · 196 行', source: 'code', badge: 'TS', extra: 'L1/L2/L3 三级通知分发、冷却期管理、专注模式降级' },
    { id: 'c3', title: 'src/ui/components/SpotlightSearch.tsx', subtitle: 'React · 最后提交: 1 天前 · 152 行', source: 'code', badge: 'React', extra: '搜索输入、结果筛选、预览面板、键盘导航、AI 摘要' },
  ],
};

// ── Mock Context Suggestions ───────────────
const CONTEXT_SUGGESTIONS = [
  { id: 'cs1', icon: 'fa-regular fa-clock', title: '继续当前执行计划', subtitle: '有 3 个步骤待完成', action: 'continue_plan' },
  { id: 'cs2', icon: 'fa-regular fa-note-sticky', title: '跟进会议笔记', subtitle: 'Q3 产品规划会议待总结', action: 'follow_up_notes' },
  { id: 'cs3', icon: 'fa-regular fa-envelope', title: '查看未读紧急邮件', subtitle: '2 封高优先级未读', action: 'view_urgent_email' },
  { id: 'cs4', icon: 'fa-brands fa-jira', title: '检查 Jira 工单更新', subtitle: 'WIDGET-234 状态已变更', action: 'check_jira' },
];

// ── Mock Action Suggestions (by input context) ──
const ACTION_SUGGESTION_MAP = {
  'report': [
    { id: 'as1', icon: 'fa-solid fa-file-pen', title: '用 AI 起草季度报告', subtitle: '基于现有数据生成', action: 'draft_report' },
    { id: 'as2', icon: 'fa-solid fa-diagram-project', title: '创建执行计划', subtitle: '拆解为可执行步骤', action: 'create_plan' },
    { id: 'as3', icon: 'fa-solid fa-copy', title: '汇总相关文档', subtitle: '搜索并总结关联文档', action: 'summarize_docs' },
  ],
  'plan': [
    { id: 'as1', icon: 'fa-solid fa-diagram-project', title: '创建执行计划', subtitle: '拆解为可执行步骤', action: 'create_plan' },
    { id: 'as2', icon: 'fa-solid fa-list-check', title: '查看已有计划', subtitle: '浏览所有执行计划', action: 'view_plans' },
  ],
  'email': [
    { id: 'as1', icon: 'fa-solid fa-reply', title: '起草回复', subtitle: '基于上下文生成回复草稿', action: 'draft_reply' },
    { id: 'as2', icon: 'fa-solid fa-file-export', title: '总结邮件线索', subtitle: '提取关键决策点', action: 'summarize_thread' },
  ],
  'default': [
    { id: 'as1', icon: 'fa-solid fa-wand-magic-sparkles', title: 'AI 摘要', subtitle: '智能分析并总结结果', action: 'ai_summary' },
    { id: 'as2', icon: 'fa-solid fa-diagram-project', title: '创建执行计划', subtitle: '拆解为可执行步骤', action: 'create_plan' },
  ],
};

// ── Mock Execution Plans ───────────────────
let MOCK_ACTIVE_PLANS = [
  {
    id: 'plan_1',
    title: '完成 Widget 通知系统重构',
    createdAt: Date.now() - 1800000,
    steps: [
      { id: 'ps1', title: '创建 Jira 工单', system: 'Jira', executionType: 'auto', estimatedDuration: '2m', dependency: [], status: 'done' },
      { id: 'ps2', title: '起草技术方案', system: 'Docs', executionType: 'auto', estimatedDuration: '5m', dependency: ['ps1'], status: 'done' },
      { id: 'ps3', title: '选定架构方案', system: 'Lumina', executionType: 'confirm', estimatedDuration: '3m', dependency: ['ps2'], status: 'running' },
      { id: 'ps4', title: '开发实现', system: 'VS Code', executionType: 'navigation', estimatedDuration: '2h', dependency: ['ps3'], status: 'pending' },
      { id: 'ps5', title: '创建 PR', system: 'GitHub', executionType: 'auto', estimatedDuration: '3m', dependency: ['ps4'], status: 'pending' },
      { id: 'ps6', title: '代码审查', system: 'GitHub', executionType: 'confirm', estimatedDuration: '1h', dependency: ['ps5'], status: 'pending' },
      { id: 'ps7', title: '生产发布', system: 'CI/CD', executionType: 'escalation', estimatedDuration: '10m', dependency: ['ps6'], status: 'pending' },
    ]
  },
  {
    id: 'plan_2',
    title: 'Q3 竞品分析报告',
    createdAt: Date.now() - 5400000,
    steps: [
      { id: 'q1', title: '收集竞品资料', system: 'Web', executionType: 'auto', estimatedDuration: '10m', dependency: [], status: 'done' },
      { id: 'q2', title: 'AI 汇总关键功能差异', system: 'Lumina', executionType: 'auto', estimatedDuration: '5m', dependency: ['q1'], status: 'done' },
      { id: 'q3', title: '起草分析报告草稿', system: 'Docs', executionType: 'auto', estimatedDuration: '8m', dependency: ['q2'], status: 'done' },
      { id: 'q4', title: '人工审核与补充', system: 'Lumina', executionType: 'confirm', estimatedDuration: '15m', dependency: ['q3'], status: 'waiting' },
      { id: 'q5', title: '发送给 PM 团队', system: 'Email', executionType: 'confirm', estimatedDuration: '2m', dependency: ['q4'], status: 'pending' },
    ]
  },
  {
    id: 'plan_3',
    title: '修复 CVE-2026 安全漏洞',
    createdAt: Date.now() - 900000,
    steps: [
      { id: 'v1', title: '漏洞影响范围评估', system: 'Lumina', executionType: 'auto', estimatedDuration: '3m', dependency: [], status: 'running' },
      { id: 'v2', title: '编写修复补丁', system: 'VS Code', executionType: 'navigation', estimatedDuration: '1h', dependency: ['v1'], status: 'pending' },
      { id: 'v3', title: '安全测试验证', system: 'CI/CD', executionType: 'confirm', estimatedDuration: '20m', dependency: ['v2'], status: 'pending' },
      { id: 'v4', title: '生产热修复部署', system: 'CI/CD', executionType: 'escalation', estimatedDuration: '10m', dependency: ['v3'], status: 'pending' },
    ]
  }
];

const SOURCE_ICONS = {
  jira:     { icon: 'fa-brands fa-jira', cls: 'jira' },
  email:    { icon: 'fa-solid fa-envelope', cls: 'email' },
  document: { icon: 'fa-solid fa-file-lines', cls: 'document' },
  code:     { icon: 'fa-solid fa-code', cls: 'code' },
};

const SOURCE_LABELS = {
  jira: 'Jira',
  email: 'Email',
  document: 'Document',
  code: 'Code',
};

// ── State ──────────────────────────────────
let S = {
  // SpotlightState
  isOpen: false,
  query: '',
  activeTab: 'all',
  mode: 'suggestions', // suggestions | search | plan_preview | ai_summary
  selectedIndex: -1,
  
  // Derived
  filteredItems: [],
  previewId: null,
  showAIDrawer: false,
  
  // DOM refs
  overlayEl: null,
  containerEl: null,
  
  // Plan state
  planPreviewSteps: null,
  planPreviewTitle: '',
  isPlanConfirmed: false,
  selectedPlanId: null,       // 当前在 plan_preview 中查看/编辑的 plan id (null = 新建)
  plansListExpanded: false,   // 多项目列表是否全部展开
  
  // Connection status
  isOnline: true,
};

// ── Public API ─────────────────────────────

function openSpotlight() {
  if (S.overlayEl) return; // already open

  buildDOM();
  bindEvents();
  applyFilterAndRender();

  // GSAP animate in
  requestAnimationFrame(() => {
    S.overlayEl.classList.add('active');
  });

  // Auto-focus input
  setTimeout(() => {
    const input = document.getElementById('spotlight-search-input');
    if (input) input.focus();
  }, 120);
}

function closeSpotlight() {
  if (!S.overlayEl) return;
  S.overlayEl.classList.remove('active');
  setTimeout(() => { destroyDOM(); }, 200);
}

function continueInWidget() {
  const item = S.filteredItems.find(i => i.id === S.previewId) || S.filteredItems[S.selectedIndex] || S.filteredItems[0];
  const title = item ? item.title : 'WIDGET-234 搜索功能需求';
  closeSpotlight();
  if (typeof expandWidget === 'function') { expandWidget(); }
  setTimeout(() => {
    if (typeof addBubble === 'function') {
      addBubble('user', '请分析 ' + title.replace(/ · .*/, ''));
    }
    setTimeout(() => {
      if (typeof addBubble === 'function') {
        const html = `
          <div class="flex flex-col gap-2">
            <div class="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i> AI 分析完成
            </div>
            <div class="text-[11px] text-slate-300 leading-relaxed">
              根据搜索结果，<strong class="text-slate-100">${escapeHtml(title)}</strong> 是一项${item && item.source === 'jira' ? ' Jira 工单' : '待处理事项'}。${getAIAnalysisSnippet(item)}
            </div>
            <div class="flex gap-2 mt-1">
              <button onclick="triggerEscalation('navigation', 'spotlight_continue')" class="flex-1 text-center bg-brand-500 hover:bg-brand-600 transition-all font-semibold rounded px-2.5 py-1 text-[10px] text-white">在主应用中打开</button>
            </div>
          </div>`;
        addBubble('agent-system', html, true);
      }
      if (typeof scrollToContentBottom === 'function') scrollToContentBottom();
    }, 500);
  }, 350);
}

// ── DOM Build ──────────────────────────────

function buildDOM() {
  const overlay = document.createElement('div');
  overlay.id = 'spotlight-overlay';
  overlay.innerHTML = buildInnerHTML();
  document.body.appendChild(overlay);
  S.overlayEl = overlay;
  S.containerEl = overlay.querySelector('#spotlight-container');
}

function buildInnerHTML() {
  return /* html */`
    <div id="spotlight-container" onclick="event.stopPropagation()">
      <!-- Input Area -->
      <div id="spotlight-input-area">
        <div id="spotlight-search-bar">
          <div id="spotlight-search-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <input
            id="spotlight-search-input"
            type="text"
            placeholder="搜索文件、执行操作、创建计划…"
            autocomplete="off"
            spellcheck="false"
          />
          <button id="spotlight-search-clear" title="清除">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <!-- Source Tabs -->
        <div id="spotlight-source-tabs">${buildSourceTabs()}</div>
      </div>

      <!-- Content Area -->
      <div id="spotlight-content-area">
        <!-- Context Suggestions (mode: suggestions, empty query) -->
        <div id="spotlight-context-suggestions" class="spotlight-content-section"></div>
        
        <!-- Active Execution Plan Entry (always shown if plans exist) -->
        <div id="spotlight-active-plan-entry" class="spotlight-content-section"></div>
        
        <!-- Action Suggestions (mode: search, has query) -->
        <div id="spotlight-action-suggestions" class="spotlight-content-section"></div>
        
        <!-- Preview Panel (slide-in from right) -->
        <div id="spotlight-preview">
          <div id="spotlight-preview-header">
            <span id="spotlight-preview-title"></span>
            <button id="spotlight-preview-close" title="关闭预览"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="spotlight-preview-body"></div>
        </div>

        <!-- Search Results -->
        <div id="spotlight-results-area" class="spotlight-content-section"></div>

        <!-- No Results -->
        <div id="spotlight-no-results">
          <div class="icon"><i class="fa-solid fa-magnifying-glass"></i></div>
          <div class="title">未找到结果</div>
          <div class="subtitle">尝试更换关键词或使用执行计划</div>
        </div>
      </div>

      <!-- Plan Preview Mode (overlay within spotlight) -->
      <div id="spotlight-plan-preview" class="hidden">
        <div id="spotlight-plan-preview-header">
          <div id="spotlight-plan-preview-title">创建执行计划</div>
          <button id="spotlight-plan-preview-back" title="返回"><i class="fa-solid fa-arrow-left"></i></button>
        </div>
        <div id="spotlight-plan-preview-body">
          <div id="spotlight-plan-preview-input-area">
            <input id="spotlight-plan-title-input" type="text" placeholder="描述计划目标，例如：完成此功能开发" />
            <button id="spotlight-plan-generate-btn">生成计划</button>
          </div>
          <div id="spotlight-plan-steps-container"></div>
        </div>
        <div id="spotlight-plan-preview-footer">
          <span id="spotlight-plan-step-count">0 个步骤</span>
          <button id="spotlight-plan-confirm-btn" class="hidden">确认并执行</button>
        </div>
      </div>

      <!-- AI Summary Panel -->
      <div id="spotlight-ai-summary-panel" class="hidden">
        <div id="spotlight-ai-summary-header">
          <span id="spotlight-ai-summary-label"><i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能摘要</span>
          <button id="spotlight-ai-summary-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div id="spotlight-ai-summary-body">
          <div id="spotlight-ai-summary-sources" class="spotlight-ai-section">
            <div class="spotlight-ai-section-label">📚 引用来源</div>
            <div class="spotlight-ai-section-content" id="spotlight-ai-sources-content"></div>
          </div>
          <div id="spotlight-ai-summary-content" class="spotlight-ai-section">
            <div class="spotlight-ai-section-label">📝 摘要</div>
            <div class="spotlight-ai-section-content" id="spotlight-ai-summary-text">
              <div class="spotlight-streaming-skeleton">
                <span class="typing-dot">.</span><span class="typing-dot">.</span><span class="typing-dot">.</span>
              </div>
            </div>
          </div>
          <div id="spotlight-ai-summary-actions" class="spotlight-ai-section">
            <div class="spotlight-ai-section-label">⚡ 后续操作</div>
            <div class="spotlight-ai-actions-list" id="spotlight-ai-actions-list">
              <button class="spotlight-ai-action-btn" onclick="continueInWidget()">
                <i class="fa-solid fa-comment-dots"></i> 在 Widget 中询问
              </button>
              <button class="spotlight-ai-action-btn" onclick="navigator.clipboard.writeText(document.getElementById('spotlight-ai-summary-text').innerText);showSandboxToast('已复制到剪贴板')">
                <i class="fa-solid fa-copy"></i> 复制
              </button>
              <button class="spotlight-ai-action-btn" onclick="triggerEscalation('navigation','spotlight_ai_source')">
                <i class="fa-solid fa-external-link-alt"></i> 打开来源
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div id="spotlight-footer">
        <div id="spotlight-footer-left">
          <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
          <span><kbd>Enter</kbd> 选择</span>
          <span><kbd>Tab</kbd> 切换来源</span>
        </div>
        <div id="spotlight-footer-right">
          <span class="spotlight-footer-hint"><kbd>⌘P</kbd> 执行计划</span>
          <span class="spotlight-footer-hint"><kbd>⌘↩</kbd> AI 摘要</span>
          <span id="spotlight-connection-status" class="spotlight-connection-online">
            <span class="status-dot"></span> 已连接
          </span>
        </div>
      </div>
    </div>
  `;
}

function buildSourceTabs() {
  const all = getAllItems();
  const counts = {
    all: all.length,
    jira: all.filter(i => i.source === 'jira').length,
    email: all.filter(i => i.source === 'email').length,
    document: all.filter(i => i.source === 'document').length,
    code: all.filter(i => i.source === 'code').length,
  };
  const keys = ['all', 'jira', 'email', 'document', 'code'];
  const labels = { all: '全部', jira: 'Jira', email: '邮件', document: '文档', code: '代码' };
  const icons = { all: 'fa-solid fa-layer-group', jira: 'fa-brands fa-jira', email: 'fa-solid fa-envelope', document: 'fa-solid fa-file-lines', code: 'fa-solid fa-code' };
  return keys.map(k => {
    const active = S.activeTab === k ? ' active' : '';
    return `<button class="spotlight-source-tab${active}" data-tab="${k}">
      <i class="${icons[k]}"></i>
      <span>${labels[k]}</span>
      <span class="spotlight-tab-count">${counts[k]}</span>
    </button>`;
  }).join('');
}

function destroyDOM() {
  if (S.overlayEl && S.overlayEl.parentNode) {
    S.overlayEl.parentNode.removeChild(S.overlayEl);
  }
  S.overlayEl = null;
  S.containerEl = null;
  S.selectedIndex = -1;
  S.previewId = null;
  S.showAIDrawer = false;
  S.planPreviewSteps = null;
  S.isPlanConfirmed = false;
  S.selectedPlanId = null;
  S.plansListExpanded = false;
  S.mode = 'suggestions';
}

// ── Events ─────────────────────────────────

function bindEvents() {
  // Click overlay backdrop → close
  S.overlayEl.addEventListener('mousedown', (e) => {
    if (e.target === S.overlayEl) closeSpotlight();
  });

  // Search input
  const input = document.getElementById('spotlight-search-input');
  const clearBtn = document.getElementById('spotlight-search-clear');

  input.addEventListener('input', () => {
    S.query = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', S.query.length > 0);
    S.selectedIndex = -1;
    
    if (S.mode === 'plan_preview' || S.mode === 'ai_summary') return;
    
    if (S.query.length === 0) {
      S.mode = 'suggestions';
    } else {
      S.mode = 'search';
    }
    render();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    S.query = '';
    clearBtn.classList.remove('visible');
    S.selectedIndex = -1;
    S.mode = 'suggestions';
    render();
    input.focus();
  });

  // Source tabs (delegate)
  document.getElementById('spotlight-source-tabs').addEventListener('click', (e) => {
    const btn = e.target.closest('.spotlight-source-tab');
    if (!btn) return;
    S.activeTab = btn.dataset.tab;
    S.selectedIndex = -1;
    document.getElementById('spotlight-source-tabs').innerHTML = buildSourceTabs();
    if (S.mode === 'search') renderSearchResults();
  });

  // Context suggestion clicks (delegate)
  document.getElementById('spotlight-context-suggestions').addEventListener('click', (e) => {
    const item = e.target.closest('.spotlight-context-item');
    if (!item) return;
    const action = item.dataset.action;
    handleContextAction(action);
  });

  // Action suggestion clicks (delegate)
  document.getElementById('spotlight-action-suggestions').addEventListener('click', (e) => {
    const item = e.target.closest('.spotlight-action-item');
    if (!item) return;
    const action = item.dataset.action;
    handleActionSuggestion(action);
  });

  // Result item click (delegate)
  document.getElementById('spotlight-results-area').addEventListener('click', (e) => {
    const itemEl = e.target.closest('.spotlight-result-item');
    if (!itemEl) return;
    const idx = parseInt(itemEl.dataset.index, 10);
    selectItem(idx);
    openPreview(S.filteredItems[idx]);
  });

  // Plan preview events
  const planBackBtn = document.getElementById('spotlight-plan-preview-back');
  if (planBackBtn) planBackBtn.addEventListener('click', exitPlanPreview);

  const planGenerateBtn = document.getElementById('spotlight-plan-generate-btn');
  if (planGenerateBtn) planGenerateBtn.addEventListener('click', generatePlanPreview);

  const planTitleInput = document.getElementById('spotlight-plan-title-input');
  if (planTitleInput) {
    planTitleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') generatePlanPreview();
    });
  }

  const planConfirmBtn = document.getElementById('spotlight-plan-confirm-btn');
  if (planConfirmBtn) planConfirmBtn.addEventListener('click', confirmPlan);

  // Plan preview title update from existing plan
  const planTitleInput2 = document.getElementById('spotlight-plan-title-input');
  if (planTitleInput2 && S.selectedPlanId) {
    planTitleInput2.value = S.planPreviewTitle;
  }

  // AI summary events
  document.getElementById('spotlight-ai-summary-close').addEventListener('click', closeAISummary);

  // Active plan entry click (delegate)
  document.getElementById('spotlight-active-plan-entry').addEventListener('click', (e) => {
    const expandBtn = e.target.closest('.spotlight-plan-expand-btn');
    if (expandBtn) {
      const planId = expandBtn.closest('[data-plan-id]')?.dataset.planId;
      openPlanPreview(planId || null);
      return;
    }
    const toggleBtn = e.target.closest('#spotlight-plans-toggle');
    if (toggleBtn) {
      S.plansListExpanded = !S.plansListExpanded;
      renderActivePlanEntry();
    }
  });

  // Keyboard
  document.addEventListener('keydown', onKeyDown, true);
}

function onKeyDown(e) {
  if (!S.overlayEl) return;

  // Cmd/Ctrl + Enter → AI Summary
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    openAISummary();
    return;
  }

  // Cmd/Ctrl + P → Plan Preview
  if ((e.metaKey || e.ctrlKey) && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
    e.stopPropagation();
    if (S.mode === 'plan_preview') {
      exitPlanPreview();
    } else {
      openPlanPreview();
    }
    return;
  }

  // Tab → switch source tabs
  if (e.key === 'Tab' && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    const tabs = ['all', 'jira', 'email', 'document', 'code'];
    const idx = tabs.indexOf(S.activeTab);
    const next = (idx + 1) % tabs.length;
    S.activeTab = tabs[next];
    S.selectedIndex = -1;
    document.getElementById('spotlight-source-tabs').innerHTML = buildSourceTabs();
    if (S.mode === 'search') renderSearchResults();
    return;
  }

  // Cmd/Ctrl + 1~5 → switch source
  if ((e.metaKey || e.ctrlKey) && /^[1-5]$/.test(e.key)) {
    e.preventDefault();
    e.stopPropagation();
    const tabs = ['all', 'jira', 'email', 'document', 'code'];
    const idx = parseInt(e.key) - 1;
    if (idx < tabs.length) {
      S.activeTab = tabs[idx];
      S.selectedIndex = -1;
      document.getElementById('spotlight-source-tabs').innerHTML = buildSourceTabs();
      if (S.mode === 'search') renderSearchResults();
    }
    return;
  }

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (S.mode === 'plan_preview') {
      exitPlanPreview();
    } else if (S.mode === 'ai_summary') {
      closeAISummary();
    } else if (S.previewId) {
      S.previewId = null;
      closePreviewSilent();
      render();
    } else {
      closeSpotlight();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    if (S.mode === 'search' || S.mode === 'suggestions') moveSelection(1);
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    if (S.mode === 'search' || S.mode === 'suggestions') moveSelection(-1);
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (S.mode === 'plan_preview') return;
    if (S.mode === 'ai_summary') return;
    
    if (S.mode === 'suggestions' && S.selectedIndex >= 0) {
      const suggestions = getCurrentContextSuggestions();
      if (S.selectedIndex < suggestions.length) {
        handleContextAction(suggestions[S.selectedIndex].action);
        return;
      }
    }

    if (S.filteredItems.length > 0) {
      const idx = S.selectedIndex >= 0 ? S.selectedIndex : 0;
      selectItem(idx);
      openPreview(S.filteredItems[idx]);
    }
    return;
  }
}

// ── Render Engine ─────────────────────────

function render() {
  if (!S.overlayEl) return;
  
  const input = document.getElementById('spotlight-search-input');
  if (input) input.placeholder = getPlaceholder();
  
  const contentArea = document.getElementById('spotlight-content-area');
  const planPreview = document.getElementById('spotlight-plan-preview');
  const aiSummary = document.getElementById('spotlight-ai-summary-panel');
  const footer = document.getElementById('spotlight-footer');
  
  contentArea.classList.remove('hidden');
  planPreview.classList.add('hidden');
  aiSummary.classList.add('hidden');
  
  if (S.mode === 'plan_preview') {
    contentArea.classList.add('hidden');
    planPreview.classList.remove('hidden');
    footer.classList.add('hidden');
    // 更新 header 标题
    const previewTitle = document.getElementById('spotlight-plan-preview-title');
    if (previewTitle) {
      previewTitle.textContent = S.selectedPlanId ? '查看 / 编辑执行计划' : '创建执行计划';
    }
    // 若已有步骤（查看已有计划），直接渲染步骤列表
    if (S.planPreviewSteps && S.planPreviewSteps.length > 0) {
      renderPlanSteps();
    }
    return;
  }
  
  if (S.mode === 'ai_summary') {
    contentArea.classList.add('hidden');
    aiSummary.classList.remove('hidden');
    return;
  }
  
  footer.classList.remove('hidden');
  
  renderContextSuggestions();
  renderActivePlanEntry();
  
  if (S.mode === 'suggestions') {
    renderActionSuggestions();
    document.getElementById('spotlight-results-area').innerHTML = '';
    document.getElementById('spotlight-no-results').style.display = 'none';
    document.getElementById('spotlight-action-suggestions').classList.remove('hidden');
  } else if (S.mode === 'search') {
    document.getElementById('spotlight-action-suggestions').classList.add('hidden');
    applyFilterAndRender();
  }
}

function getPlaceholder() {
  switch (S.mode) {
    case 'plan_preview': return '描述计划目标…';
    case 'ai_summary': return '';
    default: return '搜索文件、执行操作、创建计划…';
  }
}

// ── Context Suggestions ────────────────────

function getCurrentContextSuggestions() {
  return CONTEXT_SUGGESTIONS;
}

function renderContextSuggestions() {
  const container = document.getElementById('spotlight-context-suggestions');
  if (S.mode !== 'suggestions' || S.query.length > 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  
  const suggestions = getCurrentContextSuggestions();
  let html = `<div class="spotlight-section-label"><i class="fa-regular fa-compass"></i> 上下文建议</div>`;
  suggestions.forEach((s, idx) => {
    const sel = idx === S.selectedIndex ? ' selected' : '';
    html += `
      <div class="spotlight-context-item${sel}" data-action="${s.action}" data-index="${idx}">
        <div class="spotlight-context-icon"><i class="${s.icon}"></i></div>
        <div class="spotlight-context-text">
          <span class="spotlight-context-title">${escapeHtml(s.title)}</span>
          <span class="spotlight-context-subtitle">${escapeHtml(s.subtitle)}</span>
        </div>
        <i class="fa-solid fa-arrow-right spotlight-context-arrow"></i>
      </div>
    `;
  });
  container.innerHTML = html;
}

function handleContextAction(action) {
  switch (action) {
    case 'continue_plan':
      openPlanPreview();
      break;
    case 'follow_up_notes':
      continueInWidgetWithPrompt('请总结 Q3 产品规划会议纪要，提炼关键决策');
      break;
    case 'view_urgent_email':
      S.query = '紧急';
      S.mode = 'search';
      document.getElementById('spotlight-search-input').value = '紧急';
      document.getElementById('spotlight-search-clear').classList.add('visible');
      render();
      break;
    case 'check_jira':
      S.activeTab = 'jira';
      document.getElementById('spotlight-source-tabs').innerHTML = buildSourceTabs();
      S.mode = 'search';
      S.query = '';
      render();
      break;
  }
}

function continueInWidgetWithPrompt(prompt) {
  closeSpotlight();
  if (typeof expandWidget === 'function') expandWidget();
  setTimeout(() => {
    if (typeof addBubble === 'function') addBubble('user', prompt);
    if (typeof scrollToContentBottom === 'function') scrollToContentBottom();
  }, 350);
}

// ── Active Plan Entry ──────────────────────

function renderActivePlanEntry() {
  const container = document.getElementById('spotlight-active-plan-entry');
  if (MOCK_ACTIVE_PLANS.length === 0) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');

  const VISIBLE_DEFAULT = 2;
  const isExpanded = S.plansListExpanded;
  const visiblePlans = isExpanded ? MOCK_ACTIVE_PLANS : MOCK_ACTIVE_PLANS.slice(0, VISIBLE_DEFAULT);
  const hiddenCount = MOCK_ACTIVE_PLANS.length - VISIBLE_DEFAULT;

  function planCardHtml(plan) {
    const total = plan.steps.length;
    const done = plan.steps.filter(s => s.status === 'done').length;
    const pct = Math.round((done / total) * 100);
    const currentStep = plan.steps.find(s => s.status === 'running' || s.status === 'waiting');
    const statusIcon = currentStep?.status === 'waiting'
      ? `<span class="step-indicator waiting"></span>`
      : `<span class="step-indicator running"></span>`;
    return `
      <div class="spotlight-plan-card" data-plan-id="${plan.id}">
        <div class="spotlight-plan-card-header">
          <span class="spotlight-plan-card-title">${escapeHtml(plan.title)}</span>
          <span class="spotlight-plan-card-progress">${done}/${total}</span>
        </div>
        <div class="spotlight-plan-progress-bar">
          <div class="spotlight-plan-progress-fill" style="width:${pct}%"></div>
        </div>
        <div class="spotlight-plan-card-body">
          ${currentStep ? `<span class="spotlight-plan-current-step">${statusIcon} ${currentStep.status === 'waiting' ? '等待:' : '当前:'} ${escapeHtml(currentStep.title)}</span>` : '<span class="spotlight-plan-current-step"><span class="step-indicator" style="background:#10b981"></span> 已完成</span>'}
          <div class="spotlight-plan-steps-mini">
            ${plan.steps.slice(0, 5).map(s => `<span class="spotlight-plan-step-dot ${s.status}"></span>`).join('')}
            ${total > 5 ? `<span class="spotlight-plan-more-steps">+${total - 5}</span>` : ''}
          </div>
        </div>
        <button class="spotlight-plan-expand-btn">
          <i class="fa-solid fa-list-check"></i> 查看步骤
        </button>
      </div>
    `;
  }

  const headerCount = MOCK_ACTIVE_PLANS.length > 1
    ? `<span class="spotlight-plans-count">${MOCK_ACTIVE_PLANS.length}</span>`
    : '';

  const toggleBtn = MOCK_ACTIVE_PLANS.length > VISIBLE_DEFAULT ? `
    <button id="spotlight-plans-toggle" class="spotlight-plans-toggle">
      ${isExpanded
        ? `<i class="fa-solid fa-chevron-up"></i> 收起`
        : `<i class="fa-solid fa-chevron-down"></i> 另有 ${hiddenCount} 个项目`
      }
    </button>
  ` : '';

  container.innerHTML = `
    <div class="spotlight-section-label">
      <i class="fa-solid fa-diagram-project"></i> 活跃执行计划 ${headerCount}
      <button class="spotlight-plans-new-btn" onclick="openPlanPreview(null)">
        <i class="fa-solid fa-plus"></i> 新建
      </button>
    </div>
    <div class="spotlight-plan-cards-list">
      ${visiblePlans.map(planCardHtml).join('')}
    </div>
    ${toggleBtn}
  `;
}

// ── Action Suggestions ─────────────────────

function renderActionSuggestions() {
  const container = document.getElementById('spotlight-action-suggestions');
  if (S.mode !== 'suggestions' || S.query.length > 0) {
    container.classList.add('hidden');
    return;
  }
  container.classList.remove('hidden');
  
  const suggestions = getActionSuggestions();
  let html = `<div class="spotlight-section-label"><i class="fa-solid fa-bolt"></i> 快捷操作</div>`;
  suggestions.forEach((s, idx) => {
    const displayIdx = idx + getCurrentContextSuggestions().length;
    const sel = displayIdx === S.selectedIndex ? ' selected' : '';
    html += `
      <div class="spotlight-action-item${sel}" data-action="${s.action}" data-index="${displayIdx}">
        <div class="spotlight-action-icon"><i class="${s.icon}"></i></div>
        <div class="spotlight-action-text">
          <span class="spotlight-action-title">${escapeHtml(s.title)}</span>
          <span class="spotlight-action-subtitle">${escapeHtml(s.subtitle)}</span>
        </div>
        <span class="spotlight-action-shortcut">
          ${s.action === 'ai_summary' ? '<kbd>⌘↩</kbd>' : ''}
          ${s.action === 'create_plan' ? '<kbd>⌘P</kbd>' : ''}
        </span>
      </div>
    `;
  });
  container.innerHTML = html;
}

function getActionSuggestions() {
  return ACTION_SUGGESTION_MAP.default;
}

function handleActionSuggestion(action) {
  switch (action) {
    case 'ai_summary':
      openAISummary();
      break;
    case 'create_plan':
      openPlanPreview();
      break;
    case 'draft_report':
      continueInWidgetWithPrompt('请帮我用 AI 起草季度报告');
      break;
    case 'summarize_docs':
      continueInWidgetWithPrompt('请汇总并总结所有相关文档的核心内容');
      break;
    case 'view_plans':
      openPlanPreview();
      break;
    case 'draft_reply':
      continueInWidgetWithPrompt('请根据上下文起草一封专业的邮件回复');
      break;
    case 'summarize_thread':
      continueInWidgetWithPrompt('请总结整封邮件线索并提取关键决策点');
      break;
    default:
      continueInWidgetWithPrompt(action);
  }
}

// ── Search & Results ───────────────────────

function getAllItems() {
  return [
    ...SPOTLIGHT_DATA.jira,
    ...SPOTLIGHT_DATA.email,
    ...SPOTLIGHT_DATA.document,
    ...SPOTLIGHT_DATA.code,
  ];
}

function applyFilterAndRender() {
  let items = getAllItems();
  if (S.activeTab !== 'all') {
    items = items.filter(i => i.source === S.activeTab);
  }
  if (S.query) {
    const q = S.query;
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.subtitle.toLowerCase().includes(q) ||
      (i.extra && i.extra.toLowerCase().includes(q))
    );
  }
  S.filteredItems = items;
  renderSearchResults();
}

function renderSearchResults() {
  const area = document.getElementById('spotlight-results-area');
  const noResults = document.getElementById('spotlight-no-results');
  if (S.filteredItems.length === 0 && S.mode === 'search') {
    area.innerHTML = '';
    noResults.style.display = 'flex';
    return;
  }
  if (S.mode !== 'search') {
    area.innerHTML = '';
    noResults.style.display = 'none';
    return;
  }
  noResults.style.display = 'none';
  const groups = {};
  S.filteredItems.forEach((item, idx) => {
    item._displayIndex = idx;
    if (!groups[item.source]) groups[item.source] = [];
    groups[item.source].push(item);
  });
  let html = '';
  const sourceOrder = ['jira', 'email', 'document', 'code'];
  sourceOrder.forEach(src => {
    if (!groups[src]) return;
    html += `<div class="spotlight-group-label">${SOURCE_LABELS[src]}</div>`;
    groups[src].forEach(item => {
      const sel = item._displayIndex === S.selectedIndex ? ' selected' : '';
      const ico = SOURCE_ICONS[item.source];
      html += `
        <div class="spotlight-result-item${sel}" data-index="${item._displayIndex}">
          <div class="spotlight-result-icon ${ico.cls}">
            <i class="${ico.icon}"></i>
          </div>
          <div class="spotlight-result-text">
            <span class="spotlight-result-title">${highlightMatch(item.title)}</span>
            <span class="spotlight-result-subtitle">${highlightMatch(item.subtitle)}</span>
          </div>
          <span class="spotlight-result-badge">${escapeHtml(item.badge)}</span>
        </div>
      `;
    });
  });
  area.innerHTML = html;
}

function highlightMatch(text) {
  if (!S.query) return escapeHtml(text);
  const q = S.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return escapeHtml(text).replace(
    new RegExp(`(${q})`, 'gi'),
    '<mark class="spotlight-highlight">$1</mark>'
  );
}

// ── Selection ──────────────────────────────

function moveSelection(delta) {
  if (S.mode === 'suggestions') {
    const ctxCount = getCurrentContextSuggestions().length;
    const actionCount = getActionSuggestions().length;
    const total = ctxCount + actionCount;
    let next = S.selectedIndex + delta;
    if (next < 0) next = total - 1;
    if (next >= total) next = 0;
    S.selectedIndex = next;
    renderContextSuggestions();
    renderActionSuggestions();
    return;
  }
  if (S.mode === 'search') {
    if (S.filteredItems.length === 0) return;
    let next = S.selectedIndex + delta;
    if (next < 0) next = S.filteredItems.length - 1;
    if (next >= S.filteredItems.length) next = 0;
    selectItem(next);
  }
}

function selectItem(index) {
  S.selectedIndex = index;
  const area = document.getElementById('spotlight-results-area');
  if (!area) return;
  area.querySelectorAll('.spotlight-result-item').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.index, 10) === index);
  });
  const selected = area.querySelector('.spotlight-result-item.selected');
  if (selected) {
    selected.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

// ── Preview ────────────────────────────────

function openPreview(item) {
  if (!item) return;
  S.previewId = item.id;
  const panel = document.getElementById('spotlight-preview');
  const titleEl = document.getElementById('spotlight-preview-title');
  const bodyEl = document.getElementById('spotlight-preview-body');
  if (!panel || !titleEl || !bodyEl) return;
  titleEl.textContent = item.title;
  const srcLabel = SOURCE_LABELS[item.source] || item.source;
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">来源</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="spotlight-result-icon ${SOURCE_ICONS[item.source].cls}" style="width:22px;height:22px;border-radius:5px;font-size:11px;">
            <i class="${SOURCE_ICONS[item.source].icon}"></i>
          </span>
          <span style="font-size:12px;font-weight:600;color:#0f172a;">${escapeHtml(srcLabel)}</span>
          <span class="spotlight-result-badge" style="font-size:10px;">${escapeHtml(item.badge)}</span>
        </div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">详情</div>
        <div style="font-size:12px;color:#334155;line-height:1.6;">${escapeHtml(item.extra || '暂无详细信息')}</div>
      </div>
      <div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">快捷操作</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap;">
          <button onclick="continueInWidget()" style="padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#0f172a;font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;">在 Widget 中打开</button>
          <button onclick="if(typeof triggerEscalation==='function')triggerEscalation('navigation','spotlight_preview')" style="padding:6px 12px;border-radius:6px;border:1px solid #d1d5db;background:#fff;color:#0f172a;font-size:11px;font-weight:500;cursor:pointer;font-family:inherit;">主应用打开</button>
        </div>
      </div>
    </div>
  `;
  panel.classList.add('open');
}

function closePreviewSilent() {
  const panel = document.getElementById('spotlight-preview');
  if (panel) panel.classList.remove('open');
  S.previewId = null;
}

// ── Plan Preview Mode ──────────────────────

function openPlanPreview(planId) {
  const input = document.getElementById('spotlight-search-input');
  if (input) input.value = '';
  S.query = '';
  S.mode = 'plan_preview';
  S.selectedIndex = -1;
  S.isPlanConfirmed = false;
  S.selectedPlanId = planId || null;

  // 如果传入 planId，加载已有计划步骤供查看/编辑
  if (planId) {
    const existing = MOCK_ACTIVE_PLANS.find(p => p.id === planId);
    if (existing) {
      S.planPreviewTitle = existing.title;
      S.planPreviewSteps = existing.steps.map(s => ({ ...s }));
    } else {
      S.planPreviewSteps = null;
    }
  } else {
    S.planPreviewSteps = null;
    S.planPreviewTitle = '';
  }

  render();
  setTimeout(() => {
    if (!planId) {
      const planInput = document.getElementById('spotlight-plan-title-input');
      if (planInput) planInput.focus();
    }
  }, 150);
}

function exitPlanPreview() {
  S.mode = S.query ? 'search' : 'suggestions';
  S.planPreviewSteps = null;
  S.isPlanConfirmed = false;
  render();
}

function generatePlanPreview() {
  const input = document.getElementById('spotlight-plan-title-input');
  const title = input ? input.value.trim() : '';
  S.planPreviewTitle = title || '完成此功能开发';
  
  S.planPreviewSteps = [
    { id: 'g1', title: '创建 Jira 工单', system: 'Jira', executionType: 'auto', estimatedDuration: '2m', dependency: [], status: 'pending' },
    { id: 'g2', title: '起草技术方案', system: 'Docs', executionType: 'auto', estimatedDuration: '5m', dependency: ['g1'], status: 'pending' },
    { id: 'g3', title: '选定架构方案', system: 'Lumina', executionType: 'confirm', estimatedDuration: '3m', dependency: ['g2'], status: 'pending' },
    { id: 'g4', title: '开发实现', system: 'VS Code', executionType: 'navigation', estimatedDuration: '2h', dependency: ['g3'], status: 'pending' },
    { id: 'g5', title: '创建 PR', system: 'GitHub', executionType: 'auto', estimatedDuration: '3m', dependency: ['g4'], status: 'pending' },
    { id: 'g6', title: '代码审查', system: 'GitHub', executionType: 'confirm', estimatedDuration: '1h', dependency: ['g5'], status: 'pending' },
    { id: 'g7', title: '生产发布', system: 'CI/CD', executionType: 'escalation', estimatedDuration: '10m', dependency: ['g6'], status: 'pending' },
  ];
  renderPlanSteps();
}

function renderPlanSteps() {
  const container = document.getElementById('spotlight-plan-steps-container');
  const confirmBtn = document.getElementById('spotlight-plan-confirm-btn');
  const stepCount = document.getElementById('spotlight-plan-step-count');
  
  if (!S.planPreviewSteps || S.planPreviewSteps.length === 0) {
    container.innerHTML = '<div class="spotlight-plan-empty">输入目标后生成执行计划</div>';
    if (confirmBtn) confirmBtn.classList.add('hidden');
    if (stepCount) stepCount.textContent = '0 个步骤';
    return;
  }
  
  let html = `<div class="spotlight-plan-steps-title">${escapeHtml(S.planPreviewTitle)}</div>`;
  html += `<div class="spotlight-plan-steps-list">`;
  
  S.planPreviewSteps.forEach((step, idx) => {
    const execTypeLabel = getExecutionTypeLabel(step.executionType);
    const execTypeIcon = getExecutionTypeIcon(step.executionType);
    html += `
      <div class="spotlight-plan-step" data-step-id="${step.id}">
        <div class="spotlight-plan-step-drag"><i class="fa-solid fa-grip-lines"></i></div>
        <div class="spotlight-plan-step-indicator">
          <span class="spotlight-plan-step-num">${idx + 1}</span>
        </div>
        <div class="spotlight-plan-step-content">
          <div class="spotlight-plan-step-title">
            <input type="text" value="${escapeHtml(step.title)}" data-field="title" />
          </div>
          <div class="spotlight-plan-step-meta">
            <span class="spotlight-plan-step-system"><i class="fa-solid fa-cube"></i> ${escapeHtml(step.system)}</span>
            <span class="spotlight-plan-step-type ${step.executionType}"><i class="${execTypeIcon}"></i> ${execTypeLabel}</span>
            <span class="spotlight-plan-step-duration"><i class="fa-regular fa-clock"></i> ${escapeHtml(step.estimatedDuration)}</span>
          </div>
          ${step.executionType === 'escalation' ? '<div class="spotlight-plan-step-warning"><i class="fa-solid fa-triangle-exclamation"></i> 需要主应用操作</div>' : ''}
        </div>
        <div class="spotlight-plan-step-actions">
          <button class="spotlight-plan-step-delete" data-step-idx="${idx}" title="删除步骤"><i class="fa-solid fa-xmark"></i></button>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  html += `<button class="spotlight-plan-add-step"><i class="fa-solid fa-plus"></i> 添加步骤</button>`;
  container.innerHTML = html;
  if (stepCount) stepCount.textContent = `${S.planPreviewSteps.length} 个步骤`;
  if (confirmBtn) {
    confirmBtn.classList.remove('hidden');
    confirmBtn.textContent = S.selectedPlanId ? '保存更新' : '确认并执行';
  }
  
  container.querySelectorAll('.spotlight-plan-step-delete').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const idx = parseInt(btn.dataset.stepIdx, 10);
      deletePlanStep(idx);
    });
  });
  container.querySelectorAll('.spotlight-plan-step-title input').forEach(input => {
    input.addEventListener('change', (e) => {
      const stepEl = input.closest('.spotlight-plan-step');
      const stepId = stepEl.dataset.stepId;
      const step = S.planPreviewSteps.find(s => s.id === stepId);
      if (step) step.title = input.value;
    });
  });
  const addBtn = container.querySelector('.spotlight-plan-add-step');
  if (addBtn) addBtn.addEventListener('click', addPlanStep);
}

function getExecutionTypeLabel(type) {
  switch (type) {
    case 'auto': return '自动执行';
    case 'confirm': return '需确认';
    case 'navigation': return '跳转执行';
    case 'escalation': return '需主应用';
    default: return type;
  }
}

function getExecutionTypeIcon(type) {
  switch (type) {
    case 'auto': return 'fa-solid fa-robot';
    case 'confirm': return 'fa-solid fa-circle-check';
    case 'navigation': return 'fa-solid fa-arrow-up-right-from-square';
    case 'escalation': return 'fa-solid fa-triangle-exclamation';
    default: return 'fa-solid fa-circle';
  }
}

function deletePlanStep(idx) {
  if (!S.planPreviewSteps) return;
  S.planPreviewSteps.splice(idx, 1);
  renderPlanSteps();
}

function addPlanStep() {
  if (!S.planPreviewSteps) S.planPreviewSteps = [];
  const newId = 'g' + Date.now();
  S.planPreviewSteps.push({
    id: newId,
    title: '新步骤',
    system: 'Lumina',
    executionType: 'auto',
    estimatedDuration: '5m',
    dependency: [],
    status: 'pending'
  });
  renderPlanSteps();
}

function confirmPlan() {
  if (!S.planPreviewSteps || S.planPreviewSteps.length === 0) return;
  const isEditing = !!S.selectedPlanId;
  if (isEditing) {
    // 更新已有计划步骤
    const idx = MOCK_ACTIVE_PLANS.findIndex(p => p.id === S.selectedPlanId);
    if (idx >= 0) {
      MOCK_ACTIVE_PLANS[idx].steps = S.planPreviewSteps.map(s => ({ ...s }));
      MOCK_ACTIVE_PLANS[idx].title = S.planPreviewTitle || MOCK_ACTIVE_PLANS[idx].title;
    }
  } else {
    // 新建计划
    const newPlan = {
      id: 'plan_' + Date.now(),
      title: S.planPreviewTitle || '执行计划',
      createdAt: Date.now(),
      steps: S.planPreviewSteps.map(s => ({ ...s, status: 'pending' })),
    };
    newPlan.steps[0].status = 'ready';
    MOCK_ACTIVE_PLANS.unshift(newPlan);
  }
  S.planPreviewSteps = null;
  S.isPlanConfirmed = true;
  S.selectedPlanId = null;
  if (typeof showSandboxToast === 'function') {
    showSandboxToast(isEditing ? '✅ 执行计划已更新' : '✅ 执行计划已创建');
  }
  S.mode = 'suggestions';
  render();
}

// ── AI Summary Panel ───────────────────────

function openAISummary() {
  S.mode = 'ai_summary';
  render();
  
  const sourcesContent = document.getElementById('spotlight-ai-sources-content');
  const summaryText = document.getElementById('spotlight-ai-summary-text');
  
  if (sourcesContent) {
    const items = S.filteredItems.length > 0 ? S.filteredItems.slice(0, 4) : getAllItems().slice(0, 4);
    sourcesContent.innerHTML = items.map(item => `
      <div class="spotlight-ai-source-item">
        <span class="spotlight-result-icon ${SOURCE_ICONS[item.source].cls}" style="width:18px;height:18px;border-radius:4px;font-size:9px;display:inline-flex;align-items:center;justify-content:center;">
          <i class="${SOURCE_ICONS[item.source].icon}"></i>
        </span>
        <span>${escapeHtml(item.title)}</span>
      </div>
    `).join('');
  }
  
  if (summaryText) {
    const fullSummary = generateAISummary();
    let idx = 0;
    summaryText.innerHTML = '';
    const streamInterval = setInterval(() => {
      if (idx < fullSummary.length) {
        summaryText.innerHTML += fullSummary[idx];
        idx++;
        const panel = document.getElementById('spotlight-ai-summary-body');
        if (panel) panel.scrollTop = panel.scrollHeight;
      } else {
        clearInterval(streamInterval);
        const items = S.filteredItems.length > 0 ? S.filteredItems : getAllItems();
        summaryText.innerHTML += `
          <div class="spotlight-ai-summary-stats" style="margin-top:12px;padding-top:12px;border-top:1px solid #e5e7eb;">
            <div style="font-size:11px;color:#64748b;">共匹配 <strong style="color:#0f172a;">${items.length}</strong> 条结果</div>
          </div>`;
      }
    }, 30);
  }
}

function generateAISummary() {
  const count = S.filteredItems.length > 0 ? S.filteredItems.length : getAllItems().length;
  const jiraCount = S.filteredItems.filter(i => i.source === 'jira').length;
  const emailCount = S.filteredItems.filter(i => i.source === 'email').length;
  return `根据您的搜索关键词「${escapeHtml(S.query || '全部')}」，以下是智能分析结果：

共匹配 ${count} 条相关信息。其中 Jira 工单 ${jiraCount} 项，邮件 ${emailCount} 封。

关键发现：
• ${jiraCount > 0 ? `有 ${jiraCount} 个 Jira 工单需要关注，建议优先处理高优先级项` : '暂无 Jira 相关结果'}
• ${emailCount > 0 ? `收件箱中有 ${emailCount} 封相关邮件待处理` : '邮件收件箱暂无匹配项'}
• 建议结合执行计划功能，将相关项组织为可追踪的工作流

后续建议：
• 使用执行计划 (⌘P) 将结果组织为可执行步骤
• 在 Widget 中继续深入分析单项内容
• 点击「打开来源」在主应用中查看完整信息`;
}

function closeAISummary() {
  S.mode = S.query ? 'search' : 'suggestions';
  render();
}

// ── Helpers ────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function getAIAnalysisSnippet(item) {
  if (!item) return '建议在完整上下文中进一步分析。';
  if (item.source === 'jira') return `该工单优先级为 ${item.badge}，建议在 Widget 中快速确认任务状态并分配执行人。`;
  if (item.source === 'email') return `该邮件${item.badge === '紧急' ? '属于紧急事项，请优先处理。' : '等待回复，可在此快速起草回信。'}`;
  if (item.source === 'document') return `该文档可在 Widget 中查看摘要，完整内容建议在主应用中打开。`;
  if (item.source === 'code') return `代码片段已完成静态分析，可在 Widget 中查看核心逻辑说明。`;
  return '已为您提取关键信息，可在 Widget 中继续深入分析。';
}
