/* ========================================== */
/* Spotlight Search – Standalone Module        */
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

// ── Internal State ─────────────────────────
let S = {
  activeFilter: 'all',
  query: '',
  selectedIndex: -1,
  filteredItems: [],
  previewId: null,
  showAIDrawer: false,
  overlayEl: null,
  containerEl: null,
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
  setTimeout(() => {
    destroyDOM();
  }, 200);
}

function continueInWidget() {
  const item = S.filteredItems.find(i => i.id === S.previewId) || S.filteredItems[S.selectedIndex] || S.filteredItems[0];
  const title = item ? item.title : 'WIDGET-234 搜索功能需求';

  closeSpotlight();

  // Expand widget
  if (typeof expandWidget === 'function') {
    expandWidget();
  }

  // Insert conversation message after widget expands
  setTimeout(() => {
    // User message
    if (typeof addBubble === 'function') {
      addBubble('user', '请分析 ' + title.replace(/ · .*/, ''));
    }

    // Mock AI response
    setTimeout(() => {
      if (typeof addBubble === 'function') {
        const html = `
          <div class="flex flex-col gap-2">
            <div class="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
              <i class="fa-solid fa-circle-check"></i>
              AI 分析完成
            </div>
            <div class="text-[11px] text-slate-300 leading-relaxed">
              根据搜索结果，<strong class="text-slate-100">${escapeHtml(title)}</strong> 是一项${item && item.source === 'jira' ? ' Jira 工单' : '待处理事项'}。${getAIAnalysisSnippet(item)}
            </div>
            <div class="flex gap-2 mt-1">
              <button onclick="triggerEscalation('navigation', 'spotlight_continue')" class="flex-1 text-center bg-brand-500 hover:bg-brand-600 transition-all font-semibold rounded px-2.5 py-1 text-[10px] text-white">
                在主应用中打开
              </button>
            </div>
          </div>
        `;
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
      <!-- Search Bar -->
      <div id="spotlight-search-bar">
        <div id="spotlight-search-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <input
          id="spotlight-search-input"
          type="text"
          placeholder="搜索 Jira、邮件、文档、代码…"
          autocomplete="off"
          spellcheck="false"
        />
        <button id="spotlight-search-clear" title="清除">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>

      <!-- Filters -->
      <div id="spotlight-filters">
        ${buildFilterButtons()}
      </div>

      <!-- Body -->
      <div id="spotlight-body">
        <div id="spotlight-results-area"></div>
        <div id="spotlight-preview">
          <div id="spotlight-preview-header">
            <span id="spotlight-preview-title"></span>
            <button id="spotlight-preview-close" title="关闭预览"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div id="spotlight-preview-body"></div>
        </div>
      </div>

      <!-- No Results -->
      <div id="spotlight-no-results">
        <div class="icon"><i class="fa-solid fa-magnifying-glass"></i></div>
        <div class="title">未找到结果</div>
        <div class="subtitle">尝试更换关键词或筛选条件</div>
      </div>

      <!-- AI Summary Trigger -->
      <button id="spotlight-ai-summary-trigger">
        <i class="fa-solid fa-wand-magic-sparkles"></i>
        AI 摘要
      </button>

      <!-- AI Summary Drawer -->
      <div id="spotlight-ai-drawer">
        <div id="spotlight-ai-drawer-inner"></div>
      </div>

      <!-- Footer -->
      <div id="spotlight-footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> 导航</span>
        <span><kbd>Enter</kbd> 打开预览</span>
        <span><kbd>Esc</kbd> 关闭</span>
      </div>
    </div>
  `;
}

function buildFilterButtons() {
  const all = getAllItems();
  const counts = {
    all: all.length,
    jira: all.filter(i => i.source === 'jira').length,
    email: all.filter(i => i.source === 'email').length,
    document: all.filter(i => i.source === 'document').length,
    code: all.filter(i => i.source === 'code').length,
  };
  const keys = ['all', 'jira', 'email', 'document', 'code'];
  const labels = { all: '全部', ...SOURCE_LABELS };
  return keys.map(k => {
    const active = S.activeFilter === k ? ' active' : '';
    return `<button class="spotlight-filter-btn${active}" data-filter="${k}">
      ${labels[k]}<span class="spotlight-filter-count">${counts[k]}</span>
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
  S.query = '';
  S.filteredItems = [];
}

// ── Events ─────────────────────────────────

function bindEvents() {
  // Click overlay backdrop → close
  S.overlayEl.addEventListener('mousedown', (e) => {
    if (e.target === S.overlayEl) {
      closeSpotlight();
    }
  });

  // Search input
  const input = document.getElementById('spotlight-search-input');
  const clearBtn = document.getElementById('spotlight-search-clear');

  input.addEventListener('input', () => {
    S.query = input.value.trim().toLowerCase();
    clearBtn.classList.toggle('visible', S.query.length > 0);
    S.selectedIndex = -1;
    S.previewId = null;
    closePreviewSilent();
    applyFilterAndRender();
  });

  clearBtn.addEventListener('click', () => {
    input.value = '';
    S.query = '';
    clearBtn.classList.remove('visible');
    S.selectedIndex = -1;
    S.previewId = null;
    closePreviewSilent();
    applyFilterAndRender();
    input.focus();
  });

  // Filter buttons (delegate)
  document.getElementById('spotlight-filters').addEventListener('click', (e) => {
    const btn = e.target.closest('.spotlight-filter-btn');
    if (!btn) return;
    S.activeFilter = btn.dataset.filter;
    S.selectedIndex = -1;
    S.previewId = null;
    closePreviewSilent();
    applyFilterAndRender();
    // Refresh filter buttons
    document.getElementById('spotlight-filters').innerHTML = buildFilterButtons();
  });

  // Preview close button
  document.getElementById('spotlight-preview-close').addEventListener('click', () => {
    S.previewId = null;
    closePreviewSilent();
    applyFilterAndRender();
  });

  // AI summary trigger
  document.getElementById('spotlight-ai-summary-trigger').addEventListener('click', () => {
    toggleAIDrawer();
  });

  // Result list click (delegate)
  document.getElementById('spotlight-results-area').addEventListener('click', (e) => {
    const itemEl = e.target.closest('.spotlight-result-item');
    if (!itemEl) return;
    const idx = parseInt(itemEl.dataset.index, 10);
    selectItem(idx);
    openPreview(S.filteredItems[idx]);
  });

  // Keyboard
  document.addEventListener('keydown', onKeyDown, true);
}

function onKeyDown(e) {
  if (!S.overlayEl) return;

  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    if (S.showAIDrawer) {
      closeAIDrawer();
    } else if (S.previewId) {
      S.previewId = null;
      closePreviewSilent();
      applyFilterAndRender();
    } else {
      closeSpotlight();
    }
    return;
  }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    e.stopPropagation();
    moveSelection(1);
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    e.stopPropagation();
    moveSelection(-1);
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    e.stopPropagation();
    if (S.filteredItems.length > 0) {
      const idx = S.selectedIndex >= 0 ? S.selectedIndex : 0;
      selectItem(idx);
      openPreview(S.filteredItems[idx]);
    }
    return;
  }

  // Close on additional Escape-like keys
  if ((e.key === 'k' || e.key === 'K') && (e.ctrlKey || e.metaKey)) {
    e.preventDefault();
    e.stopPropagation();
    closeSpotlight();
    return;
  }
}

// ── Filter & Render ────────────────────────

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

  // Source filter
  if (S.activeFilter !== 'all') {
    items = items.filter(i => i.source === S.activeFilter);
  }

  // Text search
  if (S.query) {
    const q = S.query;
    items = items.filter(i =>
      i.title.toLowerCase().includes(q) ||
      i.subtitle.toLowerCase().includes(q) ||
      (i.extra && i.extra.toLowerCase().includes(q))
    );
  }

  S.filteredItems = items;
  renderResults();
}

function renderResults() {
  const area = document.getElementById('spotlight-results-area');
  const noResults = document.getElementById('spotlight-no-results');

  if (S.filteredItems.length === 0) {
    area.innerHTML = '';
    noResults.style.display = 'flex';
    return;
  }

  noResults.style.display = 'none';

  // Group by source
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
            <i class="fa-solid ${ico.icon}"></i>
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
    '<mark style="background:#fde68a;color:#0f172a;border-radius:2px;padding:0 1px;">$1</mark>'
  );
}

// ── Selection ──────────────────────────────

function moveSelection(delta) {
  if (S.filteredItems.length === 0) return;
  let next = S.selectedIndex + delta;
  if (next < 0) next = S.filteredItems.length - 1;
  if (next >= S.filteredItems.length) next = 0;
  selectItem(next);
}

function selectItem(index) {
  S.selectedIndex = index;
  // Update DOM
  const area = document.getElementById('spotlight-results-area');
  area.querySelectorAll('.spotlight-result-item').forEach(el => {
    el.classList.toggle('selected', parseInt(el.dataset.index, 10) === index);
  });
  // Scroll into view
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

  titleEl.textContent = item.title;
  const srcLabel = SOURCE_LABELS[item.source] || item.source;
  bodyEl.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:12px;">
      <div>
        <div style="font-size:10px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;">来源</div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="spotlight-result-icon ${SOURCE_ICONS[item.source].cls}" style="width:22px;height:22px;border-radius:5px;font-size:11px;">
            <i class="fa-solid ${SOURCE_ICONS[item.source].icon}"></i>
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

// ── AI Summary Drawer ──────────────────────

function toggleAIDrawer() {
  if (S.showAIDrawer) {
    closeAIDrawer();
  } else {
    openAIDrawer();
  }
}

function openAIDrawer() {
  S.showAIDrawer = true;
  const drawer = document.getElementById('spotlight-ai-drawer');
  const inner = document.getElementById('spotlight-ai-drawer-inner');

  const count = S.filteredItems.length;
  const jiraCount = S.filteredItems.filter(i => i.source === 'jira').length;
  const emailCount = S.filteredItems.filter(i => i.source === 'email').length;

  inner.innerHTML = `
    <div id="spotlight-ai-drawer-header">
      <span id="spotlight-ai-drawer-label">
        <i class="fa-solid fa-wand-magic-sparkles"></i> AI 智能摘要
      </span>
      <button id="spotlight-ai-drawer-close" title="关闭"><i class="fa-solid fa-xmark"></i></button>
    </div>
    <div class="spotlight-ai-section">
      <div class="spotlight-ai-section-label">📋 概览</div>
      <div class="spotlight-ai-section-content">
        共匹配 <strong>${count}</strong> 条结果（Jira ${jiraCount} · Email ${emailCount}）。关键词：「${escapeHtml(S.query || '全部')}」。
      </div>
    </div>
    <div class="spotlight-ai-section">
      <div class="spotlight-ai-section-label">🔑 关键发现</div>
      <div class="spotlight-ai-section-content">
        <ul>
          <li>搜索结果中存在 ${jiraCount > 0 ? '<strong>' + jiraCount + ' 个 Jira 工单</strong>需要关注' : '暂无 Jira 相关结果。'}</li>
          <li>${emailCount > 0 ? '有 <strong>' + emailCount + ' 封未读邮件</strong>等待处理。' : '邮件收件箱暂无匹配项。'}</li>
          <li>建议优先处理高优先级工单和安全相关邮件。</li>
        </ul>
      </div>
    </div>
    <div class="spotlight-ai-section">
      <div class="spotlight-ai-section-label">📌 后续操作</div>
      <div class="spotlight-ai-section-content">
        <ul>
          <li>在 Widget 中逐项跟进 Jira 工单进度。</li>
          <li>回复安全团队的紧急通知邮件。</li>
          <li>查看文档以获取完整技术背景。</li>
        </ul>
      </div>
    </div>
    <button id="spotlight-ai-continue-btn" onclick="continueInWidget()">
      <i class="fa-solid fa-arrow-right"></i>
      在 Widget 中继续
    </button>
  `;

  drawer.classList.add('open');

  // Re-bind close button
  document.getElementById('spotlight-ai-drawer-close').addEventListener('click', closeAIDrawer);
}

function closeAIDrawer() {
  S.showAIDrawer = false;
  const drawer = document.getElementById('spotlight-ai-drawer');
  if (drawer) drawer.classList.remove('open');
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
