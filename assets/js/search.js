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

document.addEventListener('DOMContentLoaded', loadSearch);
