document.addEventListener('DOMContentLoaded', () => {
  let allItems = []; // Store all items
  let currentPage = 1;
  const itemsPerPage = 12;
  let filteredItems = [];

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

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    itemsToDisplay.forEach(item => {
        const cardDiv = createItemCard(item);
        itemsRow.appendChild(cardDiv);
    });

    updatePaginationUI();
    updateTotalItemsCount();
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

    if (item.type === 'Vehicle') color = '#c82c2c';
    if (item.type === 'Spoiler') color = '#C18800';
    if (item.type === 'Textures') color = '#FFFFFF';

    const image_type = item.type.toLowerCase();
    const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp`;
    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);

    cardDiv.innerHTML = `
<div class="card items-card shadow-sm" onclick="handleCardClick('${item.name}')" style="cursor: pointer;">
  <img onerror="handleimage(this)" id="${item.name}" src="${image_url}" class="card-img-top" alt="${item.name}" style="width: 100%; height: auto; object-fit: contain;">
  <div class="card-body text-center">
    <span style="background-color: ${color}" class="badge">${item.type}</span>
    <h5 class="card-title">${item.name}</h5>
    <p class="card-text" style="color: #00ff00">Cash Value: ${value}</p>
    <p class="card-text" style="color: #FF0000">Duped Value: ${duped_value}</p>
  </div>
</div>`;

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
    const minCharacters = 3;
    const itemsContainer = document.querySelector('#items-container');
    const searchMessages = document.getElementById('search-messages');

    // Remove any existing feedback messages
    if (searchMessages) {
        searchMessages.innerHTML = '';
    }

    if (searchTerm.length === 0) {
        filteredItems = shuffleArray([...allItems]);
        searchBar.classList.remove('is-invalid');
        
        // Ensure the row structure exists
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

    if (searchTerm.length < minCharacters) {
        if (searchMessages) {
            searchMessages.innerHTML = `
                <div class="search-feedback">
                    Please enter at least ${minCharacters} characters to search
                </div>
            `;
        }
        return;
    }

    searchBar.classList.remove('is-invalid');
    filteredItems = allItems.filter(item => 
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
        itemsRow.innerHTML = `
            
            <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 300px;">
                <div class="no-results">
                    <h4>No items found for "${searchTerm}"</h4>
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

    console.log('Sort Value:', sortValue);
    console.log('Sort Type:', sortType);
    console.log('Item Type:', itemType);

    if (itemType === 'all-items') {
        // Shuffle the array when showing all items
        filteredItems = shuffleArray([...allItems]);
    } else {
        filteredItems = allItems.filter(item => 
            item.type.toLowerCase() === itemType.slice(0, -1)
        );
    }

    currentPage = 1;
    displayItems();
    setupPagination();
  }

  loadItems(); // Initial load
});


// Default Image
function handleimage(element) {
  element.src = 'https://cdn.jailbreakchangelogs.xyz/backgrounds/background1.webp';
}

function handleCardClick(itemName) {
  window.location.href =  '/item/' + itemName.toLowerCase();
}