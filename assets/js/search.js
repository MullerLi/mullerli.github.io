async function loadSearch() {
  const response = await fetch('/search.json');
  const documents = await response.json();

  const idx = lunr(function () {
    this.ref('url');
    this.field('title');
    this.field('content');

    documents.forEach(doc => this.add(doc));
  });

  const searchInput = document.getElementById('search-input');
  const resultsContainer = document.getElementById('search-results');

  searchInput.addEventListener('input', function () {
    const query = this.value.trim();
    resultsContainer.innerHTML = '';
    if (!query) return;

    const results = idx.search(query);

    results.forEach(result => {
      const item = documents.find(d => d.url === result.ref);
      if (item) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = item.url;
        a.textContent = item.title;
        li.appendChild(a);
        resultsContainer.appendChild(li);
      }
    });
  });
}
function initSearchToggle() {
  const container = document.querySelector('.search-container');
  const icon = document.getElementById('search-icon');
  const input = document.getElementById('search-input');
  if (!container || !icon || !input) return;

  icon.addEventListener('click', function () {
    container.classList.add('active');
    input.focus();
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initSearchToggle();
  loadSearch();
});
