// Index page
document.addEventListener("DOMContentLoaded", function () {
  // Select the search input field and all cards
  const searchInput = document.querySelector(".search-form input");
  const cards = document.querySelectorAll(".card");
  
  // Add an event listener to the search input for the "keyup" event
  searchInput.addEventListener("keyup", function () {
    const query = this.value.toLowerCase(); // Get the search query in lowercase
    cards.forEach(card => {
    // Get the title and text content of each card in lowercase
    const title = card.querySelector(".card-title").textContent.toLowerCase();
    const text = card.querySelector(".card-text").textContent.toLowerCase();
    // Check if the query matches the title or text
    const match = title.includes(query) || text.includes(query);
    // Show or hide the card based on the match
    card.parentElement.style.display = match ? "block" : "none";
    });
  });
  });

  // Function to scroll the carousel by a specific direction
  function scrollCarousel(direction) {
  const carousel = document.getElementById('cardCarousel'); // Get the carousel element
  const scrollAmount = 300; // Amount to scroll with each arrow click
  carousel.scrollBy({
    left: scrollAmount * direction, // Scroll horizontally based on direction
    behavior: 'smooth' // smooth scroll effect
  });
  }

  // Get the carousel element and all cards inside it
  const carousel = document.getElementById('cardCarousel');
  const cards = carousel.querySelectorAll('.card');
  const cardWidth = cards[0].offsetWidth + 16; // Calculate the width of a card including the gap
  const cardCount = cards.length; // Total number of cards
  let currentIndex = 0; // Track the current index of the visible card

  // Function to scroll the carousel to a specific card
  function scrollCarousel(direction) {
  const totalCards = cards.length; // Total number of cards
  currentIndex += direction; // Update the current index based on direction

  // Loop logic to wrap around the carousel
  if (currentIndex < 0) {
    currentIndex = totalCards - 1; // Go to the last card if scrolling left from the first card
  } else if (currentIndex >= totalCards) {
    currentIndex = 0; // Go to the first card if scrolling right from the last card
  }

  // Scroll smoothly to the target card
  carousel.scrollTo({
    left: currentIndex * cardWidth, // Calculate the scroll position based on card width
    behavior: 'smooth' // Smooth scroll effect
  });
  }

  // Function to fetch popular shows from the API
async function fetchPopularShows() {
  const response = await fetch('https://api.tvmaze.com/shows');
  const shows = await response.json();

  const carousel = document.getElementById('cardCarousel');
  carousel.innerHTML = ''; // Clear current content

  shows.slice(0, 10).forEach(show => {
    const card = document.createElement('div');
    card.className = 'card';
    card.style.cursor = 'pointer'; // Make it clear it's clickable

    const image = show.image ? show.image.medium : 'https://via.placeholder.com/200x300';

    card.innerHTML = `
      <img src="${image}" class="card-img-top" alt="${show.name}" />
      <div class="card-body text-center">
      </div>
    `;

    // On click, go to show details page with show ID in query string
    card.addEventListener('click', () => {
      window.location.href = `show-info.html?id=${show.id}`;
    });

    carousel.appendChild(card);
  });
}


  // Function to scroll the carousel by a specific direction
  function scrollCarousel(direction) {
    const carousel = document.getElementById('cardCarousel'); // Get the carousel element
    const scrollAmount = 300; // Amount to scroll with each arrow click
    carousel.scrollBy({ 
      left: scrollAmount * direction, // Scroll horizontally based on direction
      behavior: 'smooth' // Smooth scroll effect
    });
  }

  // Fetch popular shows from the API when the DOM is fully loaded
  document.addEventListener('DOMContentLoaded', fetchPopularShows);
