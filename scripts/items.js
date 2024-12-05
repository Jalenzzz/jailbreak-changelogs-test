document.addEventListener('DOMContentLoaded', () => {
  async function loadItems() {
    try {
      const response = await fetch('https://api.jailbreakchangelogs.xyz/items/list');
      const data = await response.json();
  
      // Shuffle the data before doing any async processing
      shuffleArray(data);
  
      const itemsContainer = document.querySelector('#items-container .row');
  
      // Process each item asynchronously
      for (const item of data) {
        // Create the card element structure
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('col-md-4', 'col-lg-3', 'mb-4');
        let color = '#124E66';
  
        if (item.type === 'Vehicle') {
          color = '#c82c2c';
        }
        if (item.type === 'Spoiler') {
          color = '#C18800';
        }
  
        const image_type = item.type.toLowerCase();
        let image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp`;
  
        // Check if the image exists before setting it
        const exists = await checkImageExists(image_url);
        if (!exists) {
          image_url = 'https://cdn.jailbreakchangelogs.xyz/backgrounds/background1.webp'; // Fallback URL
        }
  
        // Create the card's inner HTML
        cardDiv.innerHTML = `
          <div class="card shadow-sm">
            <img src="${image_url}" class="card-img-top" alt="${item.name}">
            <div class="card-body text-center">
              <span style="background-color: ${color}" class="badge">${item.type}</span>
              <h5 class="card-title">${item.name}</h5>
              <p class="card-text">Value: ${item.value}</p>
            </div>
          </div>
        `;
  
        // Append the created card to the items container
        itemsContainer.appendChild(cardDiv);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }
  
  // Helper function to check if an image exists
  async function checkImageExists(url) {
    try {
      const response = await fetch(url, { method: 'HEAD' }); // Use 'HEAD' to check headers without fetching the full content
      return response.ok; // If status is OK (200), it exists
    } catch {
      return false; // If there was an error (e.g., network issue), assume it doesn't exist
    }
  }
  
  // Shuffle function to randomize the order
  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1)); // Random index
      [arr[i], arr[j]] = [arr[j], arr[i]]; // Swap elements
    }
  }

  loadItems(); // Load items once the DOM is ready
});
