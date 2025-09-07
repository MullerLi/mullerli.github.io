// assets/js/search-boot.mjs
const base = document.querySelector('meta[name="baseurl"]')?.content || '';
const DATA_URL = `${base}/assets/js/search-data.json`;

const els = {
  overlay: document.getElementById('search-overlay'),
  input: document.getElementById('search-input'),
  close: document.getElementById('search-close'),
  results: document.getElementById('search-results'),
};

function openOverlay() {
  els.overlay.classList.remove('hidden');
  els.overlay.setAttribute('aria-hidden', 'false');
  els.input.value = '';
  els.results.innerHTML = '';
  setTimeout(() => els.input.focus(), 0);
}
function closeOverlay() {
  els.overlay.classList.add('hidden');
  els.overlay.setAttribute('aria-hidden', 'true');
}

els.close?.addEventListener('click', closeOverlay);
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
  // 快捷鍵 Ctrl+K 開啟
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    openOverlay();
  }
});

// 若頁面原本有「放大鏡」或「搜尋」按鈕，可加上 data-search-open 屬性讓它打開面板
document.querySelectorAll('[data-search-open]').forEach(btn => {
  btn.addEventListener('click', (e) => { e.preventDefault(); openOverlay(); });
});

async function ensureJiebaReady() {
  const jb = window.jieba;
  if (!jb) return null;
  if (typeof jb.load === 'function') {
    try { await jb.load(); } catch (e) { /* 忽略失敗，改用 fallback */ }
  }
  return jb;
}

function fallbackTokens(text) {
  return String(text || '')
    .toLowerCase()
    .normalize('NFKC')
    .split(/[\s\p{P}\p{Z}、，。；：「」『』（）()［］【】—\-…・・\u3000]+/u)
    .filter(Boolean);
}

let tokenizer = fallbackTokens;

let docs = [];
let indexed = []; // 內部帶有預先token的 cache

function buildIndex(rawDocs) {
  docs = rawDocs.map(d => ({
    title: d.title || '',
    url: d.url || '#',
    content: d.content || '',
    tags: Array.isArray(d.tags) ? d.tags : [],
  }));
  indexed = docs.map(d => ({
    ref: d,
    tt: new Set(tokenizer(d.title)),
    tg: new Set(tokenizer((d.tags || []).join(' '))),
    ct: tokenizer(d.content),
  }));
}

function scoreOne(d, qTokens) {
  // 權重：標題 4x、標籤 3x、內文次數上限 3
  let s = 0;
  for (const t of qTokens) {
    if (d.tt.has(t)) s += 4;
    if (d.tg.has(t)) s += 3;
    // 計算內文出現次數但不超過3
    let cnt = 0;
    for (const w of d.ct) { if (w === t) { cnt++; if (cnt >= 3) break; } }
    s += cnt;
  }
  return s;
}

function highlight(text, tokens) {
  if (!tokens.length) return escapeHTML(text);
  // 用簡單方式高亮，避免重疊
  const safe = escapeHTML(text);
  const uniq = Array.from(new Set(tokens)).sort((a,b)=>b.length-a.length);
  let out = safe;
  for (const t of uniq) {
    const re = new RegExp(t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'giu');
    out = out.replace(re, (m) => `<mark>${m}</mark>`);
  }
  return out;
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[c]));
}

function renderResults(q, results) {
  if (!results.length) {
    els.results.innerHTML = `<div class="search-item">找不到符合「${escapeHTML(q)}」的內容。</div>`;
    return;
  }
  const html = results.map(r => {
    const { title, url, content } = r.ref;
    // 摘要：在內文找第一個命中的片段
    const snippet = String(content).slice(0, 280);
    return `
      <a class="search-item" href="${url}">
        <div class="search-title">${highlight(title || url, r.qTokens)}</div>
        <div class="search-snippet">${highlight(snippet, r.qTokens)}</div>
      </a>`;
  }).join('');
  els.results.innerHTML = html;
}

function doSearch(qRaw) {
  const qTokens = tokenizer(qRaw).filter(Boolean);
  if (!qTokens.length) {
    els.results.innerHTML = '';
    return;
  }
  const scored = indexed
    .map(d => ({ ref: d.ref, score: scoreOne(d, qTokens), qTokens }))
    .filter(x => x.score > 0)
    .sort((a,b) => b.score - a.score)
    .slice(0, 30);
  renderResults(qRaw, scored);
}

// 綁定 Enter 觸發搜尋
els.input?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    doSearch(els.input.value.trim());
  }
});

// 初始化：載入 jieba → 載入資料 → 建索引
(async function init() {
  const jb = await ensureJiebaReady();
  if (jb && typeof jb.cutForSearch === 'function') {
    tokenizer = (txt) => jb.cutForSearch(String(txt || ''))
      .map(s => s.trim()).filter(Boolean);
  }
  try {
    const res = await fetch(DATA_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch ${DATA_URL} ${res.status}`);
    const data = await res.json();
    buildIndex(data);
  } catch (err) {
    console.error('[search] 無法載入或解析 search-data.json：', err);
  }
})();