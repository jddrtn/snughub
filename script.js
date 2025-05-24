// Live Dropdown + Redirect on Submit
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const form = document.getElementById('globalSearchForm');
  let debounceTimer;

  if (form && input && dropdown) {
    // Submit handler to redirect to search results page
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
      }
    });

    // Live dropdown
    input.addEventListener('input', () => {
      const query = input.value.trim();
      clearTimeout(debounceTimer);
      if (!query) {
        dropdown.style.display = 'none';
        return;
      }

      debounceTimer = setTimeout(() => {
        performLiveSearch(query);
      }, 300);
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
            el.style.cursor = 'pointer';
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
            el.style.cursor = 'pointer';
            el.innerHTML = `<strong>Person:</strong> ${p.name}`;
            el.addEventListener('click', () => {
              window.location.href = `person-info.html?id=${p.id}`;
            });
            dropdown.appendChild(el);
          });
          // Add "See all results" button
const seeAllBtn = document.createElement('div');
seeAllBtn.className = 'list-group-item text-center fw-bold';
seeAllBtn.style.cursor = 'pointer';
seeAllBtn.textContent = 'See all results';
seeAllBtn.addEventListener('click', () => {
  const query = document.getElementById('globalSearchInput').value.trim();
  if (query) {
    window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
  }
});
dropdown.appendChild(seeAllBtn);

        })
        .catch(err => {
          console.error(err);
          dropdown.innerHTML = '<div class="list-group-item text-danger">Error fetching results</div>';
        });
    }
  }
});

// Local card filtering (only on pages that use cards with .card-title / .card-text)
document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.querySelector(".search-form input");
  const cards = document.querySelectorAll(".card");

  if (searchInput && cards.length) {
    searchInput.addEventListener("keyup", function () {
      const query = this.value.toLowerCase();
      cards.forEach(card => {
        const title = card.querySelector(".card-title")?.textContent.toLowerCase() || '';
        const text = card.querySelector(".card-text")?.textContent.toLowerCase() || '';
        const match = title.includes(query) || text.includes(query);
        card.parentElement.style.display = match ? "block" : "none";
      });
    });
  }
});

// Hero text animation
document.addEventListener('DOMContentLoaded', () => {
  const heroText = document.querySelector('.hero-text');
  if (heroText) {
    setTimeout(() => {
      heroText.classList.add('fade-in');
    }, 200);
  }
});

// Carousel functionality
document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.getElementById('cardCarousel');
  if (!carousel) return;

  let currentIndex = 0;
  const cards = carousel.querySelectorAll('.card');
  const cardWidth = cards[0]?.offsetWidth + 16 || 276; 
  const totalCards = cards.length;

  // Scroll manually 
  window.scrollCarousel = function(direction) {
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = totalCards - 1;
    else if (currentIndex >= totalCards) currentIndex = 0;

    carousel.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  // Fetch and render popular shows
  fetchPopularShows();

  async function fetchPopularShows() {
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
  }
});

