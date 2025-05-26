// Live Dropdown + Redirect on Submit with Arrow Key Navigation, Escape Key, Result Limit, and Keyboard Support for 'See All Results'

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const form = document.getElementById('globalSearchForm');
  let debounceTimer;
  let currentFocusIndex = -1;
  let dropdownItems = [];

  if (form && input && dropdown) {
    form.addEventListener('submit', function(e) {
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

      debounceTimer = setTimeout(() => {
        performLiveSearch(query);
      }, 300);
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
      }
    });

    input.addEventListener('keydown', function (e) {
      const key = e.key;
      const maxIndex = dropdownItems.length - 1;

      if (key === 'ArrowDown') {
        e.preventDefault();
        currentFocusIndex = (currentFocusIndex + 1 > maxIndex) ? 0 : currentFocusIndex + 1;
        updateActiveDescendant();
      }

      if (key === 'ArrowUp') {
        e.preventDefault();
        currentFocusIndex = (currentFocusIndex - 1 < 0) ? maxIndex : currentFocusIndex - 1;
        updateActiveDescendant();
      }

      if (key === 'Enter' && currentFocusIndex >= 0) {
        e.preventDefault();
        dropdownItems[currentFocusIndex].click();
      }

      if (key === 'Escape') {
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

          for (let i = 0; i < shows.length && resultCount < maxResults; i++) {
            const s = shows[i].show;
            const el = document.createElement('div');
            el.className = 'list-group-item';
            el.setAttribute('role', 'option');
            el.style.cursor = 'pointer';
            el.innerHTML = `<strong>Show:</strong> ${s.name}`;
            el.addEventListener('click', () => {
              window.location.href = `show-info.html?id=${s.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          }

          for (let i = 0; i < people.length && resultCount < maxResults; i++) {
            const p = people[i].person;
            const el = document.createElement('div');
            el.className = 'list-group-item';
            el.setAttribute('role', 'option');
            el.style.cursor = 'pointer';
            el.innerHTML = `<strong>Person:</strong> ${p.name}`;
            el.addEventListener('click', () => {
              window.location.href = `person-info.html?id=${p.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          }

          const seeAllBtn = document.createElement('div');
          seeAllBtn.className = 'list-group-item text-center fw-bold';
          seeAllBtn.style.cursor = 'pointer';
          seeAllBtn.textContent = 'See all results';
          seeAllBtn.setAttribute('role', 'option');
          seeAllBtn.setAttribute('tabindex', '0');
          seeAllBtn.addEventListener('click', () => {
            const query = input.value.trim();
            if (query) {
              window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
          });
          seeAllBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              seeAllBtn.click();
            }
          });
          dropdown.appendChild(seeAllBtn);

          dropdownItems = dropdown.querySelectorAll('.list-group-item');
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

  // Add keyboard navigation for the carousel
document.addEventListener('keydown', function (event) {
  // Only run if the carousel is in view or active (optional guard)
  const isInView = carousel.offsetParent !== null; // crude check
  if (!isInView) return;

  if (event.key === 'ArrowLeft') {
    scrollCarousel(-1);
  } else if (event.key === 'ArrowRight') {
    scrollCarousel(1);
  }
});
// Add swipe support for touch devices
let startX = 0;
let isSwiping = false;

carousel.addEventListener('touchstart', function (e) {
  if (e.touches.length === 1) {
    startX = e.touches[0].clientX;
    isSwiping = true;
  }
});

carousel.addEventListener('touchmove', function (e) {
  // Prevent scrolling the page while swiping carousel
  if (isSwiping) e.preventDefault();
}, { passive: false });

carousel.addEventListener('touchend', function (e) {
  if (!isSwiping) return;
  const endX = e.changedTouches[0].clientX;
  const diff = endX - startX;
  if (Math.abs(diff) > 50) {
    if (diff < 0) {
      scrollCarousel(1); // swipe left, go next
    } else {
      scrollCarousel(-1); // swipe right, go prev
    }
  }
  isSwiping = false;
});

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

