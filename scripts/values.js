document.addEventListener('DOMContentLoaded', () => {
  let allItems = []; // Store all items
  let currentPage = 1;
  const itemsPerPage = 12;
  let filteredItems = [];

  // Reset sort dropdown to "All Items"
  const sortDropdown = document.getElementById('sort-dropdown');
  if (sortDropdown) {
      sortDropdown.value = 'name-all-items';
      localStorage.removeItem('lastSort'); // Clear any stored sort preference
  }

  // Clear search input
  const searchBar = document.getElementById('search-bar');
  if (searchBar) {
      searchBar.value = '';
  }

  async function loadItems() {
    try {
      const response = await fetch('https://api.jailbreakchangelogs.xyz/items/list');
      allItems = await response.json();
      filteredItems = shuffleArray([...allItems]); // Shuffle on initial load
      displayItems();
      setupPagination();
      updateTotalItemsCount();
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  }

  function updateTotalItemsCount() {
    const totalItemsElement = document.getElementById('total-items');
    if (totalItemsElement) {
        totalItemsElement.textContent = filteredItems.length;
    }
}


  function displayItems() {
    const itemsContainer = document.querySelector('#items-container');
    if (!itemsContainer) return;

    // Ensure the row exists or create it
    let itemsRow = itemsContainer.querySelector('.row');
    if (!itemsRow) {
        itemsRow = document.createElement('div');
        itemsRow.classList.add('row');
        itemsContainer.appendChild(itemsRow);
    }

    itemsRow.innerHTML = ''; // Clear existing items
    itemstoadd = [];

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    itemsToDisplay.forEach(item => {
        const cardDiv = createItemCard(item);
        itemstoadd.push(cardDiv);
    });
    itemsRow.append(...itemstoadd); // Add new items to the row

    updatePaginationUI();
    updateTotalItemsCount();
}

function loadimage(image_url) {
  if(image_url) {
    const image = new Image();
    image.src = image_url;
  }
}

function formatValue(value) {
  console.log('Formatting value:', value);
  if (isNaN(value) || value === 0 || value === null || value === undefined) {
    return value; // Return the value as-is if it's not a number
  }
  
  // Convert the value to a number, then format it with commas
  return value.toLocaleString();
}
  
function createItemCard(item) {
  const cardDiv = document.createElement('div');
  cardDiv.classList.add('col-md-4', 'col-lg-3', 'mb-4');
  let color = '#124E66';

  // Determine color based on item type
  if (item.type === 'Vehicle') color = '#c82c2c';
  if (item.type === 'Spoiler') color = '#C18800';
  if (item.type === 'Rim') color = '#6335B1';
  if (item.type === 'Tire Sticker') color = '#1CA1BD';
  if (item.type === 'Drift') color = '#FF4500';
  if (item.type === 'Color') color = '#8A2BE2';
  if (item.type === 'Texture') color = '#708090';

  // Determine the image type and URL
  const image_type = item.type.toLowerCase();
  const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}`;

  let element = '';
  if (item.type === 'Drift') {
    element = `
      <div class="media-container" style="position: relative;">
        <img 
          src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/thumbnails/${item.name}.webp"
          class="card-img-top thumbnail"
          alt="${item.name}"
          style="width: 100%; height: 250px; object-fit: cover;"
          onerror="handleimage(this)"
        >
        <video 
          src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/${item.name}.webm"
          class="card-img-top video-player"
          style="width: 100%; height: 250px; object-fit: cover; position: absolute; top: 0; left: 0; opacity: 0; transition: opacity 0.3s ease;"
          playsinline 
          muted 
          loop
        ></video>
      </div>`;
  } else {
    element = `<img 
      onerror="handleimage(this)" 
      id="${item.name}" 
      src="${image_url}.webp" 
      class="card-img-top" 
      alt="${item.name}" 
      style="width: 100%; height: 250px; object-fit: cover;">`;
  }

  // Format values
  const value = formatValue(item.cash_value);
  const duped_value = formatValue(item.duped_value);

  // Create card
  cardDiv.innerHTML = `
  <div class="card items-card shadow-sm" onclick="handleCardClick('${item.name}')" style="cursor: pointer; height: 450px; position: relative;">
    ${element}
    <span style="
      background-color: ${color}; 
      position: absolute;
      top: 234px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 2;
      font-size: 0.95rem;
      padding: 0.4rem 0.8rem;
    " class="badge">${item.type}</span>
    <div class="item-card-body text-center" style="padding-top: 32px;">
      <h5 class="card-title">${item.name}</h5>
      <div class="value-container">
        <div class="d-flex justify-content-between align-items-center mb-2" style="padding: 4px 8px; background: rgba(0, 255, 0, 0.1); border-radius: 4px;">
          <span>Cash Value:</span>
          <span style="color: #00aa00; font-weight: bold;">${value}</span>
        </div>
        <div class="d-flex justify-content-between align-items-center" style="padding: 4px 8px; background: rgba(255, 0, 0, 0.1); border-radius: 4px;">
          <span>Duped Value:</span>
          <span style="color: #aa0000; font-weight: bold;">${duped_value}</span>
        </div>
      </div>
    </div>
  </div>`;

  // Add hover event listeners for drift videos
  if (item.type === 'Drift') {
    const card = cardDiv.querySelector('.card');
    const video = cardDiv.querySelector('video');
    
    card.addEventListener('mouseenter', () => {
      video.style.opacity = '1';
      video.play();
    });

    card.addEventListener('mouseleave', () => {
      video.style.opacity = '0';
      video.pause();
      video.currentTime = 0;
    });
  }

  return cardDiv;
}

  function updatePaginationUI() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    const currentPageInput = document.getElementById('currentPageInput');
    
    // Ensure current page is within valid range
    if (currentPage > totalPages) {
      currentPage = totalPages || 1;
    }
    
    // Update current page display
    currentPageInput.value = currentPage;

    // Enable/disable pagination buttons
    document.getElementById('firstPageBtn').disabled = currentPage === 1;
    document.getElementById('prevPageBtn').disabled = currentPage === 1;
    document.getElementById('nextPageBtn').disabled = currentPage >= totalPages;
    document.getElementById('lastPageBtn').disabled = currentPage >= totalPages;
  }

  function setupPagination() {
    const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
    
    // Remove existing event listeners
    const paginationContainer = document.getElementById('pagination-container');
    const newPaginationContainer = paginationContainer.cloneNode(true);
    paginationContainer.parentNode.replaceChild(newPaginationContainer, paginationContainer);

    const currentPageInput = document.getElementById('currentPageInput');

    document.getElementById('firstPageBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage !== 1) {
        currentPage = 1;
        displayItems();
      }
    });

    document.getElementById('prevPageBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) {
        currentPage--;
        displayItems();
      }
    });

    document.getElementById('nextPageBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) {
        currentPage++;
        displayItems();
      }
    });

    document.getElementById('lastPageBtn').addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage !== totalPages) {
        currentPage = totalPages;
        displayItems();
      }
    });

    currentPageInput.addEventListener('change', () => {
      let newPage = parseInt(currentPageInput.value);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        displayItems();
      } else {
        currentPageInput.value = currentPage;
      }
    });

    updatePaginationUI();
  }

  window.filterItems = function() {
    const searchTerm = document.getElementById('search-bar').value.toLowerCase();
    const searchBar = document.getElementById('search-bar');
    const sortValue = document.getElementById('sort-dropdown').value;

    const itemsContainer = document.querySelector('#items-container');
    const searchMessages = document.getElementById('search-messages');

    // Remove any existing feedback messages
    if (searchMessages) {
        searchMessages.innerHTML = '';
    }

    // First, apply category filter
    let categoryFilteredItems = [...allItems];
    if (sortValue !== 'name-all-items') {
        const parts = sortValue.split('-');
        const itemType = parts.slice(1).join('-');
        categoryFilteredItems = allItems.filter(item => {
            const normalizedItemType = item.type.toLowerCase().replace(' ', '-');
            const normalizedFilterType = itemType.slice(0, -1);
            return normalizedItemType === normalizedFilterType;
        });
    }

    if (searchTerm.length === 0) {
        filteredItems = categoryFilteredItems;
        searchBar.classList.remove('is-invalid');
        
        let itemsRow = itemsContainer.querySelector('.row');
        if (!itemsRow) {
            itemsRow = document.createElement('div');
            itemsRow.classList.add('row');
            itemsContainer.appendChild(itemsRow);
        }
        
        currentPage = 1;
        displayItems();
        setupPagination();
        updateTotalItemsCount();
        return;
    }

    // Check if current category is Rims
    const isRimsCategory = sortValue === 'name-rims';
    const minCharacters = isRimsCategory ? 1 : 3;

    if (searchTerm.length < minCharacters) {
        if (searchMessages) {
            searchMessages.innerHTML = `
                <div class="search-feedback">
                    Please enter at least ${minCharacters} character${minCharacters > 1 ? 's' : ''} to search
                </div>
            `;
        }
        return;
    }

    searchBar.classList.remove('is-invalid');
    filteredItems = categoryFilteredItems.filter(item => 
        item.name.toLowerCase().includes(searchTerm)
    );

    // No results message if no items found
    if (filteredItems.length === 0) {
        let itemsRow = itemsContainer.querySelector('.row');
        if (!itemsRow) {
            itemsRow = document.createElement('div');
            itemsRow.classList.add('row');
            itemsContainer.appendChild(itemsRow);
        }

        const sortValue = document.getElementById('sort-dropdown').value;
        const categoryParts = sortValue.split('-');
        const categoryName = categoryParts.slice(1).join(' ');
        const categoryMessage = sortValue !== 'name-all-items' 
            ? ` under category "${categoryName.replace(/-/g, ' ')}"`
            : '';

        itemsRow.innerHTML = `
            <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 300px;">
                <div class="no-results">
                    <h4>No items found for "${searchTerm}"${categoryMessage}</h4>
                    <p class="text-muted">Try different keywords or check the spelling</p>
                </div>
            </div>
        `;
        return;
    }

    currentPage = 1;
    displayItems();
    setupPagination();
    updateTotalItemsCount();
}

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

    window.sortItems = function() {
      const sortValue = document.getElementById('sort-dropdown').value;
      const parts = sortValue.split('-');
      const sortType = parts[0];
      const itemType = parts.slice(1).join('-');
      
      // Clear search bar when switching categories
      if (searchBar) {
          searchBar.value = '';
      }

      // Clear localStorage if "All Items" is selected, otherwise store the current value
      if (itemType === 'all-items') {
          localStorage.removeItem('lastSort');
      } else {
          localStorage.setItem('lastSort', sortValue);
      }

      if (itemType === 'all-items') {
          // Shuffle the array when showing all items
          filteredItems = shuffleArray([...allItems]);
      } else {
          filteredItems = allItems.filter(item => {
              const normalizedItemType = item.type.toLowerCase().replace(' ', '-');
              const normalizedFilterType = itemType.slice(0, -1);
              return normalizedItemType === normalizedFilterType;
          });
      }

      // Handle empty category case
      if (filteredItems.length === 0) {
          const itemsContainer = document.querySelector('#items-container');
          let itemsRow = itemsContainer.querySelector('.row');
          if (!itemsRow) {
              itemsRow = document.createElement('div');
              itemsRow.classList.add('row');
              itemsContainer.appendChild(itemsRow);
          }

          // Get category name for display
          const categoryName = itemType.split('-').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');

          itemsRow.innerHTML = `
              <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 300px;">
                  <div class="no-results text-center">
                      <h4>No items available under ${categoryName}</h4>
                      <p class="text-muted">This category is currently empty. Please check back later.</p>
                  </div>
              </div>
          `;

          // Update total items count to 0
          const totalItemsElement = document.getElementById('total-items');
          if (totalItemsElement) {
              totalItemsElement.textContent = '0';
          }

          // Clear pagination
          const paginationContainer = document.getElementById('pagination-container');
          if (paginationContainer) {
              paginationContainer.style.display = 'none';
          }

          return;
      }

      // Reset pagination container display if it was hidden
      const paginationContainer = document.getElementById('pagination-container');
      if (paginationContainer) {
          paginationContainer.style.display = '';
      }

      currentPage = 1;
      displayItems();
      setupPagination();
    }

    function preloadItemImages() {
      for (const item of allItems) {
        const image_type = item.type.toLowerCase();
        const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}`;
        
        // Check if the item type is 'drift', if it is, skip the current iteration
        if (item.type === 'drift') {
          continue; // Skip this item and move to the next one
        } else {
          console.log('preloading' + item.name)
          const img = new Image();
          img.src = image_url; // Preload the image
        }
      }
    }

    loadItems(); // Initial load
    // Preload images for better performance
    preloadItemImages();
});

// Default Image
function handleimage(element) {
  element.src = 'https://cdn.jailbreakchangelogs.xyz/backgrounds/background1.webp';
}

function handleCardClick(itemName) {
  window.location.href =  '/item/' + itemName.toLowerCase();
}