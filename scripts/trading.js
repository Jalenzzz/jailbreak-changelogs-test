// Initial items
const offeringItems = [];
const requestingItems = [];

// Helper to render items
function renderItems(containerId, items) {
  const container = document.getElementById(containerId);
  container.innerHTML = "";
  items.forEach((item, index) => {
    const itemCard = `
      <div class="col-md-3 mb-4">
        <div class="card shadow-sm">
          <div class="card-body text-center">
            <h5 class="card-title">${item.name}</h5>
            <p class="card-text">Value: $${item.value}</p>
            <button class="btn btn-danger btn-sm remove-item" data-index="${index}" data-container="${containerId}">
              <i class="bi bi-trash"></i> Remove
            </button>
          </div>
        </div>
      </div>
    `;
    container.insertAdjacentHTML("beforeend", itemCard);
  });

  // Add remove functionality
  document.querySelectorAll(`#${containerId} .remove-item`).forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const index = parseInt(btn.getAttribute("data-index"));
      const container = btn.getAttribute("data-container");
      if (container === "offering-list") {
        offeringItems.splice(index, 1);
        renderItems("offering-list", offeringItems);
      } else if (container === "requesting-list") {
        requestingItems.splice(index, 1);
        renderItems("requesting-list", requestingItems);
      }
      toggleConfirmButton();
    });
  });
}

// Add offering item
document.getElementById("add-offering").addEventListener("click", () => {
  if (offeringItems.length < 8) {
    const newItem = {
      name: `Offering Item ${offeringItems.length + 1}`,
      value: Math.floor(Math.random() * 10000) + 1000
    };
    offeringItems.push(newItem);
    renderItems("offering-list", offeringItems);
    toggleConfirmButton();
  } else {
    toastr.error("You can only add up to 8 offerings.");
  }
});

// Add requesting item
document.getElementById("add-requesting").addEventListener("click", () => {
  if (requestingItems.length < 8) {
    const newItem = {
      name: `Requesting Item ${requestingItems.length + 1}`,
      value: Math.floor(Math.random() * 10000) + 1000
    };
    requestingItems.push(newItem);
    renderItems("requesting-list", requestingItems);
    toggleConfirmButton();
  } else {
    toastr.error("You can only add up to 8 requestings.");
  }
});

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
    // Example: Send trade details to a backend (use AJAX or Fetch)
    console.log("Trade Confirmed!");
    console.log("Offering:", offeringItems);
    console.log("Requesting:", requestingItems);

    toastr.success("Trade has been confirmed!");
    
    // Clear items after confirmation
    offeringItems.length = 0;
    requestingItems.length = 0;
    renderItems("offering-list", offeringItems);
    renderItems("requesting-list", requestingItems);
    toggleConfirmButton();
  }
});

// Initial Render
renderItems("offering-list", offeringItems);
renderItems("requesting-list", requestingItems);