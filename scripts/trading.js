// Configure toastr
toastr.options = {
  positionClass: "toast-bottom-right",
  closeButton: true,
  progressBar: true,
  preventDuplicates: true,
  timeOut: 3000,
};

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
      "https://api.jailbreakchangelogs.xyz/items/list"
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

    // Only check if the specific slot is empty
    if (items[selectedPlaceholderIndex]) {
      // If slot is filled, try to find next empty slot
      const nextEmptyIndex = findNextEmptySlot(items);
      if (nextEmptyIndex !== -1) {
        items[nextEmptyIndex] = item;
        renderTradeItems(selectedTradeType);
        updateTradeSummary();
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
  } else {
    // No placeholder selected, find first empty slot
    const items =
      currentTradeType === "offering" ? offeringItems : requestingItems;
    const emptyIndex = findNextEmptySlot(items);

    if (emptyIndex !== -1) {
      items[emptyIndex] = item;
      renderTradeItems(currentTradeType === "offering" ? "Offer" : "Request");
      updateTradeSummary();
    } else {
      toastr.error(
        `No empty slots available in ${
          currentTradeType === "offering" ? "Offer" : "Request"
        }`
      );
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
  // Instead of splicing, set the item at index to null to maintain positions
  delete items[index];

  // Update UI
  renderTradeItems(tradeType);
  updateTradeSummary();
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
  const searchTerm = searchInput ? searchInput.value.toLowerCase() : "";

  filteredItems = allItems.filter((item) => {
    return item.name.toLowerCase().includes(searchTerm);
  });

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const itemsToDisplay = filteredItems.slice(startIndex, endIndex);

  renderPagination(totalPages, type);

  container.innerHTML = itemsToDisplay
    .map(
      (item) => `
        <div class="col-custom-5">
          <div class="card available-item-card" 
               onclick="quickAddItem('${item.name}', '${item.type}')"
               data-bs-dismiss="modal">
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
                <span class="info-value">${formatValue(
                  item.duped_value || 0
                )}</span>
              </div>
            </div>
          </div>
        </div>
      `
    )
    .join("");
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

// Update handlePlaceholderClick function
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

  const cashDifference = offerCashValue - requestCashValue;
  const dupedDifference = offerDupedValue - requestDupedValue;

  document.getElementById("trade-summary").innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5>Trade Summary</h5>
        <div class="d-flex justify-content-between mb-2">
          <span>Offering Cash Value:</span>
          <span>${formatLargeNumber(offerCashValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Offering Duped Value:</span>
          <span>${formatLargeNumber(offerDupedValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Requesting Cash Value:</span>
          <span>${formatLargeNumber(requestCashValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Requesting Duped Value:</span>
          <span>${formatLargeNumber(requestDupedValue)}</span>
        </div>
        <div class="d-flex justify-content-between mb-2">
          <span>Cash Value Difference:</span>
          <span class="${cashDifference >= 0 ? "text-success" : "text-danger"}">
            ${cashDifference >= 0 ? "+" : ""}${formatLargeNumber(
    cashDifference
  )}
          </span>
        </div>
        <div class="d-flex justify-content-between">
          <span>Duped Value Difference:</span>
          <span class="${
            dupedDifference >= 0 ? "text-success" : "text-danger"
          }">
            ${dupedDifference >= 0 ? "+" : ""}${formatLargeNumber(
    dupedDifference
  )}
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

// Add event listeners when document is loaded
document.addEventListener("DOMContentLoaded", () => {
  // Check if we're returning from Roblox auth
  const isReturnFromAuth = document.referrer.includes("/roblox");

  // Check for pending trade and restore if needed
  const pendingTrade = localStorage.getItem("pendingTrade");
  if (pendingTrade) {
    try {
      console.log("Restoring pending trade after auth");
      const { side1, side2 } = JSON.parse(pendingTrade);
      // Restore trade items
      side1.forEach((item) => addItemToTrade(item, "Offer"));
      side2.forEach((item) => addItemToTrade(item, "Request"));
      // Clear pending trade
      localStorage.removeItem("pendingTrade");
      // Show preview if returning from auth
      if (isReturnFromAuth) {
        console.log("Showing trade preview");
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

function previewTrade() {
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

  // Hide available items container and show preview
  document.getElementById("available-items-list").style.display = "none";
  document.getElementById("confirm-trade-btn").style.display = "none";
  document.getElementById("trade-preview-container").style.display = "block";

  // Render preview items
  renderPreviewItems("preview-offering-items", offeringItems);
  renderPreviewItems("preview-requesting-items", requestingItems);
}

function renderPreviewItems(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = Object.values(items)
    .filter((item) => item)
    .map(
      (item) => `
      <div class="preview-item">
        <img src="https://cdn.jailbreakchangelogs.xyz/images/items/${item.type.toLowerCase()}s/${
        item.name
      }.webp" 
             alt="${item.name}"
             onerror="this.src='https://cdn.jailbreakchangelogs.xyz/logos/Jailbreak_Logo.webp'">
        <div class="item-name">${item.name}</div>
      </div>
    `
    )
    .join("");
}

function editTrade() {
  // Show available items container and hide preview
  document.getElementById("available-items-list").style.display = "block";
  document.getElementById("confirm-trade-btn").style.display = "block";
  document.getElementById("trade-preview-container").style.display = "none";
}

async function submitTrade() {
  // Show a simple message when trade is submitted
  toastr.info("This is a demo version. Trade submission is disabled.");

  // Reset button state after showing message
  const submitButton = document.querySelector(
    "#trade-preview-container .btn-success"
  );
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
  // Clear items
  offeringItems.length = 0;
  requestingItems.length = 0;

  // Reset UI
  renderTradeItems("Offer");
  renderTradeItems("Request");
  updateTradeSummary();

  // Hide preview
  document.getElementById("trade-preview-container").style.display = "none";
  document.getElementById("available-items-list").style.display = "block";
}
