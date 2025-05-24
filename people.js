// Index page
// Fetch popular shows and render them in a live dropdown
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  let debounceTimer;

  input.addEventListener('input', () => {
    const query = input.value.trim();

    clearTimeout(debounceTimer);
    if (!query) {
      dropdown.style.display = 'none';
      return;
    }

    debounceTimer = setTimeout(() => {
      performLiveSearch(query);
    }, 300); // debounce
  });

  // Hide dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!dropdown.contains(e.target) && e.target !== input) {
      dropdown.style.display = 'none';
    }
  });

  function performLiveSearch(query) {
    dropdown.innerHTML = '<div class="list-group-item">Searching...</div>';
    dropdown.style.display = 'block';

    const showSearch = fetch(`https://api.tvmaze.com/search/shows?q=${query}`).then(res => res.json());
    const peopleSearch = fetch(`https://api.tvmaze.com/search/people?q=${query}`).then(res => res.json());

    Promise.all([showSearch, peopleSearch])
      .then(([shows, people]) => {
        dropdown.innerHTML = '';

        if (!shows.length && !people.length) {
          dropdown.innerHTML = '<div class="list-group-item text-muted">No results found</div>';
          return;
        }

        shows.slice(0, 5).forEach(item => {
          const s = item.show;
          const el = document.createElement('div');
          el.className = 'list-group-item';
          el.innerHTML = `<strong>Show:</strong> ${s.name}`;
          el.addEventListener('click', () => {
            window.location.href = `show-info.html?id=${s.id}`;
          });
          dropdown.appendChild(el);
        });

        people.slice(0, 5).forEach(item => {
          const p = item.person;
          const el = document.createElement('div');
          el.className = 'list-group-item';
          el.innerHTML = `<strong>Person:</strong> ${p.name}`;
          el.addEventListener('click', () => {
            window.location.href = `person-info.html?id=${p.id}`;
          });
          dropdown.appendChild(el);
        });
      })
      .catch(err => {
        console.error(err);
        dropdown.innerHTML = '<div class="list-group-item text-danger">Error fetching results</div>';
      });
  }
});

// People page functionality
document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('people');
  const paginationContainer = document.getElementById('pagination');
  const searchInput = document.getElementById('searchPeople');
  const filterGender = document.getElementById('filterGender');
  const filterCountry = document.getElementById('filterCountry');
  const sortPeople = document.getElementById('sortPeople');

  const rowsToShow = 3;
  const peoplePerPage = rowsToShow * 6;
  let currentPage = 0;
  let currentData = [];
  let filterTerm = '';

  function fetchPeople(page) {
    fetch(`https://api.tvmaze.com/people?page=${page}`)
      .then(res => res.json())
      .then(data => {
        currentData = data;
        renderPeople();
        populateFilterOptions();
      })
      .catch(err => console.error('Error fetching data:', err));
  }

  function renderPeople() {
    container.innerHTML = '';

    let filtered = currentData.filter(person => {
      const nameMatch = person.name?.toLowerCase().includes(filterTerm.toLowerCase());
      const genderMatch = !filterGender.value ||
        (person.gender && person.gender.toLowerCase() === filterGender.value.toLowerCase());
      const countryMatch = !filterCountry.value ||
        (person.country && person.country.name === filterCountry.value);
      return nameMatch && genderMatch && countryMatch;
    });

    if (sortPeople.value === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortPeople.value === 'za') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    const totalPages = Math.ceil(filtered.length / peoplePerPage);
    const start = currentPage * peoplePerPage;
    const end = start + peoplePerPage;
    const displayData = filtered.slice(start, end);

    displayData.forEach(person => {
      const div = document.createElement('div');
      div.className = 'col text-center';
      div.innerHTML = `
        <a href="person.html?id=${person.id}" class="text-decoration-none d-block h-100">
          <img src="${person.image?.medium || 'images/no_image.png'}" class="card-img-square mb-2" alt="${person.name}">
          <div class="person-name"><strong>${person.name}</strong></div>
        </a>
      `;
      container.appendChild(div);
    });

    renderPagination(filtered.length, totalPages);
  }

  function renderPagination(totalResults, totalPages) {
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
      li.innerHTML = `<button class="page-link">&laquo;</button>`;
      li.addEventListener('click', () => {
        currentPage = startPage - 1;
        renderPeople();
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
        renderPeople();
      });

      li.appendChild(btn);
      ul.appendChild(li);
    }

    if (endPage < totalPages) {
      const li = document.createElement('li');
      li.className = 'page-item';
      li.innerHTML = `<button class="page-link">&raquo;</button>`;
      li.addEventListener('click', () => {
        currentPage = endPage;
        renderPeople();
      });
      ul.appendChild(li);
    }

    nav.appendChild(ul);
    paginationContainer.appendChild(nav);
  }

  function populateFilterOptions() {
    const countries = Array.from(
      new Set(currentData.map(p => p.country?.name).filter(Boolean))
    ).sort();
    filterCountry.innerHTML =
      '<option value="">All Countries</option>' +
      countries.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  searchInput.addEventListener('input', (e) => {
    filterTerm = e.target.value;
    currentPage = 0;
    renderPeople();
  });

  filterGender.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  filterCountry.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  sortPeople.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      currentPage++;
      renderPeople();
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
      currentPage--;
      renderPeople();
    }
  });

  fetchPeople(currentPage);
});
