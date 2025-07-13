/* search-boot.mjs ── 繁中斷詞 + Lunr 搜尋（純 ESM，一份檔案） */

/* 1. 只載一次 jieba-zh-tw  (+esm 版會自動解決相對 import) */
import jieba from 'https://cdn.jsdelivr.net/npm/jieba-zh-tw@1.0.12/+esm';

/* 2. Lunr 仍建議用 UMD <script> 方式載入（最穩定） */
/*    如果你確實想全部用 ES module，也可以： */
// import lunr from 'https://cdn.jsdelivr.net/npm/lunr@2.3.9/+esm';

/* ---- jieba 初始化 ---- */
await jieba.load();                     // 下載 + 解析字典

/* ---- 取文章資料 ---- */
const docs = await (await fetch('/assets/js/search-data.json')).json();

/* ---- 中文斷詞器 ---- */
const tokenizer = str => jieba.cutForSearch(String(str || ''));

/* ---- Lunr 建索引 ---- */
lunr.tokenizer.register('zh', tokenizer);
const idx = lunr(function () {
  this.tokenizerFn = tokenizer;
  this.ref('url');
  this.field('title',   { boost: 10 });
  this.field('content');
  docs.forEach(d => this.add(d));
});

/* ---- 綁定 UI ---- */
const input = document.getElementById('search-input');
const list  = document.getElementById('search-results');

input.addEventListener('input', () => {
  const q = input.value.trim();
  if (!q) { list.style.display = 'none'; list.innerHTML = ''; return; }

  const seg = tokenizer(q).join(' ');
  const res = idx.search(seg);

  list.innerHTML = res.length
    ? res.map(r=>{
        const d = docs.find(x => x.url === r.ref);
        return `<li><a href="${d.url}">
                  <strong>${d.title}</strong><br>
                  <small>${d.content.slice(0,90)}…</small>
                </a></li>`;
      }).join('')
    : '<li style="padding:8px 12px;">找不到相關文章</li>';

  list.style.display = 'block';
});

document.addEventListener('click', e=>{
  if (!input.contains(e.target) && !list.contains(e.target))
    list.style.display = 'none';
});
