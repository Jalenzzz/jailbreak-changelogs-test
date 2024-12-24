// Constants
const API_BASE_URL = "https://api.jailbreakchangelogs.xyz";
const DISCORD_CDN = "https://cdn.discordapp.com";
const MIN_SEARCH_LENGTH = 1;

const elements = {
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  usersGrid: document.getElementById("usersGrid"),
  loadingSpinner: document.getElementById("loading-spinner"),
  userResults: document.getElementById("user-results"),
};

// Message Templates
const messages = {
  minLength: `
    <div class="col-12 text-center py-5">
      <div class="search-message text-muted">
        <i class="bi bi-info-circle me-2"></i>
        Please enter at least ${MIN_SEARCH_LENGTH} character to search
      </div>
    </div>
  `,
  noResults: `
    <div class="col-12 text-center py-5">
      <div class="no-results-message text-muted">
        <i class="bi bi-search me-2"></i>
        No results found :(
      </div>
    </div>
  `,
};

// User Card Template
const createUserCard = (user) => {
  const avatar = `${DISCORD_CDN}/avatars/${user.id}/${user.avatar}.png`;
  return `
   <div class="col-12 col-md-6 col-lg-4">
    <div class="card user-card border-0 shadow-sm h-100">
      <div class="card-body p-3">
        <div class="d-flex align-items-center gap-2">
          <img 
            src="${avatar}"
            class="user-avatar rounded-circle flex-shrink-0" 
            alt="${user.username}"
            width="60"
            height="60"
            onerror="this.src='https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg'"
          >
          <div class="user-info overflow-hidden flex-grow-1">
            <h5 class="user-name text-truncate mb-1 fs-6">${user.global_name}</h5>
            <p class="user-username text-muted small mb-0">@${user.username}</p>
          </div>
          <a href="/users/${user.id}" class="btn btn-primary btn-sm rounded-pill ms-2">
            View
          </a>
        </div>
      </div>
    </div>
  </div>
  `;
};

// Display Functions
const showLoading = () => {
  elements.usersGrid.style.display = "none";
  elements.loadingSpinner.style.display = "flex";
  elements.userResults.style.display = "block";
};

const hideLoading = () => {
  elements.loadingSpinner.style.display = "none";
  elements.usersGrid.style.display = "block";
};

const showMessage = (message) => {
  elements.loadingSpinner.style.display = "none";
  elements.usersGrid.innerHTML = message;
  elements.usersGrid.style.display = "block";
  elements.userResults.style.display = "block";
};

// User Display Logic
const displayUsers = (users) => {
  // Display user grid
  elements.usersGrid.innerHTML = `
    <div class="row g-4">
      ${users.map((user) => createUserCard(user)).join("")}
    </div>
  `;
};

// API Functions
const searchUsers = async (searchTerm) => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/users/get/name?name=${searchTerm}`
    );
    if (!response.ok) {
      throw new Error(
        response.status === 404 ? "No users found" : "Server error"
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Search error:", error);
    return [];
  }
};

// Event Handlers
const handleSearch = async () => {
  const searchTerm = elements.searchInput.value.trim();

  // Show minimum character message without loading spinner
  if (searchTerm.length < MIN_SEARCH_LENGTH) {
    showMessage(messages.minLength);
    return;
  }

  // Only show loading spinner for actual searches
  showLoading();
  const users = await searchUsers(searchTerm);

  if (users.length === 0) {
    showMessage(messages.noResults);
  } else {
    displayUsers(users);
    hideLoading();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  showMessage(messages.minLength);
  elements.searchButton.addEventListener("click", handleSearch);

  // Enter key to search
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });

  // Handle real-time search as user types
  let searchTimeout;
  elements.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const searchTerm = elements.searchInput.value.trim();

    // Immediately show minimum character message if < 3 characters
    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      showMessage(messages.minLength);
      return;
    }

    // Debounce actual searches
    searchTimeout = setTimeout(handleSearch, 300);
  });
});
