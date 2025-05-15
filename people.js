document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('people');
  const paginationContainer = document.getElementById('pagination');
  const searchInput = document.getElementById('searchPeople');
  const filterGender = document.getElementById('filterGender');
  const filterCountry = document.getElementById('filterCountry');
  const filterPopular = document.getElementById('filterPopular');

  const rowsToShow = 3;
  const peoplePerPage = rowsToShow * 6; // 3 rows of 6 people
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

    const filtered = currentData.filter(person => {
      const nameMatch = person.name?.toLowerCase().includes(filterTerm.toLowerCase());
      const genderMatch = !filterGender.value || (person.gender && person.gender.toLowerCase() === filterGender.value.toLowerCase());
      const countryMatch = !filterCountry.value || (person.country && person.country.name === filterCountry.value);
      return nameMatch && genderMatch && countryMatch;
    });

    if (filterPopular.checked) {
      filtered.sort((a, b) => (b.updated || 0) - (a.updated || 0));
    }

    const totalPages = Math.ceil(filtered.length / peoplePerPage);
    const start = currentPage * peoplePerPage;
    const end = start + peoplePerPage;
    const displayData = filtered.slice(start, end);

    displayData.forEach(person => {
      const div = document.createElement('div');
      div.className = 'col text-center';
      div.innerHTML = `
        <a href="person.html?id=${person.id}" class="text-decoration-none text-dark">
          <img src="${person.image?.medium || 'https://via.placeholder.com/80'}" class="cast-img mb-2" alt="${person.name}">
          <div><strong>${person.name}</strong></div>
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

  // « Previous 5 block
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

  // Page numbers
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

  // » Next 5 block
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
    const countries = Array.from(new Set(currentData.map(p => p.country?.name).filter(Boolean))).sort();
    filterCountry.innerHTML = '<option value="">All Countries</option>' + countries.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Event listeners
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

  filterPopular.addEventListener('change', () => {
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
