document.addEventListener("DOMContentLoaded", () => {
  const itemsContainer = document.querySelector("#items-container");
  if (!itemsContainer) return;

  let allItems = []; // Store all items
  let currentPage = 1;
  const itemsPerPage = 12;
  let filteredItems = [];
  let isLoading = false;

  showSkeletonCards();

  // Create and append spinner
  const spinner = document.createElement("div");
  spinner.className = "loading-spinner";
  spinner.innerHTML = `
     <div class="spinner-border" role="status">
       <span class="visually-hidden">Loading...</span>
     </div>
   `;
  itemsContainer.appendChild(spinner);

  const observer = new IntersectionObserver(
    (entries) => {
      const lastEntry = entries[0];
      if (lastEntry.isIntersecting && !isLoading) {
        loadMoreItems();
      }
    },
    {
      rootMargin: "100px", // Start loading 100px before reaching bottom
    }
  );

  const backToTopButton = document.getElementById("back-to-top");
  // Show button when scrolling down 300px
  window.addEventListener("scroll", () => {
    if (window.scrollY > 300) {
      backToTopButton.style.display = "flex";
    } else {
      backToTopButton.style.display = "none";
    }
  });

  // Scroll to top when button is clicked
  backToTopButton.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // Function to load more items
  async function loadMoreItems() {
    if (isLoading) return;

    const startIndex = currentPage * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    // Check if there are more items to load
    if (startIndex >= filteredItems.length) {
      return; // No more items to load
    }

    isLoading = true;

    // Show spinner only if there are more items to load
    const spinner = document.querySelector(".loading-spinner");
    if (spinner && endIndex < filteredItems.length) {
      spinner.style.display = "block";
    }

    await new Promise((resolve) => setTimeout(resolve, 800)); // 800ms delay

    currentPage++;
    const itemsRow = document.querySelector("#items-container .row");
    const newItems = filteredItems.slice(startIndex, endIndex);

    newItems.forEach((item) => {
      const cardDiv = createItemCard(item);
      itemsRow.appendChild(cardDiv);
    });

    // Hide spinner
    if (spinner) {
      spinner.style.display = "none";
    }
    isLoading = false;
  }

  // Reset sort dropdown to "All Items"
  const sortDropdown = document.getElementById("sort-dropdown");
  if (sortDropdown) {
    sortDropdown.value = "name-all-items";
    localStorage.removeItem("lastSort"); // Clear any stored sort preference
  }

  updateSearchPlaceholder();

  // Clear search input
  const searchBar = document.getElementById("search-bar");
  const clearButton = document.getElementById("clear-search");
  if (searchBar) {
    searchBar.value = "";
    // Add event listener for showing/hiding clear button
    searchBar.addEventListener("input", function () {
      if (clearButton) {
        clearButton.style.display = this.value.length > 0 ? "block" : "none";
      }
    });
  }
  async function loadItems() {
    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/items/list"
      );
      allItems = await response.json();
      filteredItems = shuffleArray([...allItems]); // Shuffle on initial load
      displayItems();
      updateTotalItemsCount();
      updateTotalItemsLabel("all-items");

      preloadItemImages();
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }

  function showSkeletonCards() {
    const itemsContainer = document.querySelector("#items-container");
    if (!itemsContainer) return;

    let itemsRow = itemsContainer.querySelector(".row");
    if (!itemsRow) {
      itemsRow = document.createElement("div");
      itemsRow.classList.add("row");
      itemsContainer.appendChild(itemsRow);
    }

    // Create 12 skeleton cards
    const skeletonCards = Array(12)
      .fill(null)
      .map(() => {
        const cardDiv = document.createElement("div");
        cardDiv.classList.add("col-md-4", "col-lg-3", "mb-4");
        cardDiv.innerHTML = `
        <div class="card items-card shadow-sm" style="cursor: pointer; height: 450px; position: relative;">
          <div class="media-container" style="position: relative;">
            <div class="skeleton-loader" style="width: 100%; height: 250px; border-radius: 8px 8px 0 0;"></div>
          </div>
          <span style="
            background-color: #2E3944; 
            position: absolute;
            top: 234px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 2;
            font-size: 0.95rem;
            padding: 0.4rem 0.8rem;
            width: 100px;
            animation: pulse 2s infinite ease-in-out;
          " class="badge"></span>
          <div class="item-card-body text-center" style="padding-top: 32px;">
            <h5 class="card-title" style="visibility: hidden;">Placeholder</h5>
            <div class="value-container" style="visibility: hidden;">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <span>Cash Value:</span>
                <span>0</span>
              </div>
              <div class="d-flex justify-content-between align-items-center">
                <span>Duped Value:</span>
                <span>0</span>
              </div>
            </div>
          </div>
        </div>
      `;
        return cardDiv;
      });

    itemsRow.innerHTML = "";
    itemsRow.append(...skeletonCards);
  }

  function updateTotalItemsCount() {
    const totalItemsElement = document.getElementById("total-items");
    if (totalItemsElement) {
      totalItemsElement.textContent = filteredItems.length;
    }
  }

  function addSentinel() {
    const sentinel = document.createElement("div");
    sentinel.className = "sentinel";
    sentinel.style.height = "1px";
    const itemsContainer = document.querySelector("#items-container");
    itemsContainer.appendChild(sentinel);
    return sentinel;
  }

  function displayItems() {
    const itemsContainer = document.querySelector("#items-container");
    if (!itemsContainer) return;

    let itemsRow = itemsContainer.querySelector(".row");
    if (!itemsRow || currentPage === 1) {
      // Only create new row if it doesn't exist or if we're on first page
      itemsRow = document.createElement("div");
      itemsRow.classList.add("row");
      itemsContainer.innerHTML = ""; // Clear container
      itemsContainer.appendChild(itemsRow);
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    itemsToDisplay.forEach((item) => {
      const cardDiv = createItemCard(item);
      itemsRow.appendChild(cardDiv);
    });

    // Remove old sentinel if exists
    const oldSentinel = itemsContainer.querySelector(".sentinel");
    if (oldSentinel) {
      oldSentinel.remove();
    }

    // Add new sentinel if there are more items to load
    if (endIndex < filteredItems.length) {
      const sentinel = addSentinel();
      observer.observe(sentinel);
    }

    updateTotalItemsCount();
  }

  function loadimage(image_url) {
    if (image_url) {
      const image = new Image();
      image.src = image_url;
    }
  }

  function formatValue(value) {
    if (isNaN(value) || value === 0 || value === null || value === undefined) {
      return value; // Return the value as-is if it's not a number
    }

    // Convert the value to a number, then format it with commas
    return value.toLocaleString();
  }

  function createItemCard(item) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("col-md-4", "col-lg-3", "mb-4");
    let color = "#124E66";

    // Determine color based on item type
    if (item.type === "Vehicle") color = "#c82c2c";
    if (item.type === "Spoiler") color = "#C18800";
    if (item.type === "Rim") color = "#6335B1";
    if (item.type === "Tire Sticker") color = "#1CA1BD";
    if (item.type === "Drift") color = "#FF4500";
    if (item.type === "Color") color = "#8A2BE2";
    if (item.type === "Texture") color = "#708090";

    // Determine the image type and URL
    const image_type = item.type.toLowerCase();
    const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}`;

    let mediaElement = "";
    if (item.type === "Drift") {
      mediaElement = `
      <div class="media-container">
        <div class="skeleton-loader"></div>
        <img 
          src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/thumbnails/${item.name}.webp"
          class="card-img-top thumbnail"
          alt="${item.name}"
          onerror="handleimage(this)"
        >
        <video 
          src="https://cdn.jailbreakchangelogs.xyz/images/items/drifts/${item.name}.webm"
          class="card-img-top video-player"
          playsinline 
          muted 
          loop
          onloadeddata="this.parentElement.querySelector('.skeleton-loader').style.display='none'"
        ></video>
      </div>`;
    } else {
      mediaElement = `
        <div class="media-container">
        <div class="skeleton-loader"></div>
        <img 
          onerror="handleimage(this)" 
          id="${item.name}" 
          src="${image_url}.webp" 
          class="card-img-top" 
          alt="${item.name}" 
          onload="this.style.opacity='1'; this.previousElementSibling.style.display='none'"
        >
      </div>`;
    }

    // Format values
    const value = formatValue(item.cash_value);
    const duped_value = formatValue(item.duped_value);

    // Create card
    cardDiv.innerHTML = `
    <div class="card items-card shadow-sm" onclick="handleCardClick('${
      item.name
    }', '${item.type.toLowerCase()}')" style="cursor: pointer;">
      ${mediaElement}
      <span class="badge item-type-badge" style="background-color: ${color};">${
      item.type
    }</span>
      <div class="item-card-body text-center">
        <h5 class="card-title">${item.name}</h5>
        <div class="value-container">
          <div class="d-flex justify-content-between align-items-center mb-2 value-row">
            <span>Cash Value:</span>
            <span class="cash-value">${value}</span>
          </div>
          <div class="d-flex justify-content-between align-items-center value-row">
            <span>Duped Value:</span>
            <span class="duped-value">${duped_value}</span>
          </div>
        </div>
      </div>
    </div>`;

    // Add hover event listeners for drift videos
    if (item.type === "Drift") {
      const card = cardDiv.querySelector(".card");
      const video = cardDiv.querySelector("video");

      card.addEventListener("mouseenter", () => {
        video.style.opacity = "1";
        video.play();
      });

      card.addEventListener("mouseleave", () => {
        video.style.opacity = "0";
        video.pause();
        video.currentTime = 0;
      });
    }

    return cardDiv;
  }

  window.filterItems = function () {
    const searchTerm = document
      .getElementById("search-bar")
      .value.toLowerCase();
    const searchBar = document.getElementById("search-bar");
    const sortValue = document.getElementById("sort-dropdown").value;

    const itemsContainer = document.querySelector("#items-container");
    const searchMessages = document.getElementById("search-messages");

    // Remove any existing feedback messages
    if (searchMessages) {
      searchMessages.innerHTML = "";
    }

    // First, apply category filter
    let categoryFilteredItems = [...allItems];
    if (sortValue !== "name-all-items") {
      const parts = sortValue.split("-");
      const itemType = parts.slice(1).join("-");
      categoryFilteredItems = allItems.filter((item) => {
        const normalizedItemType = item.type.toLowerCase().replace(" ", "-");
        const normalizedFilterType = itemType.slice(0, -1);
        return normalizedItemType === normalizedFilterType;
      });
    }

    if (searchTerm.length === 0) {
      filteredItems = categoryFilteredItems;
      searchBar.classList.remove("is-invalid");

      let itemsRow = itemsContainer.querySelector(".row");
      if (!itemsRow) {
        itemsRow = document.createElement("div");
        itemsRow.classList.add("row");
        itemsContainer.appendChild(itemsRow);
      }
      const itemType = sortValue.split("-").slice(1).join("-");
      updateTotalItemsLabel(itemType);
      currentPage = 1;
      displayItems();
      updateTotalItemsCount();
      return;
    }

    // Check if current category is Rims
    const isRimsCategory = sortValue === "name-rims";
    const minCharacters = isRimsCategory ? 1 : 3;

    if (searchTerm.length < minCharacters) {
      if (searchMessages) {
        searchMessages.innerHTML = `
                <div class="search-feedback">
                    Please enter at least ${minCharacters} character${
          minCharacters > 1 ? "s" : ""
        } to search
                </div>
            `;
      }
      return;
    }

    searchBar.classList.remove("is-invalid");
    filteredItems = categoryFilteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );

    // No results message if no items found
    if (filteredItems.length === 0) {
      let itemsRow = itemsContainer.querySelector(".row");
      if (!itemsRow) {
        itemsRow = document.createElement("div");
        itemsRow.classList.add("row");
        itemsContainer.appendChild(itemsRow);
      }

      const sortValue = document.getElementById("sort-dropdown").value;
      const categoryParts = sortValue.split("-");
      const categoryName = categoryParts.slice(1).join(" ");
      const categoryMessage =
        sortValue !== "name-all-items"
          ? ` under category "${categoryName.replace(/-/g, " ")}"`
          : "";

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
    updateTotalItemsCount();
  };

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  window.sortItems = function () {
    const sortValue = document.getElementById("sort-dropdown").value;
    updateSearchPlaceholder();
    const parts = sortValue.split("-");
    const sortType = parts[0];
    const itemType = parts.slice(1).join("-");

    // Clear search bar when switching categories
    if (searchBar) {
      searchBar.value = "";
    }

    // Clear localStorage if "All Items" is selected, otherwise store the current value
    if (itemType === "all-items") {
      localStorage.removeItem("lastSort");
    } else {
      localStorage.setItem("lastSort", sortValue);
    }

    if (itemType === "all-items") {
      // Shuffle the array when showing all items
      filteredItems = shuffleArray([...allItems]);
    } else {
      filteredItems = allItems.filter((item) => {
        const normalizedItemType = item.type.toLowerCase().replace(" ", "-");
        const normalizedFilterType = itemType.slice(0, -1);
        return normalizedItemType === normalizedFilterType;
      });
    }

    // Handle empty category case
    if (filteredItems.length === 0) {
      const itemsContainer = document.querySelector("#items-container");
      let itemsRow = itemsContainer.querySelector(".row");
      if (!itemsRow) {
        itemsRow = document.createElement("div");
        itemsRow.classList.add("row");
        itemsContainer.appendChild(itemsRow);
      }

      // Get category name for display
      const categoryName = itemType
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      itemsRow.innerHTML = `
              <div class="col-12 d-flex justify-content-center align-items-center" style="min-height: 300px;">
                  <div class="no-results text-center">
                      <h4>No items available under ${categoryName}</h4>
                      <p class="text-muted">This category is currently empty. Please check back later.</p>
                  </div>
              </div>
          `;

      // Update total items count to 0
      const totalItemsElement = document.getElementById("total-items");
      if (totalItemsElement) {
        totalItemsElement.textContent = "0";
      }

      // Clear pagination
      const paginationContainer = document.getElementById(
        "pagination-container"
      );
      if (paginationContainer) {
        paginationContainer.style.display = "none";
      }

      return;
    }

    // Reset pagination container display if it was hidden
    const paginationContainer = document.getElementById("pagination-container");
    if (paginationContainer) {
      paginationContainer.style.display = "";
    }

    updateTotalItemsLabel(itemType);
    currentPage = 1;
    displayItems();
  };

  function preloadItemImages() {
    if (!allItems || allItems.length === 0) {
      return;
    }

    const imagePromises = [];

    for (const item of allItems) {
      if (item.type.toLowerCase() === "drift") continue;

      const image_type = item.type.toLowerCase();
      const image_url = `https://cdn.jailbreakchangelogs.xyz/images/items/${image_type}s/${item.name}.webp`;

      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          resolve(image_url);
        };
        img.onerror = () => {
          reject(image_url);
        };
        img.src = image_url;
      });

      imagePromises.push(promise);
    }

    Promise.allSettled(imagePromises).then((results) => {
      const loaded = results.filter((r) => r.status === "fulfilled").length;
      const failed = results.filter((r) => r.status === "rejected").length;
    });
  }

  loadItems(); // Initial load
  // Preload images for better performance
});

// Default Image
function handleimage(element) {
  element.src = "https://cdn.jailbreakchangelogs.xyz/logos/Jailbreak_Logo.webp";
}

function clearSearch() {
  const searchBar = document.getElementById("search-bar");
  const clearButton = document.getElementById("clear-search");

  if (searchBar) {
    searchBar.value = "";
    filterItems();
  }

  if (clearButton) {
    clearButton.style.display = "none";
  }
}

function updateTotalItemsLabel(itemType) {
  const totalItemsLabel = document.getElementById("total-items-label");
  if (totalItemsLabel) {
    if (itemType === "all-items") {
      totalItemsLabel.textContent = "Total Items: ";
    } else {
      const categoryName = itemType
        .slice(0, -1)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      totalItemsLabel.textContent = `Total ${categoryName}s: `;
    }
  }
}

function updateSearchPlaceholder() {
  const sortValue = document.getElementById("sort-dropdown").value;
  const searchBar = document.getElementById("search-bar");

  // Extract category from sort value (e.g., 'name-vehicles' -> 'vehicles')
  const category = sortValue.split("-").slice(1).join("-");

  // Define placeholders for different categories
  const placeholders = {
    "all-items": "Search items...",
    vehicles: "Search vehicles (e.g., Brulee, Torpedo)...",
    spoilers: "Search spoilers (e.g., Rocket, Wing)...",
    rims: "Search rims (e.g., Star, Spinner)...",
    "tire-stickers": "Search tire stickers (e.g., Badonuts, Blue 50)...",
    drifts: "Search drifts... (e.g., Cartoon, Melons)...",
    "body-colors": "Search colors (e.g., Red, Blue)...",
    textures: "Search textures (e.g., Aurora, Checkers)...",
  };

  // Set the placeholder text
  searchBar.placeholder = placeholders[category] || "Search items...";
}

window.handleCardClick = function (name, type) {
  const formattedName = encodeURIComponent(name);
  const formattedType = encodeURIComponent(type.toLowerCase());
  const url = `/item/${formattedType}/${formattedName}`;
  window.location.href = url;
};
