document.addEventListener("DOMContentLoaded", function () {
    const searchInput = document.querySelector(".search-form input");
    const cards = document.querySelectorAll(".card");
  
    searchInput.addEventListener("keyup", function () {
      const query = this.value.toLowerCase();
      cards.forEach(card => {
        const title = card.querySelector(".card-title").textContent.toLowerCase();
        const text = card.querySelector(".card-text").textContent.toLowerCase();
        const match = title.includes(query) || text.includes(query);
        card.parentElement.style.display = match ? "block" : "none";
      });
    });
  });

