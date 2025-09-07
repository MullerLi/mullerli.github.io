// assets/js/search-boot.mjs
// ============================================================================
// 組態設定（可依站點內容微調權重與行為）
// ============================================================================
const CONFIG = {
  WEIGHTS: {
    title: 5,          // token 出現在標題
    tags: 4,           // token 出現在標籤
    content: 1,        // token 出現在內文（每次出現的分數）
    phraseTitle: 8,    // 整句片語命中標題
    phraseContent: 2,  // 整句片語命中內文
    customDict: 3,     // token 命中自訂詞庫
  },
  MAX_RESULTS: 30,      // 顯示前 N 筆
  SNIPPET_LENGTH: 280,  // 片段長度
  DEBOUNCE_MS: 250,     // 即時搜尋 debounce
};

// ============================================================================
// 常數與 DOM
// ============================================================================
const BASE_URL = document.querySelector('meta[name="baseurl"]')?.content || '';
const DATA_URL = `${BASE_URL}/assets/js/search-data.json`;
const USER_DICT_URL = `${BASE_URL}/assets/js/jieba.userdict.txt`;

const els = {
  overlay: document.getElementById('search-overlay'),
  input: document.getElementById('search-input'),
  close: document.getElementById('search-close'),
  results: document.getElementById('search-results'),
  panel: document.querySelector('#search-overlay .search-panel'),
};

// ============================================================================
// 小工具
// ============================================================================
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function escapeRegExp(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ============================================================================
// 彈窗
// ============================================================================
function openOverlay() {
  if (!els.overlay) return;
  els.overlay.classList.remove('hidden');
  els.overlay.setAttribute('aria-hidden', 'false');
  if (els.input) {
    els.input.value = '';
    setTimeout(() => els.input.focus(), 0);
  }
  if (els.results) els.results.innerHTML = ''; 
}


function closeOverlay() {
  if (!els.overlay) return;
  els.overlay.classList.add('hidden');
  els.overlay.setAttribute('aria-hidden', 'true');
}

// 啟動鈕：支援 data-search-open 與 .search-toggle
document.querySelectorAll('[data-search-open], .search-toggle')
  .forEach((btn) => btn.addEventListener('click', (e) => {
    e.preventDefault();
    openOverlay();
  }));

// 關閉 / 鍵盤
els.close?.addEventListener('click', closeOverlay);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openOverlay();
  }
});
// 點背景關閉（點 panel 內不關）
els.overlay?.addEventListener('click', (e) => {
  if (e.target === els.overlay) closeOverlay();
});

// ============================================================================
// Jieba & 斷詞（含自訂詞庫）
// ============================================================================
let USER_DICT = new Set();
let tokenizerIndex = fallbackTokens; // 索引用
let tokenizerQuery = fallbackTokens; // 查詢用

async function ensureJiebaReady() {
  const jb = window.jieba;
  if (!jb) return null;

  try {
    if (typeof jb.load === 'function') await jb.load();
  } catch (err) {
    console.warn('[Search] jieba.load() 失敗：', err);
  }

  // 載入自訂詞庫（可選）
  try {
    const res = await fetch(USER_DICT_URL, { cache: 'no-store' });
    if (res.ok) {
      const text = await res.text();
      const lines = text.split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
      USER_DICT = new Set(lines.map((l) => l.split(/\s+/)[0]));

      if (typeof jb.loadUserDict === 'function') {
        await jb.loadUserDict(text);
      } else if (typeof jb.addWord === 'function') {
        for (const line of lines) {
          const [w, freqStr, tag] = line.split(/\s+/);
          jb.addWord(w, Number(freqStr) || 100000, tag || 'n');
        }
      }
    }
  } catch (err) {
    console.warn('[Search] 自訂詞庫載入失敗：', err);
  }

  return jb;
}

// ============================================================================
// 正規化 & CJK n-grams
// ============================================================================
function normalizeZh(s) {
  // NFKC 正規化 + 同義字規整（貯→儲）
  return String(s || '').normalize('NFKC').replace(/貯/g, '儲');
}

function cjkChars(s) {
  return (normalizeZh(s).match(/\p{Script=Han}/gu) || []);
}

function ngrams(chars, n) {
  const out = [];
  for (let i = 0; i <= chars.length - n; i++) {
    out.push(chars.slice(i, i + n).join(''));
  }
  return out;
}

function cjkNgrams(s) {
  const cs = cjkChars(s);
  return [...new Set([...ngrams(cs, 2), ...ngrams(cs, 3)])];
}

function fallbackTokens(text) {
  return normalizeZh(text)
    .toLowerCase()
    .split(/[\s\p{P}\p{Z}、，。；：「」『』（）()［］【】—\-…・・\u3000]+/u)
    .filter(Boolean);
}

// ============================================================================
// 索引
// ============================================================================
let docs = [];
let indexed = [];

function buildIndex(rawDocs) {
  docs = rawDocs.map((d) => ({
    title: normalizeZh(d.title || ''),
    url: d.url || '#',
    content: normalizeZh(d.content || ''),
    tags: Array.isArray(d.tags) ? d.tags.map(normalizeZh) : [],
  }));

  indexed = docs.map((d) => ({
    ref: d,
    tt: new Set(tokenizerIndex(d.title)),
    tg: new Set(tokenizerIndex((d.tags || []).join(' '))),
    ct: tokenizerIndex(d.content),
  }));
}

// ============================================================================
// 打分
// ============================================================================
function containsCount(text, term) {
  if (!text || !term) return 0;
  const t = String(text), q = String(term);
  let i = 0, cnt = 0, from = 0;
  while ((i = t.indexOf(q, from)) !== -1) { cnt++; from = i + q.length; }
  return cnt;
}

function scoreOne(d, qTokens, qRaw) {
  const W = CONFIG.WEIGHTS;
  let score = 0;

  // 片語（連續字）加權
  if (qRaw && qRaw.length >= 2) {
    score += containsCount(d.ref.title, qRaw) * W.phraseTitle;
    score += containsCount(d.ref.content, qRaw) * W.phraseContent;
  }

  // token 加權
  for (const t of qTokens) {
    if (d.tt.has(t)) score += W.title;
    if (d.tg.has(t)) score += W.tags;

    // 內文最多加 3 次，避免長文偏置
    let c = 0;
    for (const w of d.ct) { if (w === t) { c++; if (c >= 3) break; } }
    score += c * W.content;

    if (USER_DICT.has(t)) score += W.customDict;
  }
  return score;
}

// ============================================================================
// 呈現
// ============================================================================
function highlight(text, tokens) {
  if (!tokens?.length) return escapeHTML(text);
  const safeText = escapeHTML(text);
  const uniq = Array.from(new Set(tokens)).sort((a, b) => b.length - a.length);

  let out = safeText;
  for (const t of uniq) {
    // 注意：對 token 做 RegExp 跳脫（不是 HTML 跳脫）
    const re = new RegExp(escapeRegExp(t), 'giu');
    out = out.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return out;
}

function renderResults(q, results, message) {
  if (!els.results) return;

  if (message) {
    els.results.innerHTML = `<div class="search-item search-item--message">${escapeHTML(message)}</div>`;
    return;
  }

  if (!results.length) {
    els.results.innerHTML = `<div class="search-item search-item--message">找不到符合「${escapeHTML(q)}」的內容。</div>`;
    return;
  }

  const html = results.map((r) => {
    const { title, url, content } = r.ref;
    const snippet = String(content).slice(0, CONFIG.SNIPPET_LENGTH);
    return `
      <a class="search-item" href="${url}">
        <div class="search-title">${highlight(title || url, r.qTokens)}</div>
        <div class="search-snippet">${highlight(snippet, r.qTokens)}</div>
      </a>`;
  }).join('');

  els.results.innerHTML = html;
}

// ============================================================================
// 搜尋流程
// ============================================================================
function doSearch(qRaw) {
  const q = normalizeZh(qRaw).trim();

  if (!q) { 
    if (els.results) els.results.innerHTML = '';
    return;
  }

    const qTokens = tokenizerQuery(q).filter(Boolean);
  if (!qTokens.length) {
    // 有輸入但分詞結果為空：顯示「找不到」即可
    renderResults(q, [], `找不到符合「${escapeHTML(q)}」的內容。`);
    return;
  }

    const scored = indexed
    .map(d => ({ ref: d.ref, score: scoreOne(d, qTokens, q), qTokens }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONFIG.MAX_RESULTS);

  renderResults(q, scored);
}

// ============================================================================
// 初始化
// ============================================================================
async function init() {
  const jb = await ensureJiebaReady();

  if (jb && typeof jb.cutForSearch === 'function') {
    console.log('[Search] 使用 jieba + CJK n-grams');
    tokenizerIndex = (txt) => jb.cutForSearch(normalizeZh(txt)).map((s) => s.trim()).filter(Boolean);
    tokenizerQuery = (txt) => {
      const baseTokens = tokenizerIndex(txt);
      const ngramsTokens = cjkNgrams(txt);
      return [...new Set([...baseTokens, ...ngramsTokens])];
    };
  } else {
    console.log('[Search] 找不到 jieba，改用 CJK n-grams + fallback');
    tokenizerIndex = (txt) => {
      const grams = cjkNgrams(txt);
      const ascii = fallbackTokens(txt);
      return grams.length ? [...new Set([...grams, ...ascii])] : ascii;
    };
    tokenizerQuery = tokenizerIndex;
  }

  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch ${DATA_URL} ${res.status}`);
    const data = await res.json();
    buildIndex(data);
    console.log(`[Search] 索引建立完成，文件數：${docs.length}`);
  } catch (err) {
    console.error('[Search] 無法載入或解析 search-data.json：', err);
    renderResults('', [], '錯誤：無法載入搜尋資料。');
  }
}

function bindEvents() {
  // 即時搜尋（debounce）
  const debouncedSearch = debounce(doSearch, CONFIG.DEBOUNCE_MS);
  els.input?.addEventListener('input', (e) => debouncedSearch(e.target.value));

  // Enter 立即搜尋
  els.input?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') doSearch(els.input.value);
  });
}

// 啟動
init();
bindEvents();