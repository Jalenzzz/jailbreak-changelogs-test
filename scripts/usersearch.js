// Constants
const API_BASE_URL = "https://api3.jailbreakchangelogs.xyz";
const DISCORD_CDN = "https://cdn.discordapp.com";
const MIN_SEARCH_LENGTH = 1;

const elements = {
  searchInput: document.getElementById("searchInput"),
  searchButton: document.getElementById("searchButton"),
  clearButton: document.getElementById("clearButton"),
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

const fetchAvatar = async (userId, avatarHash, format) => {
  const url = `${DISCORD_CDN}/avatars/${userId}/${avatarHash}.${format}`;
  const response = await fetch(url, { method: "HEAD" });
  return response.ok ? url : null;
};

// User Card Template
const createUserCard = async (user) => {
  let avatarUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;

  if (user.avatar) {
    try {
      // Try GIF first
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) {
        avatarUrl = gifUrl;
      } else {
        // Fallback to PNG if GIF doesn't exist
        const pngUrl = await fetchAvatar(user.id, user.avatar, "png");
        if (pngUrl) {
          avatarUrl = pngUrl;
        }
      }
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }
  }

  return `
   <div class="col-12 col-md-6 col-lg-4">
    <div class="card user-card border-0 shadow-sm h-100">
      <div class="card-body p-3">
        <div class="d-flex align-items-center gap-2">
          <img 
            src="${avatarUrl}"
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
const displayUsers = async (users) => {
  const userCards = await Promise.all(
    users.map((user) => createUserCard(user))
  );
  elements.usersGrid.innerHTML = `
    <div class="row g-4">
      ${userCards.join("")}
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

  if (searchTerm.length < MIN_SEARCH_LENGTH) {
    showMessage(messages.minLength);
    return;
  }

  showLoading();
  const users = await searchUsers(searchTerm);

  if (users.length === 0) {
    showMessage(messages.noResults);
  } else {
    await displayUsers(users);
    hideLoading();
  }
};

document.addEventListener("DOMContentLoaded", () => {
  showMessage(messages.minLength);
  elements.searchButton.addEventListener("click", handleSearch);

  // Add clear button functionality
  elements.clearButton.addEventListener("click", () => {
    elements.searchInput.value = "";
    elements.clearButton.style.display = "none";
    showMessage(messages.minLength);
  });

  // Enter key to search
  elements.searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });

  // Handle real-time search and clear button visibility
  let searchTimeout;
  elements.searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    const searchTerm = elements.searchInput.value.trim();

    // Show/hide clear button based on input
    elements.clearButton.style.display = searchTerm ? "block" : "none";

    // Immediately show minimum character message if < MIN_SEARCH_LENGTH characters
    if (searchTerm.length < MIN_SEARCH_LENGTH) {
      showMessage(messages.minLength);
      return;
    }

    // Debounce actual searches
    searchTimeout = setTimeout(handleSearch, 300);
  });
});
