// Store all items and current trade items
let allItems = [];
const offeringItems = [];
const requestingItems = [];
let currentTradeType = "offering"; // Set default to "offering"

const ITEMS_PER_PAGE = 96;
let currentPage = 1;
let filteredItems = [];

// Fetch all items on load
async function loadItems() {
  try {
    const response = await fetch(
      "https://api.jailbreakchangelogs.xyz/items/list"
    );
    allItems = await response.json();

    currentTradeType = "offering";

    const title = document.getElementById("available-items-title");
    if (title) {
      title.textContent = "Add Items to Offer";
    }

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
function addItemToTrade(item, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  if (items.length >= 8) {
    toastr.error(`You can only add up to 8 items to ${tradeType}`);
    return;
  }

  // Check if item with same name AND type already exists
  const isDuplicate = items.some(
    (existingItem) =>
      existingItem.name === item.name && existingItem.type === item.type
  );

  if (isDuplicate) {
    toastr.error(`${item.name} (${item.type}) is already in your ${tradeType}`);
    return;
  }

  items.push(item);
  renderTradeItems(tradeType);
  updateTradeSummary();

  // Refresh current available items view if container is visible
  if (currentTradeType) {
    displayAvailableItems(currentTradeType);
  }
}

// Function to quickly add item from available items
function quickAddItem(itemName, itemType) {
  const item = allItems.find((i) => i.name === itemName && i.type === itemType);
  if (!item) return;

  // Use the global selection state
  if (selectedPlaceholderIndex !== -1 && selectedTradeType) {
    const items =
      selectedTradeType === "Offer" ? offeringItems : requestingItems;

    // Check limits and duplicates
    // ...existing validation code...

    // Calculate the correct insertion index based on the clicked placeholder
    // selectedPlaceholderIndex is absolute position (0-7)
    // Adjust index based on how many slots are already filled
    const insertionIndex = selectedPlaceholderIndex;

    console.log("Inserting item:", {
      item,
      selectedIndex: selectedPlaceholderIndex,
      insertAt: insertionIndex,
      currentItems: [...items],
      totalSlots: 8,
      filledSlots: items.length,
    });

    // Insert at the exact selected position
    items[insertionIndex] = item;

    // Store type before clearing selection
    const currentType = selectedTradeType;

    // Clear selection state
    document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
      slot.classList.remove("selected");
    });
    selectedPlaceholderIndex = -1;
    selectedTradeType = null;

    // Update UI
    renderTradeItems(currentType);
    updateTradeSummary();
    displayAvailableItems(currentTradeType);
  } else {
    // Original fallback behavior
    addItemToTrade(item, currentTradeType === "offering" ? "Offer" : "Request");
  }
}

// Remove item from trade
function removeItem(index, tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  items.splice(index, 1);
  renderTradeItems(tradeType);
  updateTradeSummary();

  // Refresh available items display
  displayAvailableItems("offering");
  displayAvailableItems("requesting");
}

// Function to toggle available items display
function toggleAvailableItems(type) {
  const container = document.getElementById("available-items-container");
  const title = document.getElementById("available-items-title");

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

  // Clear search when switching
  if (document.getElementById("item-search")) {
    document.getElementById("item-search").value = "";
  }

  // Display available items
  displayAvailableItems(type);
}

// Function to display available items
function displayAvailableItems(type) {
  const container = document.getElementById("available-items-list");
  const usedItems = type === "offering" ? offeringItems : requestingItems;
  const searchInput = document.getElementById("item-search");
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  // Filter items
  filteredItems = allItems.filter((item) => {
    const nameMatch = item.name.toLowerCase().includes(searchTerm);
    const notInUse = !usedItems.some(
      (usedItem) => usedItem.name === item.name && usedItem.type === item.type
    );
    return nameMatch && notInUse;
  });

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

  // Render pagination controls
  renderPagination(totalPages, type);

  // Render items with corrected parameters
  container.innerHTML = itemsToDisplay
    .map(
      (item) => `
  <div class="col-6 col-md-3 col-lg-2 mb-2">
    <div class="card available-item-card" 
         onclick="quickAddItem('${item.name}', '${item.type}')">
      <div class="card-header">
        ${item.name}
      </div>
      <img src="https://cdn.jailbreakchangelogs.xyz/images/items/${item.type.toLowerCase()}s/${
        item.name
      }.webp" 
           class="card-img-top" 
           alt="${item.name}"
           onerror="this.src='https://cdn.jailbreakchangelogs.xyz/logos/Jailbreak_Logo.webp'">
      <div class="card-body">
        <div class="info-row">
          <span class="info-label">Type:</span>
          <span class="info-value">${item.type}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Cash Value:</span>
          <span class="info-value">${formatValue(item.cash_value)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Duped Value:</span>
          <span class="info-value">${formatValue(item.duped_value || 0)}</span>
        </div>
      </div>
    </div>
  </div>
`
    )
    .join("");
}

function renderPagination(totalPages, type) {
  const topPagination = document.getElementById("top-pagination");
  const bottomPagination = document.getElementById("bottom-pagination");
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
  if (bottomPagination) bottomPagination.innerHTML = paginationHTML;
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
  return value.toLocaleString();
}

let selectedPlaceholderIndex = -1;
let selectedTradeType = null;

// Function to create empty placeholder cards
function createPlaceholderCard(index, tradeType) {
  return `
    <div class="col-md-3 mb-3">
      <div class="card h-100 trade-card empty-slot" 
           onclick="handlePlaceholderClick(${index}, '${tradeType}')">
        <div class="card-img-container">
          <div class="empty-slot-content">
            <i class="bi bi-plus-circle"></i>
            <span>Empty Slot</span>
          </div>
        </div>
      </div>
    </div>
  `;
}

function handlePlaceholderClick(index, tradeType) {
  console.log("Placeholder clicked:", { index, tradeType });

  // Remove selected state from all slots
  document.querySelectorAll(".trade-card.empty-slot").forEach((slot) => {
    slot.classList.remove("selected");
  });

  // Add selected state to clicked slot
  event.currentTarget.classList.add("selected");

  // Update the global selection state
  selectedPlaceholderIndex = index;
  selectedTradeType = tradeType;

  console.log("Updated selection state:", {
    selectedPlaceholderIndex,
    selectedTradeType,
  });

  // Show available items container and set correct type
  const newTradeType = tradeType === "Offer" ? "offering" : "requesting";
  toggleAvailableItems(newTradeType);
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

// Modified renderTradeItems function
function renderTradeItems(tradeType) {
  const items = tradeType === "Offer" ? offeringItems : requestingItems;
  const containerId =
    tradeType.toLowerCase() === "offer" ? "offering-list" : "requesting-list";
  const container = document.getElementById(containerId);

  if (!container) return;

  // Create an array of 8 slots
  let slots = new Array(8).fill(null);

  // Place items in their exact positions
  Object.entries(items).forEach(([index, item]) => {
    if (item) slots[parseInt(index)] = item;
  });

  // Generate HTML for both items and empty slots
  let html = slots
    .map((item, index) => {
      if (item) {
        return `
        <div class="col-md-3 mb-3">
          <div class="card h-100 trade-card">
            <div class="card-img-container">
              <img src="https://cdn.jailbreakchangelogs.xyz/images/items/${item.type.toLowerCase()}s/${
          item.name
        }.webp" 
                   class="card-img-top" 
                   alt="${item.name}"
                   onerror="this.src='https://cdn.jailbreakchangelogs.xyz/logos/Jailbreak_Logo.webp'">
            </div>
            <div class="card-body">
              <h6 class="card-title">${item.name}</h6>
              <p class="card-text">Value: ${formatValue(item.cash_value)}</p>
              <button class="btn btn-danger btn-sm remove-item" onclick="removeItem(${index}, '${tradeType}')">
                <i class="bi bi-trash"></i> Remove
              </button>
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

// Update trade summary
function updateTradeSummary() {
  const offerValue = offeringItems.reduce(
    (sum, item) => sum + (item.cash_value || 0),
    0
  );
  const requestValue = requestingItems.reduce(
    (sum, item) => sum + (item.cash_value || 0),
    0
  );

  document.getElementById("trade-summary").innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5>Trade Summary</h5>
        <div class="d-flex justify-content-between mb-2">
          <span>Offering Value:</span>
          <span>${formatValue(offerValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Requesting Value:</span>
          <span>${formatValue(requestValue)}</span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Difference:</span>
          <span class="${
            offerValue >= requestValue ? "text-success" : "text-danger"
          }">
            ${formatValue(Math.abs(offerValue - requestValue))}
          </span>
        </div>
      </div>
    </div>
  `;
}

// Initialize
loadItems();

// Enable/Disable Confirm Trade Button
function toggleConfirmButton() {
  const confirmTradeButton = document.getElementById("confirm-trade");
  if (offeringItems.length > 0 && requestingItems.length > 0) {
    confirmTradeButton.removeAttribute("disabled");
  } else {
    confirmTradeButton.setAttribute("disabled", "true");
  }
}

// Confirm Trade
document.getElementById("confirm-trade").addEventListener("click", () => {
  if (offeringItems.length > 0 && requestingItems.length > 0) {
    toastr.success("Trade has been confirmed!");

    // Clear items after confirmation
    offeringItems.length = 0;
    requestingItems.length = 0;
    renderTradeItems("Offer");
    renderTradeItems("Request");
    toggleConfirmButton();
  }
});

// Add event listeners when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Add click listeners to toggle buttons
  document.querySelectorAll(".available-items-toggle").forEach((button) => {
    button.addEventListener("click", () => {
      toggleAvailableItems(button.dataset.type);
    });
  });

  // Initialize both sections with 8 empty slots
  renderEmptySlots("offering-list", 8);
  renderEmptySlots("requesting-list", 8);

  // Show the available items container by default
  document.getElementById("available-items-container").style.display = "block";
});

// Initial Render
renderTradeItems("Offer");
renderTradeItems("Request");
