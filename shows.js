document.addEventListener('DOMContentLoaded', () => {
  const showsContainer = document.getElementById('shows');
  const paginationContainer = document.getElementById('pagination');
  const searchInput = document.getElementById('searchShows');
  const filterGenre = document.getElementById('filterGenre');
  const filterLanguage = document.getElementById('filterLanguage');
  const filterCountry = document.getElementById('filterCountry');
  const filterType = document.getElementById('filterType');
  const sortBy = document.getElementById('sortBy');

  const SHOWS_PER_PAGE = 18;
  let allShows = [];
  let currentPage = 0;

  async function fetchShows() {
    let page = 0;
    let results = [];
    let nextPage = true;
    while (nextPage && page < 10) {
      const res = await fetch(`https://api.tvmaze.com/shows?page=${page}`);
      const data = await res.json();
      if (data.length === 0) nextPage = false;
      results = results.concat(data);
      page++;
    }
    allShows = results;
    populateFilters();
    renderShows();
  }

  function populateFilters() {
    const genres = new Set();
    const languages = new Set();
    const countries = new Set();
    const types = new Set();

    allShows.forEach(show => {
      show.genres.forEach(g => genres.add(g));
      if (show.language) languages.add(show.language);
      if (show.network?.country?.name) countries.add(show.network.country.name);
      if (show.type) types.add(show.type);
    });

    filterGenre.innerHTML += [...genres].sort().map(g => `<option value="${g}">${g}</option>`).join('');
    filterLanguage.innerHTML += [...languages].sort().map(l => `<option value="${l}">${l}</option>`).join('');
    filterCountry.innerHTML += [...countries].sort().map(c => `<option value="${c}">${c}</option>`).join('');
    filterType.innerHTML += [...types].sort().map(t => `<option value="${t}">${t}</option>`).join('');
  }

  function renderShows() {
    showsContainer.innerHTML = '';

    let filtered = allShows.filter(show => {
      return (
        (!searchInput.value || show.name.toLowerCase().includes(searchInput.value.toLowerCase())) &&
        (!filterGenre.value || show.genres.includes(filterGenre.value)) &&
        (!filterLanguage.value || show.language === filterLanguage.value) &&
        (!filterCountry.value || show.network?.country?.name === filterCountry.value) &&
        (!filterType.value || show.type === filterType.value)
      );
    });

    switch (sortBy.value) {
      case 'az':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'za':
        filtered.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case 'recent':
        filtered.sort((a, b) => new Date(b.updated) - new Date(a.updated));
        break;
      case 'popularity':
        filtered.sort((a, b) => (b.weight || 0) - (a.weight || 0));
        break;
    }

    const totalPages = Math.ceil(filtered.length / SHOWS_PER_PAGE);
    const start = currentPage * SHOWS_PER_PAGE;
    const end = start + SHOWS_PER_PAGE;
    const pageShows = filtered.slice(start, end);

    pageShows.forEach(show => {
      const div = document.createElement('div');
      div.className = 'col text-center';
      div.innerHTML = `
        <a href="show-info.html?id=${show.id}" class="text-decoration-none text-dark">
          <img src="${show.image?.medium || 'https://via.placeholder.com/80'}" class="cast-img mb-2" alt="${show.name}" />
          <div><strong>${show.name}</strong></div>
        </a>
      `;
      showsContainer.appendChild(div);
    });

    renderPagination(filtered.length, totalPages);
  }

  function renderPagination(totalItems, totalPages) {
    paginationContainer.innerHTML = '';
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center flex-wrap';

    const maxVisiblePages = 5;
    const startPage = Math.floor(currentPage / maxVisiblePages) * maxVisiblePages;
    const endPage = Math.min(startPage + maxVisiblePages, totalPages);

    if (startPage > 0) {
      const li = document.createElement('li');
      li.className = 'page-item';
      li.innerHTML = '<button class="page-link">&laquo;</button>';
      li.addEventListener('click', () => {
        currentPage = startPage - 1;
        renderShows();
      });
      ul.appendChild(li);
    }

    for (let i = startPage; i < endPage; i++) {
      const li = document.createElement('li');
      li.className = 'page-item' + (i === currentPage ? ' active' : '');

      const btn = document.createElement('button');
      btn.className = 'page-link';
      btn.textContent = i + 1;
      btn.addEventListener('click', () => {
        currentPage = i;
        renderShows();
      });

      li.appendChild(btn);
      ul.appendChild(li);
    }

    if (endPage < totalPages) {
      const li = document.createElement('li');
      li.className = 'page-item';
      li.innerHTML = '<button class="page-link">&raquo;</button>';
      li.addEventListener('click', () => {
        currentPage = endPage;
        renderShows();
      });
      ul.appendChild(li);
    }

    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
  }

  [searchInput, filterGenre, filterLanguage, filterCountry, filterType, sortBy].forEach(el => {
    el.addEventListener('input', () => {
      currentPage = 0;
      renderShows();
    });
    el.addEventListener('change', () => {
      currentPage = 0;
      renderShows();
    });
  });

  fetchShows();
});
