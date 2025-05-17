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


// Wait for the DOM to fully load before running the script

document.addEventListener('DOMContentLoaded', () => {
  // DOM element references
  const container = document.getElementById('people');
  const paginationContainer = document.getElementById('pagination');
  const searchInput = document.getElementById('searchPeople');
  const filterGender = document.getElementById('filterGender');
  const filterCountry = document.getElementById('filterCountry');
  const sortPeople = document.getElementById('sortPeople');

  // Pagination and filtering variables
  const rowsToShow = 3; // Number of rows to display per page
  const peoplePerPage = rowsToShow * 6; // Number of people per page 
  let currentPage = 0; // Current page index
  let currentData = []; // Data fetched from API
  let filterTerm = ''; // Search/filter term

  /**
   * Fetch people data from the API for a given page
   * @param {number} page - The page number to fetch
   */
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

  /**
   * Render the people grid based on current filters, sorting, and pagination
   */
  function renderPeople() {
    container.innerHTML = '';

    // Filter data based on search, gender, and country
    let filtered = currentData.filter(person => {
      const nameMatch = person.name?.toLowerCase().includes(filterTerm.toLowerCase());
      const genderMatch = !filterGender.value ||
        (person.gender && person.gender.toLowerCase() === filterGender.value.toLowerCase());
      const countryMatch = !filterCountry.value ||
        (person.country && person.country.name === filterCountry.value);
      return nameMatch && genderMatch && countryMatch;
    });

    // Sort filtered data if needed
    if (sortPeople.value === 'az') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortPeople.value === 'za') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }

    // Pagination calculations
    const totalPages = Math.ceil(filtered.length / peoplePerPage);
    const start = currentPage * peoplePerPage;
    const end = start + peoplePerPage;
    const displayData = filtered.slice(start, end);

    // Render each person as a card
    displayData.forEach(person => {
      const div = document.createElement('div');
      div.className = 'col text-center';
      div.innerHTML = `
        <a href="person.html?id=${person.id}" class="text-decoration-none text-dark d-block h-100">
          <img src="${person.image?.medium || 'https://via.placeholder.com/100'}" class="card-img-square mb-2" alt="${person.name}">
          <div><strong>${person.name}</strong></div>
        </a>
      `;
      container.appendChild(div);
    });

    // Render pagination controls
    renderPagination(filtered.length, totalPages);
  }

  /**
   * Render pagination controls based on total results and pages
   * @param {number} totalResults - Total number of filtered results
   * @param {number} totalPages - Total number of pages
   */
  function renderPagination(totalResults, totalPages) {
    paginationContainer.innerHTML = '';
    const nav = document.createElement('nav');
    const ul = document.createElement('ul');
    ul.className = 'pagination justify-content-center flex-wrap';

    const maxVisiblePages = 5; // Max number of page buttons to show
    const startPage = Math.floor(currentPage / maxVisiblePages) * maxVisiblePages;
    const endPage = Math.min(startPage + maxVisiblePages, totalPages);

    // Previous page group button («)
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

    // Page number buttons
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

    // Next page group button (»)
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

  /**
   * Populate the country filter dropdown with unique country names from the data
   */
  function populateFilterOptions() {
    const countries = Array.from(
      new Set(currentData.map(p => p.country?.name).filter(Boolean))
    ).sort();
    filterCountry.innerHTML =
      '<option value="">All Countries</option>' +
      countries.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // --- Event Listeners ---

  // Search input event
  searchInput.addEventListener('input', (e) => {
    filterTerm = e.target.value;
    currentPage = 0;
    renderPeople();
  });

  // Gender filter event
  filterGender.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  // Country filter event
  filterCountry.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  // Sort dropdown event
  sortPeople.addEventListener('change', () => {
    currentPage = 0;
    renderPeople();
  });

  // Keyboard navigation for pagination (left/right arrows)
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') {
      currentPage++;
      renderPeople();
    } else if (e.key === 'ArrowLeft' && currentPage > 0) {
      currentPage--;
      renderPeople();
    }
  });

  // Initial fetch and render
  fetchPeople(currentPage);
});
