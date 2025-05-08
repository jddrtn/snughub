  // People page
  document.addEventListener('DOMContentLoaded', () => {
    // Fetch the list of people from the TVMaze API
    fetch('https://api.tvmaze.com/people?page=0')
      .then(response => response.json())  // Parse the response as JSON
      .then(data => {
        const container = document.getElementById('people');  // Get the people container
  
        // Loop through each person and create a div for each
        data.forEach(person => {
          const personDiv = document.createElement('div');  // Create a new div for each person
          personDiv.classList.add('person');  // Add 'person' class for styling
  
          // Add the person's name and image (if available)
          personDiv.innerHTML = `
            <h3>${person.name}</h3>
            ${person.image ? `<img src="${person.image.medium}" alt="${person.name}">` : '<p>No image</p>'}
          `;
  
          // Append the person div to the container
          container.appendChild(personDiv);
        });
      })
      .catch(error => {
        // Log any errors to the console
        console.error('Error fetching data:', error);
      });
  });