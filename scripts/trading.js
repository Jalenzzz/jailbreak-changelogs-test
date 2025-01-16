// Configure toastr
toastr.options = {
  positionClass: "toast-bottom-right",
  closeButton: true,
  progressBar: true,
  preventDuplicates: true,
  timeOut: 3000,
};

let activeBottomSheet = null;
let startY = 0;
let currentY = 0;
let initialTransform = 0;
const currentUserId = sessionStorage.getItem("userid");

async function canCreateTradeAd() {
  const token = Cookies.get("token");
  if (!token) {
    toastr.error("Please login first");
    return false;
  }

  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
    );
    if (!response.ok) throw new Error("Failed to fetch user data");

    const userData = await response.json();
    if (!userData) throw new Error("No user data found");

    // Check if user has Roblox data
    if (!userData.roblox_id || !userData.roblox_username) {
      toastr.error("Please link your Roblox account first", "", {
        timeOut: 5000,
        closeButton: true,
        onclick: function () {
          window.location.href = "/roblox";
        },
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error checking trade permissions:", error);
    toastr.error("Failed to verify trade permissions");
    return false;
  }
}

function createSkeletonTradeAd() {
  // Check if viewport is mobile (less than or equal to 768px)
  const isMobile = window.innerWidth <= 768;
  const skeletonCount = isMobile ? 2 : 3;

  return `
    <div class="trade-ad">
      <div class="trade-ad-header">
        <div class="trader-info">
          <div class="skeleton" style="width: 48px; height: 48px; border-radius: 50%;"></div>
          <div class="trader-details">
            <div class="skeleton-text title skeleton"></div>
            <div class="skeleton-text skeleton"></div>
          </div>
        </div>
      </div>
      <div class="trade-sides-container">
        <div class="trade-side offering">
          <div class="trade-side-label">Offering</div>
          <div class="trade-items-grid">
            ${Array(skeletonCount)
              .fill(
                `<div class="trade-ad-item loading">
                  <div class="item-image-container">
                    <div class="skeleton-image skeleton"></div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>
        <div class="trade-side requesting">
          <div class="trade-side-label">Requesting</div>
          <div class="trade-items-grid">
            ${Array(skeletonCount)
              .fill(
                `<div class="trade-ad-item loading">
                  <div class="item-image-container">
                    <div class="skeleton-image skeleton"></div>
                  </div>
                </div>`
              )
              .join("")}
          </div>
        </div>
      </div>
      <div class="trade-ad-footer">
        <div class="skeleton-text skeleton" style="width: 120px;"></div>
        <div class="skeleton-text skeleton" style="width: 80px;"></div>
      </div>
    </div>
  `;
}

function initializeBottomSheet() {
  const bottomSheet = document.createElement("div");
  bottomSheet.className = "bottom-sheet";
  bottomSheet.innerHTML = `
    <div class="bottom-sheet-drag-handle"></div>
    <div class="bottom-sheet-header">
      <h3 class="bottom-sheet-title"></h3>
    </div>
    <div class="bottom-sheet-content"></div>
  `;

  const backdrop = document.createElement("div");
  backdrop.className = "bottom-sheet-backdrop";

  document.body.appendChild(backdrop);
  document.body.appendChild(bottomSheet);

  backdrop.addEventListener("click", hideBottomSheet);

  bottomSheet.addEventListener("touchstart", handleTouchStart, {
    passive: false,
  });
  bottomSheet.addEventListener("touchmove", handleTouchMove, {
    passive: false,
  });
  bottomSheet.addEventListener("touchend", handleTouchEnd);

  return { bottomSheet, backdrop };
}

function handleTouchStart(e) {
  if (e.target.closest(".bottom-sheet-content")) {
    // Allow scrolling inside content area
    return;
  }
  e.preventDefault(); // Prevent default only for drag handle area
  const bottomSheet = e.currentTarget;
  startY = e.touches[0].clientY;
  initialTransform = getTransformValue(bottomSheet);
  bottomSheet.style.transition = "none";
}

function handleTouchMove(e) {
  if (e.target.closest(".bottom-sheet-content")) {
    // Allow scrolling inside content area
    return;
  }
  e.preventDefault();
  const bottomSheet = e.currentTarget;
  currentY = e.touches[0].clientY;
  const deltaY = currentY - startY;
  const newTransform = Math.min(0, initialTransform - deltaY);
  bottomSheet.style.transform = `translateY(${newTransform}px)`;
}

function handleTouchEnd(e) {
  const bottomSheet = e.currentTarget;
  bottomSheet.style.transition = "transform 0.3s ease-out";
  const transformValue = getTransformValue(bottomSheet);

  // If dragged down more than 20% of the sheet height, dismiss it
  if (transformValue > -window.innerHeight * 0.8) {
    hideBottomSheet();
  } else {
    bottomSheet.style.transform = "translateY(-95%)";
  }
}

function getTransformValue(element) {
  const transform = element.style.transform;
  return transform ? parseInt(transform.match(/-?\d+/)[0]) : 0;
}

function showBottomSheet(item) {
  if (window.innerWidth > 768) return;

  const { bottomSheet, backdrop } = document.querySelector(".bottom-sheet")
    ? {
        bottomSheet: document.querySelector(".bottom-sheet"),
        backdrop: document.querySelector(".bottom-sheet-backdrop"),
      }
    : initializeBottomSheet();

  bottomSheet.querySelector(".bottom-sheet-title").textContent = item.name;
  bottomSheet.querySelector(".bottom-sheet-content").innerHTML = `
    <div class="item-image-container mb-3">
      ${getItemImageElement(item)}
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Type</span>
      <span class="value">${item.type}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Cash Value</span>
      <span class="value">${formatValue(item.cash_value, true)}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Duped Value</span>
      <span class="value">${formatValue(item.duped_value, true)}</span>
    </div>
    <div class="bottom-sheet-value">
      <span class="label">Limited</span>
      <span class="value">${item.is_limited ? "Yes" : "No"}</span>
    </div>
  `;

  backdrop.classList.add("show");
  bottomSheet.classList.add("show");

  activeBottomSheet = bottomSheet;
}

function hideBottomSheet() {
  const bottomSheet = document.querySelector(".bottom-sheet");
  const backdrop = document.querySelector(".bottom-sheet-backdrop");

  if (bottomSheet && backdrop) {
    bottomSheet.classList.remove("show");
    backdrop.classList.remove("show");

    activeBottomSheet = null;
  }
}

function getItemImageElement(item) {
  // Special handling for HyperShift
  if (item.name === "HyperShift") {
    return `<img src="/assets/images/items/hyperchromes/HyperShift.gif" 
                 class="card-img-top" 
                 alt="${item.name}">`;
  }

  if (item.type === "Drift") {
    return `<img src="/assets/images/items/drifts/thumbnails/${item.name}.webp" 
                 class="card-img-top" 
                 alt="${item.name}"
                 onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
  }

  return `<img src="/assets/items/${item.type.toLowerCase()}s/${
    item.name
  }.webp" 
               class="card-img-top" 
               alt="${item.name}"
               onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat.webp'">`;
}

function decimalToHex(decimal) {
  if (!decimal || decimal === "None") return "#124E66";

  // Convert to hex and ensure exactly 6 digits
  const hex = decimal.toString(16).padStart(6, "0").slice(-6);

  // Return the hex color with a # prefix
  return `#${hex}`;
}

function formatValue(value, useSuffix = false) {
  if (!value || value === "N/A") return "No Value";
  const parsedValue = parseValue(value);

  // Use suffixes for mobile if enabled
  if (useSuffix && window.innerWidth <= 768) {
    if (parsedValue >= 1000000000) {
      return (parsedValue / 1000000000).toFixed(1) + "B";
    } else if (parsedValue >= 1000000) {
      return (parsedValue / 1000000).toFixed(1) + "M";
    } else if (parsedValue >= 1000) {
      return (parsedValue / 1000).toFixed(1) + "K";
    }
  }

  return parsedValue.toLocaleString("fullwide", { useGrouping: true });
}

// Store all items and current trade items
let allItems = [];
const offeringItems = [];
const requestingItems = [];
let currentTradeType = "offering"; // Set default to "offering"

const ITEMS_PER_PAGE = 100;
let currentPage = 1;
let filteredItems = [];

// Fetch all items on load
async function loadItems() {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/items/list"
    );
    allItems = await response.json();

    currentTradeType = "offering";

    // Set active state on offering button
    document.querySelectorAll(".available-items-toggle").forEach((button) => {
      button.dataset.active = (button.dataset.type === "offering").toString();
    });

    displayAvailableItems("offering");
    displayAvailableItems("requesting");
  } catch (error) {
    console.error("Error loading items:", error);
    toastr.error("Failed to load items");
  }
}

// Add item to trade
// Update addItemToTrade function
function addItemToTrade(item, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  if (items.length >= 8) {
    toastr.error(`You can only add up to 8 items to ${tradeType}`);
    return;
  }

  // Track item count for multiplier display
  const existingIndex = items.findIndex(
    (existingItem) =>
      existingItem &&
      existingItem.name === item.name &&
      existingItem.type === item.type
  );

  if (existingIndex !== -1) {
    const nextEmptyIndex = findNextEmptySlot(items);
    if (nextEmptyIndex !== -1) {
      items[nextEmptyIndex] = item;
    }
  } else {
    items.push(item);
  }

  // Always render trade items first
  renderTradeItems(tradeType);
  updateTradeSummary();

  // Check if preview section exists and is not hidden
  const previewSection = document.getElementById("trade-preview");
  if (
    previewSection &&
    window.getComputedStyle(previewSection).display !== "none"
  ) {
    // Update both sides of the preview to maintain consistency
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }

  if (currentTradeType) {
    displayAvailableItems(currentTradeType);
  }
}

// Function to quickly add item from available items
// Update the quickAddItem function
function quickAddItem(itemName, itemType) {
  const item = allItems.find((i) => i.name === itemName && i.type === itemType);
  if (!item) return;

  // Use the global selection state
  if (selectedPlaceholderIndex !== -1 && selectedTradeType) {
    const items =
      selectedTradeType === "Offer" ? offeringItems : requestingItems;

    // Only check if the specific slot is empty
    if (items[selectedPlaceholderIndex]) {
      // If slot is filled, try to find next empty slot
      const nextEmptyIndex = findNextEmptySlot(items);
      if (nextEmptyIndex !== -1) {
        items[nextEmptyIndex] = item;
        renderTradeItems(selectedTradeType);
        updateTradeSummary();
        updatePreviewIfVisible(); // Add this line
      } else {
        toastr.error("No empty slots available");
      }
      return;
    }

    // Insert at the exact selected position
    items[selectedPlaceholderIndex] = item;

    // Store type before clearing selection
    const currentType = selectedTradeType;

    // Clear selection state
    clearPlaceholderSelection();

    // Update UI
    renderTradeItems(currentType);
    updateTradeSummary();
    updatePreviewIfVisible(); // Add this line
  } else {
    // No placeholder selected, find first empty slot
    const items =
      currentTradeType === "offering" ? offeringItems : requestingItems;
    const emptyIndex = findNextEmptySlot(items);

    if (emptyIndex !== -1) {
      items[emptyIndex] = item;
      renderTradeItems(currentTradeType === "offering" ? "Offer" : "Request");
      updateTradeSummary();
      updatePreviewIfVisible(); // Add this line
    } else {
      toastr.error(
        `No empty slots available in ${
          currentTradeType === "offering" ? "Offer" : "Request"
        }`
      );
    }
  }
}

// Add this new helper function
function updatePreviewIfVisible() {
  const previewSection = document.getElementById("trade-preview");
  if (
    previewSection &&
    window.getComputedStyle(previewSection).display !== "none"
  ) {
    // Update both sides of the preview
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }
}

// Add new helper function to clear selection
function clearPlaceholderSelection() {
  document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });
  selectedPlaceholderIndex = -1;
  selectedTradeType = null;
}

// Add helper function to find next empty slot
function findNextEmptySlot(items) {
  for (let i = 0; i < 8; i++) {
    if (!items[i]) return i;
  }
  return -1;
}

// Update remove item function to maintain slot positions
function removeItem(index, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  delete items[index];

  renderTradeItems(tradeType);
  updateTradeSummary();

  // Automatically update preview if it's visible
  const previewSection = document.getElementById("trade-preview");
  if (previewSection && previewSection.style.display === "block") {
    renderPreviewItems("preview-offering-items", offeringItems);
    renderPreviewItems("preview-requesting-items", requestingItems);

    // Update value differences
    const valueDifferencesContainer =
      document.getElementById("value-differences");
    if (valueDifferencesContainer) {
      valueDifferencesContainer.innerHTML = renderValueDifferences();
    }
  }
}

// Function to toggle available items display
function toggleAvailableItems(type) {
  const container = document.getElementById("available-items-container");

  // Early return if clicking same type
  if (currentTradeType === type) {
    return;
  }

  // Show container and update title
  container.style.display = "block";
  title.textContent =
    type === "offering" ? "Add Items to Offer" : "Add Items to Request";

  // Update active states on buttons
  document.querySelectorAll(".available-items-toggle").forEach((button) => {
    button.dataset.active = (button.dataset.type === type).toString();
  });

  // Update trade type and reset page
  currentTradeType = type;

  currentPage = 1;

  // Display available items
  displayAvailableItems(type);
}

// Replace displayAvailableItems function
function displayAvailableItems(type) {
  const container = document.getElementById("modal-available-items-list");
  const searchInput = document.getElementById("modal-item-search");

  if (searchInput) {
    setTimeout(() => {
      searchInput.focus();
    }, 500);
  }

  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  if (searchTerm) {
    filteredItems = filteredItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm)
    );
  }

  // If no items are filtered and no search term, show all items
  if (filteredItems.length === 0 && !searchTerm) {
    filteredItems = [...allItems];
  }

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

  renderPagination(totalPages, type);

  container.innerHTML = itemsToDisplay
    .map((item) => {
      // Special handling for drifts - show only thumbnail
      const imageUrl =
        item.type === "Drift"
          ? `/assets/images/items/drifts/thumbnails/${item.name}.webp`
          : `/assets/items/${item.type.toLowerCase()}s/${item.name}.webp`;

      return `
          <div class="col-custom-5">
            <div class="card available-item-card" 
                 onclick="quickAddItem('${item.name}', '${item.type}')"
                 data-bs-dismiss="modal">
              <div class="card-header">
                ${item.name}
              </div>
              ${getItemImageElement(item)}
              <div class="card-body">
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${item.type}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Cash Value:</span>
                  <span class="info-value">${formatValue(
                    item.cash_value
                  )}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Duped Value:</span>
                  <span class="info-value">${formatValue(
                    item.duped_value || 0
                  )}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Limited:</span>
                  <span class="info-value">${
                    item.is_limited ? "True" : "False"
                  }</span>
                </div>
              </div>
            </div>
          </div>
        `;
    })
    .join("");
}

function sortModalItems() {
  const valueSortDropdown = document.getElementById(
    "modal-value-sort-dropdown"
  );
  const sortValue = valueSortDropdown.value;

  // Extract category from sort value
  const parts = sortValue.split("-");
  const itemType = parts.slice(1).join("-");

  // First filter by category
  if (itemType === "all-items") {
    filteredItems = [...allItems];
  } else if (itemType === "limited-items") {
    filteredItems = allItems.filter((item) => {
      return item.is_limited;
    });
  } else {
    // Convert type names to match the API format
    const typeMap = {
      vehicles: "Vehicle",
      spoilers: "Spoiler",
      rims: "Rim",
      "body-colors": "Body Color",
      hyperchromes: "HyperChrome",
      textures: "Texture",
      "tire-stickers": "Tire Sticker",
      "tire-styles": "Tire Style",
      drifts: "Drift",
      furnitures: "Furniture",
    };

    const targetType = typeMap[itemType] || itemType;

    filteredItems = allItems.filter((item) => {
      return item.type === targetType;
    });
  }

  // Sort the filtered items by name
  filteredItems.sort((a, b) => a.name.localeCompare(b.name));

  // Reset to first page and display filtered items
  currentPage = 1;
  displayAvailableItems(currentTradeType);
}

// Update renderPagination function to use modal elements
function renderPagination(totalPages, type) {
  const topPagination = document.getElementById("modal-pagination-top");
  const bottomPagination = document.getElementById("modal-pagination-bottom");
  const paginationHTML = `
    <div class="pagination-container">
      <button class="pagination-button" onclick="changePage(${
        currentPage - 1
      }, '${type}')" ${currentPage === 1 ? "disabled" : ""}>
        <i class="bi bi-chevron-left"></i>
      </button>
      <span class="pagination-info">Page ${currentPage} of ${totalPages}</span>
      <button class="pagination-button" onclick="changePage(${
        currentPage + 1
      }, '${type}')" ${currentPage === totalPages ? "disabled" : ""}>
        <i class="bi bi-chevron-right"></i>
      </button>
    </div>
  `;

  if (topPagination) topPagination.innerHTML = paginationHTML;
  if (bottomPagination) topPagination.innerHTML = paginationHTML;
}

function changePage(newPage, type) {
  if (
    newPage >= 1 &&
    newPage <= Math.ceil(filteredItems.length / ITEMS_PER_PAGE)
  ) {
    currentPage = newPage;
    displayAvailableItems(type);
  }
}

// Add debounced search handler
let searchTimeout;
function handleSearch(type) {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    currentPage = 1; // Reset to first page on search
    displayAvailableItems(type);
  }, 300);
}

// Format value for display
function formatValue(value) {
  if (!value) return "0";
  const parsedValue = parseValue(value);
  return formatLargeNumber(parsedValue);
}

let selectedPlaceholderIndex = -1;
let selectedTradeType = null;

// Function to create empty placeholder cards
function createPlaceholderCard(index, tradeType) {
  return `
    <div class="col-md-3 col-6 mb-3">
      <div class="trade-card-wrapper">
        <div class="trade-card empty-slot" 
             onclick="handlePlaceholderClick(${index}, '${tradeType}')">
          <div class="empty-slot-content">
            <i class="bi bi-plus-circle"></i>
            <span>Empty Slot</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Update handlePlaceholderClick function
function handlePlaceholderClick(index, tradeType) {
  // Remove selected state from all slots
  document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });

  // Add selected state to clicked slot
  event.currentTarget.classList.add("selected");

  // Update the global selection state
  selectedPlaceholderIndex = index;
  selectedTradeType = tradeType;

  // Update modal title
  const modalTitle = document.getElementById("availableItemsModalLabel");
  modalTitle.textContent = `Select Item to ${tradeType}`;

  // Set current trade type
  currentTradeType = tradeType === "Offer" ? "offering" : "requesting";

  // Reset search and page
  if (document.getElementById("modal-item-search")) {
    document.getElementById("modal-item-search").value = "";
  }
  currentPage = 1;

  // Display items in modal
  displayAvailableItems(currentTradeType);

  // Show modal
  const modal = new bootstrap.Modal(
    document.getElementById("availableItemsModal")
  );
  modal.show();
}

// Function to render empty slots
function renderEmptySlots(containerId, count) {
  const container = document.getElementById(containerId);
  let html = "";
  for (let i = 0; i < count; i++) {
    html += createPlaceholderCard(
      i,
      containerId === "offering-list" ? "Offer" : "Request"
    );
  }
  container.innerHTML = html;
}

function renderTradeItems(tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  const containerId =
    tradeType.toLowerCase() === "offer" ? "offering-list" : "requesting-list";
  const container = document.getElementById(containerId);

  if (!container) return;

  // Create an array of 8 slots
  let slots = new Array(8).fill(null);

  // Count duplicates and track first position
  const itemPositions = new Map();
  const itemCounts = new Map();

  // First pass: count items and record first position
  Object.entries(items).forEach(([index, item]) => {
    if (!item) return;
    const itemKey = `${item.name}-${item.type}`;
    if (!itemPositions.has(itemKey)) {
      itemPositions.set(itemKey, parseInt(index));
    }
    itemCounts.set(itemKey, (itemCounts.get(itemKey) || 0) + 1);
  });

  // Second pass: only keep items in their first position
  Object.entries(items).forEach(([index, item]) => {
    if (!item) return;
    const itemKey = `${item.name}-${item.type}`;
    if (parseInt(index) === itemPositions.get(itemKey)) {
      slots[parseInt(index)] = item;
    }
  });

  // Generate HTML
  let html = slots
    .map((item, index) => {
      if (item) {
        const itemKey = `${item.name}-${item.type}`;
        const count = itemCounts.get(itemKey);
        return `
        <div class="col-md-3 col-6 mb-3">
      <div class="trade-card">
        <div class="card-img-container">
          ${getItemImageElement(item)}
          ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
          <div class="remove-icon" onclick="event.stopPropagation(); removeItem(${index}, '${tradeType}')">
            <i class="bi bi-trash"></i>
          </div>
        </div>
        <div class="trade-card-info">
          <div class="item-name ">${item.name}</div>
          <div class="item-type">${item.type}</div>
        </div>
      </div>
    </div>`;
      } else {
        return createPlaceholderCard(index, tradeType);
      }
    })
    .join("");

  container.innerHTML = html;

  // Reapply selection if needed
  if (selectedTradeType === tradeType && selectedPlaceholderIndex !== -1) {
    const slots = container.querySelectorAll(".trade-card.empty-slot");
    const targetSlot = slots[selectedPlaceholderIndex];
    if (targetSlot) {
      targetSlot.classList.add("selected");
    }
  }
}

// Add these helper functions for value parsing
function parseValue(value) {
  if (typeof value === "number") return value;
  if (!value) return 0;

  value = value.toString().toLowerCase();
  if (value.includes("k")) {
    return parseFloat(value) * 1000;
  } else if (value.includes("m")) {
    return parseFloat(value) * 1000000;
  } else if (value.includes("b")) {
    return parseFloat(value) * 1000000000;
  }
  return parseFloat(value) || 0;
}

// Update the formatLargeNumber function to show full numbers
function formatLargeNumber(num) {
  return num.toLocaleString("fullwide", { useGrouping: true });
}

// Update trade summary
function updateTradeSummary() {
  const offerCashValue = Object.values(offeringItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.cash_value || 0) : 0),
    0
  );
  const offerDupedValue = Object.values(offeringItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.duped_value || 0) : 0),
    0
  );
  const requestCashValue = Object.values(requestingItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.cash_value || 0) : 0),
    0
  );
  const requestDupedValue = Object.values(requestingItems).reduce(
    (sum, item) => sum + (item ? parseValue(item.duped_value || 0) : 0),
    0
  );
}

// Initialize
loadItems();

// Enable/Disable Confirm Trade Button
function toggleConfirmButton() {
  const hasOfferingItems = Object.values(offeringItems).some((item) => item);
  const hasRequestingItems = Object.values(requestingItems).some(
    (item) => item
  );

  if (hasOfferingItems && hasRequestingItems) {
    confirmTradeButton.removeAttribute("disabled");
  } else {
    confirmTradeButton.setAttribute("disabled", "true");
  }
}

async function deleteTradeAd(tradeId) {
  try {
    const token = Cookies.get("token");
    if (!token) {
      toastr.error("Please login to delete trade advertisements");
      return;
    }

    // Show confirmation dialog
    if (!confirm("Are you sure you want to delete this trade advertisement?")) {
      return;
    }

    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/trades/delete?id=${tradeId}&token=${token}`,
      {
        method: "DELETE", // Changed from implicit GET to explicit DELETE
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Delete trade error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toastr.success("Trade advertisement deleted successfully!");
    await loadTradeAds(); // Refresh the trade ads list
  } catch (error) {
    console.error("Error deleting trade:", error);
    toastr.error("Failed to delete trade advertisement");
  }
}
async function editTradeAd(tradeId) {
  try {
    console.log("Starting editTradeAd for trade:", tradeId);
    const url = new URL(window.location);
    url.searchParams.set("edit", tradeId);
    window.history.replaceState({}, "", url);
    const token = Cookies.get("token");
    if (!token) {
      console.log("No token found, user not logged in");
      toastr.error("Please login to edit trade advertisements");
      const url = new URL(window.location);
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url);
      return;
    }

    // Get user data from token first
    console.log("Fetching user data...");
    const userResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
    );
    if (!userResponse.ok) {
      console.error("Failed to fetch user data:", userResponse.status);
      throw new Error("Failed to fetch user data");
    }
    const userData = await userResponse.json();
    console.log("User data fetched:", userData);

    // Fetch specific trade details
    console.log("Fetching trade details...");
    const tradeResponse = await fetch(
      `https://api3.jailbreakchangelogs.xyz/trades/get?id=${tradeId}`
    );
    if (!tradeResponse.ok) {
      console.error("Trade not found:", tradeResponse.status);
      toastr.error("Trade advertisement not found");
      const url = new URL(window.location);
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url);
      return;
    }
    const trade = await tradeResponse.json();
    // Fetch author details
    const authorDetails = await fetchUserDetails(trade.author);

    // Check if the current user is the author
    console.log(
      "Comparing user IDs - Author:",
      trade.author,
      "Current:",
      userData.id
    );

    if (trade.author !== userData.id) {
      console.log("Permission denied - user is not the author");
      toastr.error(
        "You don't have permission to edit this trade advertisement"
      );
      setTimeout(() => {
        window.location.href = "/trading";
      }, 3000);
      return;
    }

    // Show toast with author details
    toastr.success(
      `Editing Trade #${tradeId} by ${
        authorDetails?.roblox_username || "Unknown"
      }`,
      "",
      {
        timeOut: 5000,
      }
    );

    const tradeSidesWrapper = document.querySelector(".trade-sides-wrapper");
    if (tradeSidesWrapper) {
      tradeSidesWrapper.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    // Clear current trade
    console.log("Resetting current trade...");
    resetTrade();

    // Get and verify confirm button exists
    const confirmButton = document.getElementById("confirm-trade-btn");
    console.log("Confirm button found:", confirmButton);
    if (!confirmButton) {
      console.error("Confirm button not found in DOM");
      return;
    }

    // Show the trade editor
    console.log("Setting up trade editor UI...");
    document.getElementById("trade-preview").style.display = "none";
    const availableContainer = document.getElementById(
      "available-items-container"
    );
    console.log("Available container found:", availableContainer);

    if (availableContainer) {
      availableContainer.style.display = "block";
      availableContainer.classList.add("editing");
    }

    // Create wrapper and elements
    console.log("Creating confirm wrapper and elements...");
    const confirmWrapper = document.createElement("div");
    confirmWrapper.className = "confirm-trade-wrapper";

    // Update confirm button BEFORE moving it
    console.log("Updating confirm button properties...");
    confirmButton.innerHTML = '<i class="bi bi-save"></i> Update Trade';
    confirmButton.className = "btn btn-primary";
    confirmButton.style.display = "block";
    confirmButton.onclick = () => updateTradeAd(tradeId);

    const statusContainer = document.createElement("div");
    statusContainer.className = "status-container";
    statusContainer.innerHTML = `
      <label for="trade-status-select" class="form-label">Trade Status</label>
      <select id="trade-status-select" class="form-select">
        <option value="Pending" ${
          trade.status === "Pending" ? "selected" : ""
        }>Pending</option>
        <option value="Completed" ${
          trade.status === "Completed" ? "selected" : ""
        }>Completed</option>
      </select>
    `;

    // Create cancel button
    const cancelButton = document.createElement("button");
    cancelButton.className = "btn btn-secondary";
    cancelButton.innerHTML = '<i class="bi bi-x-circle"></i> Cancel Edit';
    cancelButton.onclick = () => {
      if (
        confirm(
          "Are you sure you want to cancel editing? All changes will be lost."
        )
      ) {
        resetTrade();
        window.location.href = "/trading";
      }
    };

    // Create button container
    const buttonContainer = document.createElement("div");
    buttonContainer.className = "button-container";

    // Clone the confirm button instead of moving it
    const confirmButtonClone = confirmButton.cloneNode(true);
    confirmButtonClone.onclick = () => updateTradeAd(tradeId);

    console.log("Adding buttons to container...");
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButtonClone);

    // Add elements to wrapper
    confirmWrapper.appendChild(statusContainer);
    confirmWrapper.appendChild(buttonContainer);

    // Add wrapper to container
    console.log("Adding wrapper to available container...");
    availableContainer.appendChild(confirmWrapper);

    // Now remove the original button
    if (confirmButton.parentNode) {
      confirmButton.parentNode.removeChild(confirmButton);
    }

    // Load items
    const offeringIds = trade.offering.split(",").filter((id) => id);
    const requestingIds = trade.requesting.split(",").filter((id) => id);

    let loadedOfferingItems = 0;
    let loadedRequestingItems = 0;

    // Load offering items
    for (const id of offeringIds) {
      const item = await fetchItemDetails(id);
      if (item) {
        addItemToTrade(item, "Offer");
        loadedOfferingItems++;
      }
    }

    // Load requesting items
    for (const id of requestingIds) {
      const item = await fetchItemDetails(id);
      if (item) {
        addItemToTrade(item, "Request");
        loadedRequestingItems++;
      }
    }

    console.log(
      "Items loaded - Offering:",
      loadedOfferingItems,
      "Requesting:",
      loadedRequestingItems
    );

    // Verify final state
    console.log("Final button state:", {
      exists: !!document.getElementById("confirm-trade-btn"),
      display: document.getElementById("confirm-trade-btn")?.style.display,
      className: document.getElementById("confirm-trade-btn")?.className,
      innerHTML: document.getElementById("confirm-trade-btn")?.innerHTML,
    });
  } catch (error) {
    console.error("Error in editTradeAd:", error);
    toastr.error("Failed to load trade for editing");
    const url = new URL(window.location);
    url.searchParams.delete("edit");
    window.history.replaceState({}, "", url);
  }
}

async function updateTradeAd(tradeId) {
  try {
    const token = Cookies.get("token");
    if (!token) {
      toastr.error("Please login to update trade advertisements");
      return;
    }

    if (!confirm("Are you sure you want to update this trade advertisement?")) {
      return;
    }

    // Get the selected status from the dropdown
    const statusSelect = document.getElementById("trade-status-select");
    const selectedStatus = statusSelect ? statusSelect.value : "Pending";

    const offeringList = Object.values(offeringItems).filter((item) => item);
    const requestingList = Object.values(requestingItems).filter(
      (item) => item
    );

    if (!offeringList.length || !requestingList.length) {
      toastr.error("Please add items to both sides of the trade");
      return;
    }

    const url = `https://api3.jailbreakchangelogs.xyz/trades/update?id=${tradeId}&token=${token}`;

    const tradeData = {
      offering: offeringList.map((item) => item.id).join(","),
      requesting: requestingList.map((item) => item.id).join(","),
      status: selectedStatus,
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(tradeData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Update trade error:", errorData);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    toastr.success("Trade advertisement updated successfully!");

    // Store the button reference before resetting
    const confirmButton = document.getElementById("confirm-trade-btn");

    // Reset trade (which might remove the button)
    resetTrade();

    // Update button if it still exists
    if (confirmButton) {
      confirmButton.innerHTML =
        '<i class="bi bi-plus-circle"></i> Create Trade';
      confirmButton.onclick = previewTrade;
    } else {
      console.warn("Confirm button not found after reset");
    }

    await loadTradeAds(); // Refresh trade ads list
  } catch (error) {
    console.error("Error updating trade:", error);
    toastr.error("Failed to update trade advertisement");
  }
}

// Add these variables at the top with other global variables
const TRADES_PER_PAGE = 6;
let currentTradesPage = 1;
let allTradeAds = [];

// Function to create a trade ad
async function loadTradeAds() {
  try {
    const tradeAdsSection = document.querySelector(".trade-ads-section");
    if (!tradeAdsSection) {
      console.error("Trade ads section not found");
      return;
    }

    // First fetch just the count to know how many skeletons to show
    const countResponse = await fetch(
      "https://api3.jailbreakchangelogs.xyz/trades/list"
    );
    const data = await countResponse.json();
    const expectedCount = Array.isArray(data)
      ? Math.min(data.length, TRADES_PER_PAGE)
      : 0;

    // Show skeleton loading state with the expected number of items
    tradeAdsSection.innerHTML = `
    <div class="trade-ads-grid">
      <div class="trade-ad header-container">
        <h3 class="trade-ads-header"><i class="bi bi-clock-history me-2"></i>Recent Trade Advertisements</h3>
      </div>
      ${Array(expectedCount).fill(createSkeletonTradeAd()).join("")}
    </div>
  `;

    // Process the already fetched data
    allTradeAds = Array.isArray(data) ? data : [];

    if (allTradeAds.length === 0) {
      tradeAdsSection.innerHTML = `
        <div class="trade-ads-grid">
          <div class="trade-ad header-container">
            <h3 class="trade-ads-header"><i class="bi bi-clock-history me-2"></i>Recent Trade Advertisements</h3>
            <div class="no-trades-message">No trade advertisements found</div>
          </div>
        </div>
      `;
      return;
    }

    // Calculate pagination
    const totalPages = Math.ceil(allTradeAds.length / TRADES_PER_PAGE);
    const startIndex = (currentTradesPage - 1) * TRADES_PER_PAGE;
    const endIndex = startIndex + TRADES_PER_PAGE;
    const currentPageTrades = allTradeAds.slice(startIndex, endIndex);

    // Create HTML for current page trades
    const tradePromises = currentPageTrades.map((trade) =>
      createTradeAdHTML(trade)
    );
    const tradeHTMLs = await Promise.all(tradePromises);

    tradeAdsSection.innerHTML = `
      <div class="trade-ads-grid">
        <div class="trade-ad header-container">
          <h3 class="trade-ads-header"><i class="bi bi-clock-history me-2"></i>Recent Trade Advertisements</h3>
        </div>
        ${tradeHTMLs.join("")}
      </div>
      ${
        totalPages > 1
          ? `
        <div class="trade-ads-pagination">
          <button class="pagination-button" onclick="changeTradesPage(${
            currentTradesPage - 1
          })" ${currentTradesPage === 1 ? "disabled" : ""}>
            <i class="bi bi-chevron-left"></i>
          </button>
          <span class="pagination-info">Page ${currentTradesPage} of ${totalPages}</span>
          <button class="pagination-button" onclick="changeTradesPage(${
            currentTradesPage + 1
          })" ${currentTradesPage === totalPages ? "disabled" : ""}>
            <i class="bi bi-chevron-right"></i>
          </button>
        </div>
      `
          : ""
      }
    `;
  } catch (error) {
    console.error("Error loading trade ads:", error);
    toastr.error("Failed to load trade ads");
  }
}

function changeTradesPage(newPage) {
  if (
    newPage >= 1 &&
    newPage <= Math.ceil(allTradeAds.length / TRADES_PER_PAGE)
  ) {
    currentTradesPage = newPage;
    loadTradeAds();
  }
}

// Update the document ready event listener
document.addEventListener("DOMContentLoaded", async () => {
  // Load items first
  await loadItems();

  // Check for edit parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  const editTradeId = urlParams.get("edit");
  if (editTradeId) {
    // Trigger edit functionality
    editTradeAd(editTradeId);
  }

  // Then load trade ads
  await loadTradeAds();

  // Rest of the initialization code...
  const isReturnFromAuth = document.referrer.includes("/roblox");

  const pendingTrade = localStorage.getItem("pendingTrade");
  if (pendingTrade) {
    try {
      const { side1, side2 } = JSON.parse(pendingTrade);
      side1.forEach((item) => addItemToTrade(item, "Offer"));
      side2.forEach((item) => addItemToTrade(item, "Request"));
      localStorage.removeItem("pendingTrade");
      if (isReturnFromAuth) {
        previewTrade();
      }
    } catch (err) {
      console.error("Error restoring pending trade:", err);
      toastr.error("Failed to restore your pending trade");
    }
  }

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Initial renders
  renderTradeItems("Offer");
  renderTradeItems("Request");

  // Make sure preview section exists
  const previewSection = document.getElementById("trade-preview");
  if (!previewSection) {
    console.warn("Trade preview section not found in DOM");
  }
});

// Function to fetch item details by ID
async function fetchItemDetails(id) {
  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/items/get?id=${id}`
    );
    return await response.json();
  } catch (error) {
    console.error(`Error fetching item ${id}:`, error);
    return null;
  }
}

async function fetchUserDetails(userId) {
  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get/?id=${userId}`
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching user ${userId}:`, error);
    return null;
  }
}

// Updated createTradeAdHTML function
async function createTradeAdHTML(trade) {
  // Start with a skeleton template
  const container = document.createElement("div");
  container.innerHTML = createSkeletonTradeAd();
  const tradeAdElement = container.firstElementChild;

  try {
    // Fetch user details first
    const authorDetails = await fetchUserDetails(trade.author);

    // Helper function to fetch avatar with format fallbacks
    async function getAvatarUrl(userId, avatarHash) {
      if (!userId || !avatarHash) return null;

      // Try formats in order: gif -> webp -> png
      const formats = ["gif", "webp", "png"];
      for (const format of formats) {
        try {
          const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}?size=4096`;
          const response = await fetch(url, { method: "HEAD" });
          if (response.ok) return url;
        } catch (error) {
          console.error(`Error checking ${format} avatar:`, error);
          continue;
        }
      }
      return null;
    }

    // Get avatar URL with format fallbacks
    let avatarUrl;
    if (authorDetails?.avatar) {
      avatarUrl = await getAvatarUrl(trade.author, authorDetails.avatar);
    }

    // Fallback to default avatar if no Discord avatar found
    if (!avatarUrl) {
      avatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        authorDetails?.username || "Unknown"
      )}&bold=true&format=svg`;
    }

    // Process item counts for multipliers
    const itemCounts = {};
    trade.offering.split(",").forEach((id) => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });
    trade.requesting.split(",").forEach((id) => {
      itemCounts[id] = (itemCounts[id] || 0) + 1;
    });

    // Create item HTML helper function
    const createItemHTML = async (itemId) => {
      const item = await fetchItemDetails(itemId);
      if (!item) return "";

      const count = itemCounts[itemId];
      const multiplierHTML =
        count > 1 ? `<div class="item-multiplier">×${count}</div>` : "";

      const cashValueClass =
        item.cash_value !== "N/A" ? "value-available" : "value-na";
      const dupedValueClass =
        item.duped_value !== "N/A" ? "value-available" : "value-na";

      // Special handling for HyperShift
      if (item.name === "HyperShift") {
        return `
          <div class="trade-ad-item" onclick="showBottomSheet(${JSON.stringify(
            item
          ).replace(/"/g, "&quot;")})">
            <div class="trade-ad-item-content">
              <div class="item-image-container">
                <img src="/assets/images/items/hyperchromes/HyperShift.gif" alt="${
                  item.name
                }">
                ${multiplierHTML}
              </div>
              <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-values">
                  <div class="value-badge ${cashValueClass}">
                    <span class="value-label">Cash Value:</span>
                    <span class="value-amount">${formatValue(
                      item.cash_value,
                      true
                    )}</span>
                  </div>
                  <div class="value-badge ${dupedValueClass}">
                    <span class="value-label">Duped Value:</span>
                    <span class="value-amount">${formatValue(
                      item.duped_value,
                      true
                    )}</span>
                  </div>
                  <div class="value-badge">
                    <span class="value-label">Type:</span>
                    <span class="value-amount">${item.type}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>`;
      }

      // Regular items
      const imageUrl =
        item.type === "Drift"
          ? `/assets/images/items/drifts/thumbnails/${item.name}.webp`
          : `/assets/items/${item.type.toLowerCase()}s/${item.name}.webp`;

      return `
        <div class="trade-ad-item" onclick="showBottomSheet(${JSON.stringify(
          item
        ).replace(/"/g, "&quot;")})">
          <div class="trade-ad-item-content">
            <div class="item-image-container">
              <img src="${imageUrl}" 
                   alt="${item.name}"
                   onerror="this.src='https://placehold.co/2560x1440/212A31/D3D9D4?text=No+Image+Available&font=Montserrat'">
              ${multiplierHTML}
            </div>
            <div class="item-details">
              <div class="item-name">${item.name}</div>
              <div class="item-values">
                <div class="value-badge ${cashValueClass}">
                  <span class="value-label">Cash Value:</span>
                  <span class="value-amount">${formatValue(
                    item.cash_value,
                    true
                  )}</span>
                </div>
                <div class="value-badge ${dupedValueClass}">
                  <span class="value-label">Duped Value:</span>
                  <span class="value-amount">${formatValue(
                    item.duped_value,
                    true
                  )}</span>
                </div>
                <div class="value-badge">
                  <span class="value-label">Type:</span>
                  <span class="value-amount">${item.type}</span>
                </div>
              </div>
            </div>
          </div>
        </div>`;
    };

    // Fetch and process items with deduplication
    const [offeringItemsHtml, requestingItemsHtml] = await Promise.all([
      Promise.all(
        [...new Set(trade.offering.split(","))]
          .filter((id) => id)
          .map(createItemHTML)
      ),
      Promise.all(
        [...new Set(trade.requesting.split(","))]
          .filter((id) => id)
          .map(createItemHTML)
      ),
    ]);

    function getFallbackAvatar(username) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        username || "Unknown"
      )}&bold=true&format=svg`;
    }

    tradeAdElement.innerHTML = `
      <div class="trade-ad">
       <div class="trader-info">
        <div class="trader-info">
         <img src="${
           authorDetails?.roblox_avatar ||
           getFallbackAvatar(authorDetails?.roblox_username)
         }" 
          alt="${authorDetails?.roblox_username || "Unknown"}" 
          class="trader-avatar"
          onerror="this.onerror=null; this.src='${getFallbackAvatar(
            authorDetails?.roblox_username
          )}'"
          width="64"
          height="64">
          <div class="trader-details">
            <a href="https://www.roblox.com/users/${
              authorDetails?.roblox_id
            }/profile" 
              class="trader-name"
              target="_blank" 
              rel="noopener noreferrer">
              ${authorDetails?.roblox_display_name || "Unknown"} 
              <span class="text-muted">(${
                authorDetails?.roblox_id || "Unknown ID"
              })</span>
            </a>
            <a href="https://www.roblox.com/users/${
              authorDetails?.roblox_id
            }/profile" 
              class="trader-username text-muted" 
              target="_blank" 
              rel="noopener noreferrer">
              @${authorDetails?.roblox_username || "unknown"}
            </a>
          </div>
        </div>



        </div>

        <div class="trade-sides-container">
          <div class="trade-side offering">
            <div class="trade-side-label">Offering</div>
            <div class="trade-items-grid">
              ${offeringItemsHtml.join("")}
            </div>
          </div>

          <div class="trade-side requesting">
            <div class="trade-side-label">Requesting</div>
            <div class="trade-items-grid">
              ${requestingItemsHtml.join("")}
            </div>
          </div>
        </div>

        <div class="trade-ad-footer">
          <div class="trade-timestamp">
            <i class="bi bi-clock"></i> ${formatTimestamp(trade.created_at)}
          </div>
          <div class="d-flex align-items-center gap-2">
            <a href="/trading/ad/${String(
              trade.id
            )}" class="btn btn-sm btn-outline-info">
              <i class="bi bi-eye"></i> View Details
            </a>
            ${
              authorDetails?.id === currentUserId
                ? `
                <button class="btn btn-sm btn-outline-primary" onclick="editTradeAd('${String(
                  trade.id
                )}')">
                  <i class="bi bi-pencil"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteTradeAd('${String(
                  trade.id
                )}')">
                  <i class="bi bi-trash"></i>
                </button>
                `
                : ""
            }
          <div class="trade-status ${(
            trade.status || "Pending"
          ).toLowerCase()}">
            ${trade.status || "Pending"}
          </div>

          </div>
        </div>
      </div>`;
  } catch (error) {
    console.error("Error creating trade ad:", error);
    // Keep the skeleton state if there's an error
  }

  return tradeAdElement.outerHTML;
}

// Helper function to format timestamp
function formatTimestamp(timestamp) {
  // Convert Unix timestamp to milliseconds if it's in seconds
  const timestampMs =
    timestamp.toString().length === 10 ? timestamp * 1000 : timestamp;
  const date = new Date(timestampMs);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600)
    return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400)
    return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)} days ago`;

  // For older dates, return formatted date
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Add event listeners when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're returning from Roblox auth
  const isReturnFromAuth = document.referrer.includes("/roblox");

  // Check for pending trade and restore if needed
  const pendingTrade = localStorage.getItem("pendingTrade");
  if (pendingTrade) {
    try {
      const { side1, side2 } = JSON.parse(pendingTrade);
      // Restore trade items
      side1.forEach((item) => addItemToTrade(item, "Offer"));
      side2.forEach((item) => addItemToTrade(item, "Request"));
      // Clear pending trade
      localStorage.removeItem("pendingTrade");
      // Show preview if returning from auth
      if (isReturnFromAuth) {
        previewTrade();
      }
    } catch (err) {
      console.error("Error restoring pending trade:", err);
      toastr.error("Failed to restore your pending trade");
    }
  }

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Initial renders
  renderTradeItems("Offer");
  renderTradeItems("Request");
});

// Initial Render
renderTradeItems("Offer");
renderTradeItems("Request");

async function previewTrade() {
  if (!(await canCreateTradeAd())) {
    return;
  }
  // Get elements with error checking
  const previewSection = document.getElementById("trade-preview");
  const availableContainer = document.getElementById(
    "available-items-container"
  );
  const confirmButton = document.getElementById("confirm-trade-btn");

  // Check if required elements exist
  if (!previewSection || !availableContainer || !confirmButton) {
    console.error("Required elements not found in the DOM");
    toastr.error("An error occurred while preparing the trade preview");
    return;
  }

  const hasOfferingItems = Object.values(offeringItems).some((item) => item);
  const hasRequestingItems = Object.values(requestingItems).some(
    (item) => item
  );

  if (!hasOfferingItems || !hasRequestingItems) {
    toastr.error(
      "Please add at least one item to both offering and requesting sections"
    );
    return;
  }

  // Show/hide sections
  previewSection.style.display = "block";
  availableContainer.style.display = "none";
  confirmButton.style.display = "none";

  // Render preview items
  renderPreviewItems("preview-offering-items", offeringItems);
  renderPreviewItems("preview-requesting-items", requestingItems);

  // Add preview actions
  const valueDifferencesContainer =
    document.getElementById("value-differences");
  valueDifferencesContainer.innerHTML = renderValueDifferences();

  // Add preview actions
  const previewActions = document.createElement("div");
  previewActions.className = "preview-actions mt-4 text-center";
  previewActions.innerHTML = `
  <button class="btn btn-primary" onclick="createTradeAd()">
    <i class="bi bi-plus-circle me-2"></i>Create Trade Ad
  </button>
`;
  valueDifferencesContainer.after(previewActions);
}

function renderPreviewItems(containerId, items) {
  const container = document.getElementById(containerId);
  const values = calculateSideValues(items);

  // Count duplicates
  const itemCounts = new Map();
  Object.values(items)
    .filter((item) => item)
    .forEach((item) => {
      const itemKey = `${item.name}-${item.type}`;
      itemCounts.set(itemKey, (itemCounts.get(itemKey) || 0) + 1);
    });

  // Create unique items array with counts
  const uniqueItems = [];
  const processedKeys = new Set();

  Object.values(items)
    .filter((item) => item)
    .forEach((item) => {
      const itemKey = `${item.name}-${item.type}`;
      if (!processedKeys.has(itemKey)) {
        processedKeys.add(itemKey);
        uniqueItems.push({
          item,
          count: itemCounts.get(itemKey),
        });
      }
    });

  const itemsHtml = uniqueItems
    .map(
      ({ item, count }) => `
      <div class="preview-item">
        <div class="preview-item-image-container">
          ${getItemImageElement(item)}
          ${count > 1 ? `<div class="item-multiplier">×${count}</div>` : ""}
        </div>
        <div class="item-name">${item.name}</div>
      </div>
    `
    )
    .join("");

  const valuesHtml = `
    <div class="side-values-summary">
      <h6>
        <i class="bi bi-calculator me-2"></i>
        ${
          containerId === "preview-offering-items" ? "Offering" : "Requesting"
        } Totals
      </h6>
      <div class="side-value-row">
        <span class="text-muted">Cash Value:</span>
        <span class="badge" style="background-color: ${
          containerId === "preview-offering-items" ? "#00c853" : "#2196f3"
        }">${formatValue(values.cashValue, true)}</span>
      </div>
      <div class="side-value-row">
        <span class="text-muted">Duped Value:</span>
        <span class="badge" style="background-color: ${
          containerId === "preview-offering-items" ? "#00c853" : "#2196f3"
        }">${formatValue(values.dupedValue, true)}</span>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="preview-items-grid">
      ${itemsHtml}
    </div>
    ${valuesHtml}
  `;
}

function calculateSideValues(items) {
  const cashValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.cash_value || 0), 0);

  const dupedValue = Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => sum + parseValue(item.duped_value || 0), 0);

  return { cashValue, dupedValue };
}

function renderValueDifferences() {
  const offerValues = calculateSideValues(offeringItems);
  const requestValues = calculateSideValues(requestingItems);

  const cashDiff = requestValues.cashValue - offerValues.cashValue;
  const dupedDiff = requestValues.dupedValue - offerValues.dupedValue;

  return `
    <div class="value-differences">
      <h6 class="difference-title">
        <i class="bi bi-arrow-left-right me-2"></i>Value Differences
      </h6>
      <div class="difference-content">
        <div class="difference-row">
          <div class="difference-label">
            <span>Cash Value Difference:</span>
            <span class="difference-value ${
              cashDiff >= 0 ? "positive" : "negative"
            }">
              ${cashDiff >= 0 ? "+" : ""}${formatValue(cashDiff, true)}
            </span>
          </div>
          <div class="difference-indicator">
            <i class="bi ${
              cashDiff > 0
                ? "bi-arrow-up-circle-fill text-success"
                : cashDiff < 0
                ? "bi-arrow-down-circle-fill text-danger"
                : "bi-dash-circle-fill text-muted"
            }"></i>
          </div>
        </div>
        <div class="difference-row">
          <div class="difference-label">
            <span>Duped Value Difference:</span>
            <span class="difference-value ${
              dupedDiff >= 0 ? "positive" : "negative"
            }">
              ${dupedDiff >= 0 ? "+" : ""}${formatValue(dupedDiff, true)}
            </span>
          </div>
          <div class="difference-indicator">
            <i class="bi ${
              dupedDiff > 0
                ? "bi-arrow-up-circle-fill text-success"
                : dupedDiff < 0
                ? "bi-arrow-down-circle-fill text-danger"
                : "bi-dash-circle-fill text-muted"
            }"></i>
          </div>
        </div>
      </div>
    </div>
  `;
}
function editTrade() {
  // Hide preview and show original sections
  document.getElementById("trade-preview").style.display = "none";
  document.getElementById("available-items-container").style.display = "block";
  document.getElementById("confirm-trade-btn").style.display = "block";

  // Remove preview actions
  const previewActions = document.querySelector(".preview-actions");
  if (previewActions) {
    previewActions.remove();
  }
}

async function submitTrade() {
  // Show a simple message when trade is submitted
  toastr.info("This is a demo version. Trade submission is disabled.");

  if (submitButton) {
    submitButton.disabled = false;
    submitButton.innerHTML = '<i class="bi bi-upload me-2"></i>Post Trade';
  }
}

function calculateTotalValue(items, valueType) {
  return Object.values(items)
    .filter((item) => item)
    .reduce((sum, item) => parseValue(item[valueType] || 0), 0);
}
function resetTrade() {
  try {
    console.log("Starting resetTrade...");
    // Clear items
    offeringItems.length = 0;
    requestingItems.length = 0;

    // Reset UI
    renderTradeItems("Offer");
    renderTradeItems("Request");
    updateTradeSummary();

    // Get DOM elements
    const previewSection = document.getElementById("trade-preview");
    const availableContainer = document.getElementById(
      "available-items-container"
    );
    const confirmButton = document.getElementById("confirm-trade-btn");

    console.log("Reset trade - elements found:", {
      previewSection: !!previewSection,
      availableContainer: !!availableContainer,
      confirmButton: !!confirmButton,
    });

    // Remove editing class if container exists
    if (availableContainer) {
      availableContainer.classList.remove("editing");
    }

    // Remove the confirm wrapper if it exists
    const confirmWrapper = document.querySelector(".confirm-trade-wrapper");
    if (confirmWrapper) {
      console.log("Removing confirm wrapper");
      confirmWrapper.remove();
    }

    // Handle confirm button if it exists
    if (confirmButton) {
      console.log("Resetting confirm button state");
      confirmButton.innerHTML =
        '<i class="bi bi-plus-circle"></i> Create Trade';
      confirmButton.onclick = previewTrade;

      // Only try to append if both container and button exist
      if (availableContainer) {
        console.log("Re-appending confirm button to available container");
        availableContainer.appendChild(confirmButton);
      }
    }

    // Update visibility
    if (previewSection) {
      previewSection.style.display = "none";
    }
    if (availableContainer) {
      availableContainer.style.display = "block";
    }

    console.log("Reset trade complete");
  } catch (error) {
    console.error("Error in resetTrade:", error);
    toastr.error("An error occurred while resetting the trade");
  }
}

// Function to create a trade advertisement
async function createTradeAd() {
  if (!(await canCreateTradeAd())) {
    return;
  }
  try {
    // Check for authentication token first
    const token = Cookies.get("token");
    if (!token) {
      toastr.error("Please login to create a trade advertisement");
      return;
    }

    // Get user ID from session storage
    const userId = sessionStorage.getItem("userid");
    if (!userId) {
      toastr.error("User session not found. Please login again");
      return;
    }

    // Get items from both sides
    const offeringList = Object.values(offeringItems).filter((item) => item);
    const requestingList = Object.values(requestingItems).filter(
      (item) => item
    );

    // Validate trade
    if (!offeringList.length || !requestingList.length) {
      toastr.error("Please add items to both sides of the trade");
      return;
    }

    // Prepare trade data
    const tradeData = {
      offering: offeringList.map((item) => item.id).join(","),
      requesting: requestingList.map((item) => item.id).join(","),
      owner: token,
    };

    // Make API call to create trade
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/trades/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradeData),
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // On success
    toastr.success("Trade advertisement created successfully!");
    resetTrade();

    // Update UI
    document.getElementById("trade-preview").style.display = "none";
    document.getElementById("available-items-container").style.display =
      "block";
    document.getElementById("confirm-trade-btn").style.display = "block";

    // Refresh trade ads list
    await loadTradeAds();
  } catch (error) {
    console.error("Error creating trade:", error);
    toastr.error("Failed to create trade advertisement");
  }
  // Initialize bottom sheet
  initializeBottomSheet();

  // Add resize handler to hide bottom sheet on desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 768 && activeBottomSheet) {
      hideBottomSheet();
    }
  });
}
