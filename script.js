document.addEventListener('DOMContentLoaded', () => {
  /*** === Live Search Dropdown === ***/
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const form = document.getElementById('globalSearchForm');
  let debounceTimer;
  let currentFocusIndex = -1;
  let dropdownItems = [];

  if (form && input && dropdown) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
      }
    });

    input.addEventListener('input', () => {
      const query = input.value.trim();
      clearTimeout(debounceTimer);
      if (!query) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        return;
      }
      debounceTimer = setTimeout(() => performLiveSearch(query), 300);
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
      }
    });

    input.addEventListener('keydown', (e) => {
      const maxIndex = dropdownItems.length - 1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentFocusIndex = (currentFocusIndex + 1 > maxIndex) ? 0 : currentFocusIndex + 1;
        updateActiveDescendant();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentFocusIndex = (currentFocusIndex - 1 < 0) ? maxIndex : currentFocusIndex - 1;
        updateActiveDescendant();
      }

      if (e.key === 'Enter' && currentFocusIndex >= 0) {
        e.preventDefault();
        dropdownItems[currentFocusIndex].click();
      }

      if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        currentFocusIndex = -1;
        input.setAttribute('aria-activedescendant', '');
      }
    });

    function updateActiveDescendant() {
      dropdownItems.forEach((item, index) => {
        item.classList.toggle('active', index === currentFocusIndex);
        if (index === currentFocusIndex) {
          const id = item.id || `dropdown-item-${index}`;
          item.id = id;
          input.setAttribute('aria-activedescendant', id);
        }
      });
    }

    function performLiveSearch(query) {
      dropdown.innerHTML = '<div class="list-group-item">Searching...</div>';
      dropdown.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');

      const showSearch = fetch(`https://api.tvmaze.com/search/shows?q=${query}`).then(res => res.json());
      const peopleSearch = fetch(`https://api.tvmaze.com/search/people?q=${query}`).then(res => res.json());

      Promise.all([showSearch, peopleSearch])
        .then(([shows, people]) => {
          dropdown.innerHTML = '';
          dropdownItems = [];
          currentFocusIndex = -1;

          if (!shows.length && !people.length) {
            dropdown.innerHTML = '<div class="list-group-item text-muted">No results found</div>';
            return;
          }

          const maxResults = 6;
          let resultCount = 0;

          shows.slice(0, maxResults).forEach(({ show }) => {
            if (resultCount >= maxResults) return;
            const el = createDropdownItem(`Show: ${show.name}`, () => {
              window.location.href = `show-info.html?id=${show.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          });

          people.slice(0, maxResults - resultCount).forEach(({ person }) => {
            const el = createDropdownItem(`Person: ${person.name}`, () => {
              window.location.href = `person-info.html?id=${person.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          });

          const seeAllBtn = createDropdownItem('See all results', () => {
            const query = input.value.trim();
            if (query) {
              window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
          }, 'list-group-item text-center fw-bold');
          seeAllBtn.setAttribute('tabindex', '0');
          seeAllBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              seeAllBtn.click();
            }
          });
          dropdown.appendChild(seeAllBtn);

          dropdownItems = dropdown.querySelectorAll('.list-group-item');
        })
        .catch(() => {
          dropdown.innerHTML = '<div class="list-group-item text-danger">Error fetching results</div>';
        });
    }

    function createDropdownItem(text, onClick, className = 'list-group-item') {
      const el = document.createElement('div');
      el.className = className;
      el.setAttribute('role', 'option');
      el.style.cursor = 'pointer';
      el.innerHTML = `<strong>${text}</strong>`;
      el.addEventListener('click', onClick);
      return el;
    }
  }

  /*** === Local Card Filter (Optional) === ***/
  const searchInput = document.querySelector(".search-form input");
  const cards = document.querySelectorAll(".card");
  if (searchInput && cards.length) {
    searchInput.addEventListener("keyup", function () {
      const query = this.value.toLowerCase();
      cards.forEach(card => {
        const title = card.querySelector(".card-title")?.textContent.toLowerCase() || '';
        const text = card.querySelector(".card-text")?.textContent.toLowerCase() || '';
        card.parentElement.style.display = (title.includes(query) || text.includes(query)) ? "block" : "none";
      });
    });
  }

  /*** === Carousel Functionality === ***/
  const carousel = document.getElementById('cardCarousel');
  if (!carousel) return;

  let currentIndex = 0;

  window.scrollCarousel = function (direction) {
    const cards = carousel.querySelectorAll('.card');
    if (!cards.length) return;

    const cardWidth = cards[0].offsetWidth + 16;
    const totalCards = cards.length;

    currentIndex += direction;
    if (currentIndex < 0) currentIndex = totalCards - 1;
    else if (currentIndex >= totalCards) currentIndex = 0;

    carousel.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  document.addEventListener('keydown', (event) => {
    if (carousel.offsetParent === null) return;
    if (event.key === 'ArrowLeft') scrollCarousel(-1);
    if (event.key === 'ArrowRight') scrollCarousel(1);
  });

  let startX = 0;
  let isSwiping = false;

  carousel.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }
  });

  carousel.addEventListener('touchmove', (e) => {
    if (isSwiping) e.preventDefault();
  }, { passive: false });

  carousel.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    if (Math.abs(diff) > 50) {
      scrollCarousel(diff < 0 ? 1 : -1);
    }
    isSwiping = false;
  });

  fetchPopularShows();

  async function fetchPopularShows() {
    try {
      const response = await fetch('https://api.tvmaze.com/shows');
      const shows = await response.json();
      carousel.innerHTML = '';

      shows.slice(0, 10).forEach(show => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        const image = show.image ? show.image.medium : 'https://via.placeholder.com/200x300';
        card.innerHTML = `
          <img src="${image}" class="card-img-top" alt="${show.name}" />
          <div class="card-body text-center"></div>
        `;
        card.addEventListener('click', () => {
          window.location.href = `show-info.html?id=${show.id}`;
        });
        carousel.appendChild(card);
      });
    } catch (err) {
      console.error('Failed to fetch popular shows:', err);
    }
  }
});
