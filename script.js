document.addEventListener('DOMContentLoaded', () => {
  /*** === Live Search Dropdown === ***/
  // Get references to search input, dropdown, and form elements
  const input = document.getElementById('globalSearchInput');
  const dropdown = document.getElementById('searchDropdown');
  const form = document.getElementById('globalSearchForm');
  let debounceTimer; // Timer for debouncing input
  let currentFocusIndex = -1; // Tracks which dropdown item is focused
  let dropdownItems = []; // Stores current dropdown items

  if (form && input && dropdown) {
    // Handle form submission (when user presses Enter in search)
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        // Redirect to search results page with query
        window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
      }
    });

    // Handle input event for live search
    input.addEventListener('input', () => {
      const query = input.value.trim();
      clearTimeout(debounceTimer);
      if (!query) {
        // Hide dropdown if input is empty
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        return;
      }
      // Debounce live search to avoid too many API calls
      debounceTimer = setTimeout(() => performLiveSearch(query), 300);
    });

    // Hide dropdown when clicking outside of it or the input
    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target) && e.target !== input) {
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
      }
    });

    // Keyboard navigation for dropdown (arrow keys, enter, escape)
    input.addEventListener('keydown', (e) => {
      const maxIndex = dropdownItems.length - 1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Move focus down, wrap to top if at end
        currentFocusIndex = (currentFocusIndex + 1 > maxIndex) ? 0 : currentFocusIndex + 1;
        updateActiveDescendant();
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        // Move focus up, wrap to bottom if at start
        currentFocusIndex = (currentFocusIndex - 1 < 0) ? maxIndex : currentFocusIndex - 1;
        updateActiveDescendant();
      }

      if (e.key === 'Enter' && currentFocusIndex >= 0) {
        e.preventDefault();
        // Trigger click on focused dropdown item
        dropdownItems[currentFocusIndex].click();
      }

      if (e.key === 'Escape') {
        // Hide dropdown and reset focus
        dropdown.style.display = 'none';
        input.setAttribute('aria-expanded', 'false');
        currentFocusIndex = -1;
        input.setAttribute('aria-activedescendant', '');
      }
    });

    // Update ARIA attributes and visual highlight for focused dropdown item
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

    // Perform live search using TVMaze API for shows and people
    function performLiveSearch(query) {
      // Show loading indicator
      dropdown.innerHTML = '<div class="list-group-item">Searching...</div>';
      dropdown.style.display = 'block';
      input.setAttribute('aria-expanded', 'true');

      // Fetch shows and people in parallel
      const showSearch = fetch(`https://api.tvmaze.com/search/shows?q=${query}`).then(res => res.json());
      const peopleSearch = fetch(`https://api.tvmaze.com/search/people?q=${query}`).then(res => res.json());

      Promise.all([showSearch, peopleSearch])
        .then(([shows, people]) => {
          dropdown.innerHTML = '';
          dropdownItems = [];
          currentFocusIndex = -1;

          // If no results, show message
          if (!shows.length && !people.length) {
            dropdown.innerHTML = '<div class="list-group-item text-muted">No results found</div>';
            return;
          }

          const maxResults = 6; // Limit total results in dropdown
          let resultCount = 0;

          // Add show results to dropdown
          shows.slice(0, maxResults).forEach(({ show }) => {
            if (resultCount >= maxResults) return;
            const el = createDropdownItem(`Show: ${show.name}`, () => {
              window.location.href = `show-info.html?id=${show.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          });

          // Add people results to dropdown (fill up to maxResults)
          people.slice(0, maxResults - resultCount).forEach(({ person }) => {
            const el = createDropdownItem(`Person: ${person.name}`, () => {
              window.location.href = `person-info.html?id=${person.id}`;
            });
            dropdown.appendChild(el);
            resultCount++;
          });

          // Add "See all results" button at the end
          const seeAllBtn = createDropdownItem('See all results', () => {
            const query = input.value.trim();
            if (query) {
              window.location.href = `search-results.html?q=${encodeURIComponent(query)}`;
            }
          }, 'list-group-item text-center fw-bold');
          seeAllBtn.setAttribute('tabindex', '0');
          // Allow keyboard activation of "See all results"
          seeAllBtn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              seeAllBtn.click();
            }
          });
          dropdown.appendChild(seeAllBtn);

          // Update dropdownItems for keyboard navigation
          dropdownItems = dropdown.querySelectorAll('.list-group-item');
        })
        .catch(() => {
          // Show error message if API fails
          dropdown.innerHTML = '<div class="list-group-item text-danger">Error fetching results</div>';
        });
    }

    // Helper to create a dropdown item element
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
  // Filter cards on the page based on search input (client-side)
  const searchInput = document.querySelector(".search-form input");
  const cards = document.querySelectorAll(".card");
  if (searchInput && cards.length) {
    searchInput.addEventListener("keyup", function () {
      const query = this.value.toLowerCase();
      cards.forEach(card => {
        // Get card title and text, check if query matches
        const title = card.querySelector(".card-title")?.textContent.toLowerCase() || '';
        const text = card.querySelector(".card-text")?.textContent.toLowerCase() || '';
        card.parentElement.style.display = (title.includes(query) || text.includes(query)) ? "block" : "none";
      });
    });
  }

  /*** === Carousel Functionality === ***/
  const carousel = document.getElementById('cardCarousel');
  if (!carousel) return;

  let currentIndex = 0; // Tracks current card index in carousel

  // Scroll carousel left or right by one card
  window.scrollCarousel = function (direction) {
    const cards = carousel.querySelectorAll('.card');
    if (!cards.length) return;

    const cardWidth = cards[0].offsetWidth + 16; // Card width + margin
    const totalCards = cards.length;

    // Update index, wrap around if needed
    currentIndex += direction;
    if (currentIndex < 0) currentIndex = totalCards - 1;
    else if (currentIndex >= totalCards) currentIndex = 0;

    // Scroll carousel to new position
    carousel.scrollTo({
      left: currentIndex * cardWidth,
      behavior: 'smooth'
    });
  };

  // Keyboard navigation for carousel (left/right arrows)
  document.addEventListener('keydown', (event) => {
    if (carousel.offsetParent === null) return; // Ignore if carousel is hidden
    if (event.key === 'ArrowLeft') scrollCarousel(-1);
    if (event.key === 'ArrowRight') scrollCarousel(1);
  });

  // Touch swipe support for carousel (mobile)
  let startX = 0;
  let isSwiping = false;

  carousel.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      startX = e.touches[0].clientX;
      isSwiping = true;
    }
  });

  carousel.addEventListener('touchmove', (e) => {
    if (isSwiping) e.preventDefault(); // Prevent scrolling while swiping
  }, { passive: false });

  carousel.addEventListener('touchend', (e) => {
    if (!isSwiping) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - startX;
    // If swipe distance is significant, scroll carousel
    if (Math.abs(diff) > 50) {
      scrollCarousel(diff < 0 ? 1 : -1);
    }
    isSwiping = false;
  });

  // Fetch and display popular shows in the carousel
  fetchPopularShows();

  // Fetches popular shows from TVMaze API and populates carousel
  async function fetchPopularShows() {
    try {
      const response = await fetch('https://api.tvmaze.com/shows');
      const shows = await response.json();
      carousel.innerHTML = '';

      // Show only first 10 shows in carousel
      shows.slice(0, 10).forEach(show => {
        const card = document.createElement('div');
        card.className = 'card';
        card.style.cursor = 'pointer';
        const image = show.image ? show.image.medium : 'https://via.placeholder.com/200x300';
        card.innerHTML = `
          <img src="${image}" class="card-img-top" alt="${show.name}" />
          <div class="card-body text-center"></div>
        `;
        // Clicking a card navigates to show info page
        card.addEventListener('click', () => {
          window.location.href = `show-info.html?id=${show.id}`;
        });
        carousel.appendChild(card);
      });
    } catch (err) {
      // Log error if fetch fails
      console.error('Failed to fetch popular shows:', err);
    }
  }
});
