const VALID_SORTS = [
  "vehicles",
  "spoilers",
  "rims",
  "body-colors",
  "textures",
  "tire-stickers",
  "drifts",
  "hyperchromes",
  "furnitures",
  "limited-items",
];
// Global debounce function
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

function showLoadingOverlay() {
  $("#loading-overlay").addClass("show");
}

function hideLoadingOverlay() {
  $("#loading-overlay").removeClass("show");
}

// Global shareCurrentView function
window.shareCurrentView = debounce(function () {
  const sortDropdown = document.getElementById("sort-dropdown");
  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  const searchBar = document.getElementById("search-bar");

  // Build URL parameters - This was missing
  const params = new URLSearchParams();
  if (sortDropdown.value !== "name-all-items") {
    params.append("sort", sortDropdown.value.split("-").slice(1).join("-"));
  }
  if (valueSortDropdown.value !== "random") {
    params.append("valueSort", valueSortDropdown.value);
  }
  if (searchBar.value.trim()) {
    params.append("search", searchBar.value.trim());
  }

  // Construct full URL
  const baseUrl = `${window.location.origin}/values`;
  const shareUrl = params.toString()
    ? `${baseUrl}?${params.toString()}`
    : baseUrl;

  // Copy to clipboard
  navigator.clipboard
    .writeText(shareUrl)
    .then(() => {
      toastr.success("Link copied to clipboard!", "Share", {
        timeOut: 2000,
        closeButton: true,
        positionClass: "toast-bottom-right",
      });
    })
    .catch(() => {
      toastr.error("Failed to copy link", "Share Error", {
        timeOut: 2000,
        closeButton: true,
        positionClass: "toast-bottom-right",
      });
    });
}, 1000);

const searchBar = document.getElementById("search-bar");
const clearButton = document.getElementById("clear-search");

document.addEventListener("DOMContentLoaded", () => {
  const categoryItems = document.querySelectorAll(".category-item");

  categoryItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Map directly to sort dropdown values
      const categoryClasses = {
        "category-limited-items": "name-limited-items",
        "category-vehicles": "name-vehicles",
        "category-rims": "name-rims",
        "category-spoilers": "name-spoilers",
        "category-body-colors": "name-body-colors",
        "category-textures": "name-textures",
        "category-hyperchromes": "name-hyperchromes",
        "category-tire-stickers": "name-tire-stickers",
        "category-drifts": "name-drifts",
        "category-furnitures": "name-furnitures",
      };

      // Find the matching category class
      const categoryClass = Array.from(this.classList).find((cls) =>
        Object.keys(categoryClasses).includes(cls)
      );

      if (!categoryClass) {
        console.error("No specific category class found");
        return;
      }

      // Get the corresponding sort value
      const sortValue = categoryClasses[categoryClass];

      // Update sort dropdown and trigger sort
      const sortDropdown = document.getElementById("sort-dropdown");
      if (sortDropdown) {
        sortDropdown.value = sortValue;
        window.sortItems(); // Trigger sorting

        // Add smooth scroll to items container with offset
        const itemsContainer = document.getElementById("items-container");
        if (itemsContainer) {
          setTimeout(() => {
            // Get the filter controls element for reference
            const filterControls = document.querySelector(".filter-controls");

            // Calculate position with offset
            const offset = 150; // Adjust this value to control the padding from top
            const elementPosition = itemsContainer.getBoundingClientRect().top;
            const offsetPosition =
              elementPosition +
              window.pageYOffset -
              (filterControls.offsetHeight + offset);

            // Smooth scroll to adjusted position
            window.scrollTo({
              top: offsetPosition,
              behavior: "smooth",
            });
          }, 100);
        }
      } else {
        console.error("Sort dropdown not found");
      }
    });
  });

  const itemsContainer = document.querySelector("#items-container");
  if (!itemsContainer) return;

  let allItems = []; // Store all items
  let currentPage = 1;
  const itemsPerPage = 12;
  let filteredItems = [];
  let isLoading = false;
  let sort = ""; // Track current sort state

  // Define sortItems first before using it
  window.sortItems = function () {
    const sortDropdown = document.getElementById("sort-dropdown");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");
    const sortValue = sortDropdown?.value || "name-all-items"; // Provide default value and handle null
    const valueSortType = valueSortDropdown?.value || "cash-desc";

    const currentSort = sortValue.split("-").slice(1).join("-");

    // Save current filter states before updating anything else
    sessionStorage.setItem("sortDropdown", sortValue);
    sessionStorage.setItem("valueSortDropdown", valueSortType);
    sort = sortValue; // Update global sort variable

    // Update breadcrumb after setting state
    const categoryNameElement = document.querySelector(".category-name");
    const valuesBreadcrumb = document.getElementById("values-breadcrumb");

    if (sortValue === "name-all-items") {
      categoryNameElement.style.display = "none";
      valuesBreadcrumb.classList.add("active");
      valuesBreadcrumb.setAttribute("aria-current", "page");
      valuesBreadcrumb.innerHTML = "Values";
    } else {
      let categoryName;
      if (currentSort === "hyperchromes") {
        categoryName = "Hyperchromes";
      } else {
        categoryName = currentSort
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }

      // Make the category name a clickable link that preserves the filter
      categoryNameElement.innerHTML = `<a href="/values?sort=name-${currentSort}" onclick="handleCategoryClick(event, '${currentSort}')">${categoryName}</a>`;
      categoryNameElement.style.display = "list-item";
      categoryNameElement.classList.add("active");
      categoryNameElement.setAttribute("aria-current", "page");

      // Make Values a normal link
      valuesBreadcrumb.classList.remove("active");
      valuesBreadcrumb.removeAttribute("aria-current");
      valuesBreadcrumb.innerHTML = '<a href="/values">Values</a>';
    }

    updateSearchPlaceholder();
    const parts = sortValue.split("-");
    const sortType = parts[0];
    const itemType = parts.slice(1).join("-");

    // Clear search bar when switching categories
    if (searchBar) {
      searchBar.value = "";
    }

    // First filter by category
    if (itemType === "all-items") {
      filteredItems = [...allItems];
      localStorage.removeItem("lastSort");
    } else if (itemType === "limited-items") {
      // Filter limited items
      filteredItems = allItems.filter((item) => item.is_limited);
    } else if (sortType === "name" && itemType === "hyperchromes") {
      filteredItems = allItems.filter((item) => item.type === "HyperChrome");
    } else {
      filteredItems = allItems.filter((item) => {
        const normalizedItemType = item.type.toLowerCase().replace(" ", "-");
        const normalizedFilterType = itemType.slice(0, -1);
        return normalizedItemType === normalizedFilterType;
      });
      localStorage.setItem("lastSort", sortValue);
    }

    // handling for random sort
    if (valueSortType === "random") {
      filteredItems = shuffleArray([...filteredItems]);
    } else if (valueSortType !== "none") {
      // Then sort by value if a value sort is selected
      const [valueType, direction] = valueSortType.split("-");
      filteredItems.sort((a, b) => {
        const valueA =
          valueType === "cash"
            ? formatValue(a.cash_value).numeric
            : formatValue(a.duped_value).numeric;
        const valueB =
          valueType === "cash"
            ? formatValue(b.cash_value).numeric
            : formatValue(b.duped_value).numeric;

        return direction === "asc" ? valueA - valueB : valueB - valueA;
      });
    }

    // alphabetical sorting logic
    if (valueSortType === "alpha-asc" || valueSortType === "alpha-desc") {
      filteredItems.sort((a, b) => {
        return valueSortType === "alpha-asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      });
    }
    if (valueSortType === "demand-asc" || valueSortType === "demand-desc") {
      console.log("Starting demand sort:", valueSortType);

      // Demand order from lowest to highest
      const demandOrder = [
        "Close to none",
        "Very Low",
        "Low",
        "Decent",
        "Medium",
        "High",
        "Very High",
      ];

      filteredItems.sort((a, b) => {
        // Normalize demand values without changing case
        let demandA = a.demand === "N/A" ? "-" : a.demand || "-";
        let demandB = b.demand === "N/A" ? "-" : b.demand || "-";

        if (demandA === "-" && demandB === "-") return 0;
        if (demandA === "-") return 1;
        if (demandB === "-") return -1;

        // Get the index of each demand in our ordered array (case-insensitive)
        const indexA = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandA.toLowerCase()
        );
        const indexB = demandOrder.findIndex(
          (d) => d.toLowerCase() === demandB.toLowerCase()
        );

        // If demand value isn't in the order array, treat it as "-"
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;

        // Sort based on the index
        return valueSortType === "demand-asc"
          ? indexA - indexB
          : indexB - indexA;
      });
    }

    updateTotalItemsLabel(itemType);
    currentPage = 1;

    displayItems();
  };

  // Now check for saved sort and value sort
  const savedSort = sessionStorage.getItem("sortDropdown");
  const savedValueSort =
    sessionStorage.getItem("valueSortDropdown") || "cash-desc";

  if (savedSort || savedValueSort) {
    const sortDropdown = document.getElementById("sort-dropdown");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");

    if (sortDropdown && valueSortDropdown) {
      try {
        if (savedSort) sortDropdown.value = savedSort;
        if (savedValueSort) valueSortDropdown.value = savedValueSort;
        sort = savedSort; // Set global sort variable
        // Safely call sortItems only after setting both dropdowns
        if (typeof window.sortItems === "function") {
          window.sortItems();
        } else {
          console.error("sortItems function not properly initialized");
        }
      } catch (err) {
        console.error("Error restoring sort:", err);
      }
    }
  }

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

  // Restore filters from sessionStorage
  function restoreFilters() {
    const savedSortDropdown = sessionStorage.getItem("sortDropdown");
    const savedValueSort = sessionStorage.getItem("valueSortDropdown");

    if (savedSortDropdown) {
      document.getElementById("sort-dropdown").value = savedSortDropdown;
    }
    if (savedValueSort) {
      const valueSortDropdown = document.getElementById("value-sort-dropdown");

      valueSortDropdown.value = savedValueSort;
    }
    const savedSearch = localStorage.getItem("searchTerm");

    if (savedSortDropdown) {
      document.getElementById("sort-dropdown").value = savedSortDropdown;
    }
    if (savedValueSort) {
      document.getElementById("value-sort-dropdown").value = savedValueSort;
    }
    if (savedSearch) {
      const searchBar = document.getElementById("search-bar");
      searchBar.value = savedSearch;
      const clearButton = document.getElementById("clear-search");
      if (clearButton) {
        clearButton.style.display =
          searchBar.value.length > 0 ? "block" : "none";
      }
    }

    // Restore breadcrumb
    if (savedSortDropdown && savedSortDropdown !== "name-all-items") {
      const categoryName = savedSortDropdown
        .split("-")
        .slice(1)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      const categoryNameElement = document.querySelector(".category-name");
      categoryNameElement.textContent = categoryName;
      categoryNameElement.style.display = "list-item";
    }
  }

  // Call restoreFilters after elements are loaded
  restoreFilters();

  // Function to load more items
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

    // Show spinner when loading starts
    const spinner = document.querySelector(".loading-spinner");
    if (spinner) {
      spinner.classList.add("active");
    }

    // Add artificial delay to show loading state
    await new Promise((resolve) => setTimeout(resolve, 800));

    currentPage++;
    const itemsRow = document.querySelector("#items-container .row");
    const newItems = filteredItems.slice(startIndex, endIndex);

    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();

    // Add each new item to the fragment
    newItems.forEach((item) => {
      const cardDiv = createItemCard(item);
      fragment.appendChild(cardDiv); // Append to fragment instead of directly to itemsRow
    });

    // Append the fragment to the row (single DOM update)
    itemsRow.appendChild(fragment);

    // Hide spinner after loading completes
    if (spinner) {
      spinner.classList.remove("active");
    }
    isLoading = false;
  }

  updateSearchPlaceholder();

  // Clear search input
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
    showLoadingOverlay();
    try {
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/items/list",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );
      allItems = await response.json();
      console.log(
        "Unique demand values in dataset:",
        [...new Set(allItems.map((item) => item.demand))]
          .filter((demand) => demand !== null)
          .sort()
      );

      // Preload drift thumbnails
      const driftItems = allItems.filter((item) => item.type === "Drift");
      preloadDriftThumbnails(driftItems);

      // Get saved sort and value sort from sessionStorage
      const savedSort = sessionStorage.getItem("sortDropdown");
      const savedValueSort = sessionStorage.getItem("valueSortDropdown");

      // Set initial filtered items
      filteredItems = [...allItems];

      // Apply sorting based on saved preferences
      if (savedSort || savedValueSort) {
        const sortDropdown = document.getElementById("sort-dropdown");
        const valueSortDropdown = document.getElementById(
          "value-sort-dropdown"
        );

        if (sortDropdown && valueSortDropdown) {
          if (savedSort) sortDropdown.value = savedSort;
          if (savedValueSort) valueSortDropdown.value = savedValueSort;
          sort = savedSort;
          window.sortItems(); // This will apply both sorts
        }
      } else {
        // If no saved sorts, shuffle items
        filteredItems = shuffleArray(filteredItems);
        displayItems();
      }

      updateTotalItemsCount();
      updateTotalItemsLabel("all-items");
      preloadItemImages();
      hideLoadingOverlay();
    } catch (error) {
      console.error("Error fetching data:", error);
      hideLoadingOverlay();
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
    const spinner = itemsContainer.querySelector(".loading-spinner");

    if (!itemsRow || currentPage === 1) {
      // Save spinner if it exists
      if (spinner) {
        spinner.remove();
      }

      // Clear container but preserve structure
      itemsContainer.innerHTML = `
        <div class="row g-3" id="items-list"></div>
        <div class="loading-spinner">
          <div class="spinner-border" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      `;

      itemsRow = itemsContainer.querySelector(".row");
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

    // Create a document fragment to batch DOM updates
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < itemsToDisplay.length; i++) {
      const cardDiv = createItemCard(itemsToDisplay[i]);
      fragment.appendChild(cardDiv); // Append to fragment
    }

    // Append fragment to the row (single DOM update)
    itemsRow.appendChild(fragment);

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
    // Return default object if value is null, undefined, or empty string
    if (value === null || value === undefined || value === "") {
      return {
        display: "-",
        numeric: 0,
      };
    }

    // Convert string values like "7.5m" or "75k" to numbers
    let numericValue = value;
    if (typeof value === "string") {
      value = value.toLowerCase();
      if (value.endsWith("m")) {
        numericValue = parseFloat(value) * 1000000;
      } else if (value.endsWith("k")) {
        numericValue = parseFloat(value) * 1000;
      } else {
        numericValue = parseFloat(value);
      }
    }

    // Return default object if conversion resulted in NaN
    if (isNaN(numericValue)) {
      return {
        display: "-",
        numeric: 0,
      };
    }

    // Format display value based on screen size
    let displayValue;
    if (window.innerWidth <= 768) {
      // Mobile devices - use 2 decimal places for better precision
      if (numericValue >= 1000000) {
        displayValue =
          (numericValue / 1000000).toFixed(2).replace(/\.?0+$/, "") + "M";
      } else if (numericValue >= 1000) {
        displayValue =
          (numericValue / 1000).toFixed(2).replace(/\.?0+$/, "") + "K";
      } else {
        displayValue = numericValue.toString();
      }
    } else {
      // Desktop - use comma formatting
      displayValue = numericValue.toLocaleString("en-US");
    }

    return {
      display: displayValue,
      numeric: numericValue,
    };
  }

  function createItemCard(item) {
    const cardDiv = document.createElement("div");
    cardDiv.classList.add("col-6", "col-md-4", "col-lg-3", "mb-4"); // Added col-6 for mobile
    let color = "#124E66";

    // Determine color based on item type
    if (item.type === "Vehicle") color = "#c82c2c";
    if (item.type === "Spoiler") color = "#C18800";
    if (item.type === "Rim") color = "#6335B1";
    if (item.type === "Tire Sticker") color = "#1CA1BD";
    if (item.type === "Tire Style") color = "#4CAF50";
    if (item.type === "Drift") color = "#FF4500";
    if (item.type === "Color") color = "#8A2BE2";
    if (item.type === "Texture") color = "#708090";
    if (item.type === "HyperChrome") color = "#E91E63";
    if (item.type === "Furniture") color = "#9C6644";

    // Determine the image URL directly from item type
    const mediaElement =
      item.type === "Drift"
        ? `<div class="media-container">
                <div class="skeleton-loader active"></div>
                <img 
                    src="/assets/images/items/480p/drifts/${item.name}.webp"
                    class="card-img-top thumbnail"
                    alt="${item.name}"
                    style="opacity: 1; z-index: 2;"
                    onerror="handleimage(this)"
                    onload="this.previousElementSibling.classList.remove('active')"
                >
                <video 
                    src="/assets/images/items/drifts/${item.name}.webm"
                    class="card-img-top video-player"
                    style="opacity: 0; z-index: 1;"
                    playsinline 
                    muted 
                    loop
                ></video>
            </div>`
        : item.type === "HyperChrome" && item.name === "HyperShift"
        ? `<div class="media-container">
                    <div class="skeleton-loader active"></div>
                    <video 
                        src="/assets/images/items/hyperchromes/HyperShift.webm"
                        class="card-img-top"
                        style="opacity: 0; transition: opacity 0.3s ease-in-out;"
                        playsinline 
                        muted 
                        loop
                        autoplay
                        id="hypershift-video"
                        onloadeddata="this.style.opacity='1'; this.previousElementSibling.classList.remove('active')"
                        onerror="handleimage(this)"
                    ></video>
                </div>`
        : `<div class="media-container">
                    <div class="skeleton-loader active"></div>
                    <img 
                        onerror="handleimage(this)" 
                        id="${item.name}" 
                        src="/assets/images/items/480p/${item.type.toLowerCase()}s/${
            item.name
          }.webp" 
                        class="card-img-top" 
                        alt="${item.name}" 
                        style="opacity: 0; transition: opacity 0.3s ease-in-out;"
                        onload="this.style.opacity='1'; this.previousElementSibling.classList.remove('active')"
                    >
                </div>`;

    // Format values
    const cashValue = formatValue(item.cash_value);
    const dupedValue = formatValue(item.duped_value);

    let badgeHtml = "";
    let typeBadgeHtml = "";

    if (item.type === "HyperChrome") {
      badgeHtml = `
            <span class="hyperchrome-badge" style="color: black;">
                <i class="bi bi-stars"></i>HyperChrome
            </span>
        `;
    } else {
      // Only show type badge for non-HyperChrome items
      typeBadgeHtml = `
            <span class="badge item-type-badge" style="background-color: ${color};">${item.type}</span>
        `;

      // Show limited badge if item is limited
      if (item.is_limited) {
        badgeHtml = `
                <span class="badge limited-badge">
                    <i class="bi bi-star-fill me-1"></i>Limited
                </span>
            `;
      }
    }

    // Create card with conditional badges
    cardDiv.innerHTML = `
    <div class="card items-card shadow-sm ${
      item.is_limited ? "limited-item" : ""
    }" 
         onclick="handleCardClick('${
           item.name
         }', '${item.type.toLowerCase()}', event)" 
         onmousedown="handleCardClick('${
           item.name
         }', '${item.type.toLowerCase()}', event)"
         style="cursor: pointer;">
        ${mediaElement}
        ${typeBadgeHtml}
        ${badgeHtml}
        <div class="item-card-body text-center">
            <h5 class="card-title">${item.name}</h5>
            <div class="value-container">
                <div class="d-flex justify-content-between align-items-center mb-2 value-row">
                    <span>Cash Value:</span>
                    <span class="cash-value" data-value="${
                      cashValue.numeric
                    }">${cashValue.display}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2 value-row">
                    <span>Duped Value:</span>
                    <span class="duped-value" data-value="${
                      dupedValue.numeric
                    }">${dupedValue.display}</span>
                </div>
                <div class="d-flex justify-content-between align-items-center value-row">
                    <span>Demand:</span>
                 <span class="demand-value">${
                   item.demand === "N/A" ? "-" : item.demand || "-"
                 }</span>
                </div>
            </div>
        </div>
    </div>`;

    // Add hover event listeners for drift videos
    if (item.type === "Drift") {
      const card = cardDiv.querySelector(".card");
      const video = cardDiv.querySelector("video");
      const thumbnail = cardDiv.querySelector(".thumbnail");

      card.addEventListener("mouseenter", () => {
        video.style.opacity = "1";
        thumbnail.style.opacity = "0";
        video.play();
      });

      card.addEventListener("mouseleave", () => {
        video.style.opacity = "0";
        thumbnail.style.opacity = "1";
        video.pause();
        video.currentTime = 0;
      });
    }

    // Return the created element
    return cardDiv;
  }

  window.filterItems = debounce(function () {
    const searchTerm = document
      .getElementById("search-bar")
      .value.toLowerCase();
    const searchBar = document.getElementById("search-bar");
    const sortValue = document.getElementById("sort-dropdown").value;

    const itemsContainer = document.querySelector("#items-container");
    const searchMessages = document.getElementById("search-messages");

    // Save search term
    if (searchTerm) {
      localStorage.setItem("searchTerm", searchTerm);
    } else {
      localStorage.removeItem("searchTerm");
    }

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
        // Special handling for limited items
        if (itemType === "limited-items") {
          return item.is_limited;
        }
        // Regular category filtering
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
    const minCharacters = isRimsCategory ? 1 : 1;

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
  }, 300);

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function preloadItemImages() {
    if (!allItems || allItems.length === 0) {
      return;
    }

    const imagePromises = [];

    for (const item of allItems) {
      if (item.type.toLowerCase() === "drift") continue;

      const image_type = item.type.toLowerCase();
      const image_url = `/assets/images/items/${image_type}s/${item.name}.webp`;

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

  // Update clearFilters function
  window.clearFilters = debounce(function () {
    // Clear sessionStorage
    sessionStorage.removeItem("sortDropdown");
    sessionStorage.removeItem("valueSortDropdown");

    // Reset dropdowns
    document.getElementById("sort-dropdown").value = "name-all-items";
    document.getElementById("value-sort-dropdown").value = "random"; // Match initial load state

    // Update breadcrumb state
    const categoryNameElement = document.querySelector(".category-name");
    const valuesBreadcrumb = document.getElementById("values-breadcrumb");

    categoryNameElement.style.display = "none";
    valuesBreadcrumb.classList.add("active");
    valuesBreadcrumb.setAttribute("aria-current", "page");
    valuesBreadcrumb.innerHTML = "Values";

    // Reset items display
    currentPage = 1;
    filteredItems = [...allItems];
    filteredItems = shuffleArray(filteredItems); // Shuffle items to match 'random' sort

    // If there's a search term, perform the search
    const searchValue = searchBar?.value?.trim() || "";
    if (searchValue) {
      filterItems();
    } else {
      displayItems();
      updateTotalItemsCount();
      updateTotalItemsLabel("all-items");
    }

    updateSearchPlaceholder();

    toastr.success("Filters have been reset", "Filters Reset");
  }, 500);

  // Modify the value-sort-dropdown options in the HTML
  // Modify the value-sort-dropdown options in the HTML
  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  if (valueSortDropdown) {
    valueSortDropdown.innerHTML = `
    <option value="random">Random</option>
    <option value="separator" disabled>───── Alphabetically ─────</option>
    <option value="alpha-asc">Name (A to Z)</option>
    <option value="alpha-desc">Name (Z to A)</option>
    <option value="separator" disabled>───── Values ─────</option>
    <option value="cash-asc">Cash Value (Low to High)</option>
    <option value="cash-desc">Cash Value (High to Low)</option>
    <option value="duped-asc">Duped Value (Low to High)</option>
    <option value="duped-desc">Duped Value (High to Low)</option>
    <option value="separator" disabled>───── Demand ─────</option>
    <option value="demand-asc">Demand (Low to High)</option>
    <option value="demand-desc">Demand (High to Low)</option>
  `;

    // Check sessionStorage first, fallback to random
    const savedValueSort = sessionStorage.getItem("valueSortDropdown");

    valueSortDropdown.value = savedValueSort || "random";
    sortItems(); // Apply initial sort
  }

  // Add toastr configuration
  toastr.options = {
    closeButton: true,
    debug: false,
    newestOnTop: true,
    progressBar: true,
    positionClass: "toast-bottom-right",
    preventDuplicates: false,
    showDuration: "300",
    hideDuration: "1000",
    timeOut: "3000",
    extendedTimeOut: "1000",
    showEasing: "swing",
    hideEasing: "linear",
    showMethod: "fadeIn",
    hideMethod: "fadeOut",
  };

  loadItems(); // Initial load

  // Handle URL parameters and clean up URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has("sort")) {
    const sortValue = urlParams.get("sort");
    // Validate sort parameter
    if (VALID_SORTS.includes(sortValue)) {
      const dropdown = document.getElementById("sort-dropdown");
      dropdown.value = `name-${sortValue}`;
      sessionStorage.setItem("sortDropdown", dropdown.value);
    }
  }
  if (urlParams.has("valueSort")) {
    const valueSort = urlParams.get("valueSort");
    const valueSortDropdown = document.getElementById("value-sort-dropdown");
    valueSortDropdown.value = valueSort;
    sessionStorage.setItem("valueSortDropdown", valueSort);
  }

  // Clean up URL after storing parameters
  window.history.replaceState({}, "", window.location.pathname);

  // Apply the sort
  sortItems();

  // Restore contributors section state on mobile
  if (window.innerWidth <= 768) {
    const grid = document.querySelector(".contributors-grid");
    const icon = document.querySelector(".toggle-icon");
    const expanded = localStorage.getItem("contributorsExpanded") === "true";

    if (expanded) {
      grid.classList.add("expanded");
      icon.classList.add("collapsed");
    }
  }
});

// Default Image
window.handleimage = function (element) {
  const isHyperShift =
    element.id === "hypershift-video" ||
    (element.alt === "HyperShift" &&
      element.closest(".media-container")?.querySelector("video"));

  if (isHyperShift) {
    return;
  }

  element.src =
    "https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp";
};

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
      let categoryName;
      if (itemType === "hyperchromes") {
        categoryName = "HyperChrome";
      } else {
        categoryName = itemType
          .slice(0, -1)
          .split("-")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");
      }
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
    "limited-items": "Search limited items...",
    vehicles: "Search vehicles (e.g., Brulee, Torpedo)...",
    spoilers: "Search spoilers (e.g., Rocket, Wing)...",
    rims: "Search rims (e.g., Star, Spinner)...",
    "tire-stickers": "Search tire stickers (e.g., Badonuts, Blue 50)...",
    drifts: "Search drifts... (e.g., Cartoon, Melons)...",
    "body-colors": "Search colors (e.g., Red, Blue)...",
    textures: "Search textures (e.g., Aurora, Checkers)...",
    hyperchromes: "Search HyperChromes (e.g., HyperBlue Level 2)...",
    furniture: "Search furniture (e.g., Nukamo Fridge, Bloxy Lisa)...",
  };

  // Set the placeholder text
  searchBar.placeholder = placeholders[category] || "Search items...";
}

window.handleCardClick = function (name, type, event) {
  // Prevent opening card on right click (event.button = 2)
  if (event.button === 2) {
    return;
  }

  event.preventDefault();

  // Always convert spaces to hyphens for consistent storage
  const formattedType = type.replace(/\s+/g, "-");

  // Store both dropdown values before navigating
  const currentSort = document.getElementById("sort-dropdown").value;
  const currentValueSort = document.getElementById("value-sort-dropdown").value;

  sessionStorage.setItem("sortDropdown", currentSort);
  sessionStorage.setItem("valueSortDropdown", currentValueSort);

  const formattedName = encodeURIComponent(name);
  const formattedUrlType = encodeURIComponent(type.toLowerCase());
  const url = `/item/${formattedUrlType}/${formattedName}`;

  window.location.href = url;
};

window.handleCategoryClick = function (event, category) {
  event.preventDefault();

  const hyphenatedCategory = category.replace(/\s+/g, "-");
  const dropdown = document.getElementById("sort-dropdown");
  const newValue = `name-${hyphenatedCategory}`;
  dropdown.value = newValue;
  sessionStorage.setItem("sortDropdown", newValue);

  // Get the current value sort
  const valueSortDropdown = document.getElementById("value-sort-dropdown");
  const valueSort = valueSortDropdown.value;
  sessionStorage.setItem("valueSortDropdown", valueSort);

  sortItems();
};

// Make sure sortItems is accessible globally
if (typeof window.sortItems !== "function") {
  console.warn("sortItems not found on window object, ensuring it's defined");
  window.sortItems = function () {
    console.warn("Fallback sortItems called - page may need refresh");
  };
}

function toggleContributors(header) {
  const grid = header.nextElementSibling;
  const icon = header.querySelector(".toggle-icon");

  if (window.innerWidth <= 768) {
    grid.classList.toggle("expanded");
    icon.classList.toggle("collapsed");

    // Store the state in localStorage
    localStorage.setItem(
      "contributorsExpanded",
      grid.classList.contains("expanded")
    );
  }
}

// Add preloading specifically for drift thumbnails
function preloadDriftThumbnails(driftItems) {
  if (!driftItems || driftItems.length === 0) return;

  driftItems.forEach((item) => {
    const img = new Image();
    img.src = `/assets/images/items/480p/drifts/${item.name}.webp`;
  });
}
