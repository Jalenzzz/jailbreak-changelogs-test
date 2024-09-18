const loadingOverlay = document.getElementById("loading-overlay"); // Reference to loading overlay

document.addEventListener("DOMContentLoaded", function () {
  const themeToggleMobile = document.getElementById("theme-toggle-mobile");
  const themeToggleDesktop = document.getElementById("theme-toggle-desktop");
  const htmlElement = document.documentElement;

  function setTheme(theme) {
    try {
      htmlElement.setAttribute("data-bs-theme", theme);
      localStorage.setItem("theme", theme);
      updateThemeIcon(themeToggleMobile, theme);
      updateThemeIcon(themeToggleDesktop, theme);
    } catch (error) {
      console.error("Failed to set theme:", error);
    }
  }

  function updateThemeIcon(button, theme) {
    try {
      const iconElement = button.querySelector("i");
      if (theme === "dark") {
        iconElement.classList.replace("bi-moon-stars-fill", "bi-sun-fill");
      } else {
        iconElement.classList.replace("bi-sun-fill", "bi-moon-stars-fill");
      }
    } catch (error) {
      console.error("Failed to update theme icon:", error);
    }
  }

  const savedTheme = localStorage.getItem("theme");
  const prefersDarkMode = window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches;

  if (savedTheme) {
    setTheme(savedTheme);
  } else if (prefersDarkMode) {
    setTheme("dark");
  } else {
    setTheme("light");
  }

  function toggleTheme() {
    const currentTheme = htmlElement.getAttribute("data-bs-theme");
    setTheme(currentTheme === "light" ? "dark" : "light");
  }

  themeToggleMobile?.addEventListener("click", toggleTheme);
  themeToggleDesktop?.addEventListener("click", toggleTheme);
});

// Fetch all season descriptions
async function loadAllSeasonDescriptions() {
  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/get_seasons`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch season descriptions: ${response.statusText}`
      );
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching season descriptions:", error);
    return [];
  }
}

// Fetch all rewards
async function loadAllRewards() {
  try {
    const response = await fetch(
      `https://api.jailbreakchangelogs.xyz/list_rewards`
    );
    if (!response.ok) {
      throw new Error(`Failed to fetch rewards: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching rewards:", error);
    return [];
  }
}

// Create card for each season
function createCard(seasonDescription, rewards) {
  const card = document.createElement("div");
  card.className = "col-md-3 mb-3";
  card.innerHTML = `
    <div class="card">
      <div class="card-header">
        <h5 class="card-title">Season ${seasonDescription.season} - ${
    seasonDescription.title
  }</h5>
        <p>${seasonDescription.description}</p>
      </div>
      <div class="card-body">
        <ul class="list-group">
          ${rewards
            .map(
              (item) => `
            <li class="list-group-item">
              <h6>${item.item}</h6>
              <p>Requirement: ${item.requirement}</p>
              <img src="${item.link}" alt="${item.item}" class="img-fluid">
            </li>
          `
            )
            .join("")}
        </ul>
      </div>
      <div class="card-footer text-muted">
        Data last updated on ${new Date().toLocaleDateString()}
      </div>
    </div>
  `;
  return card;
}

// Load and combine season data
async function loadSeasonCards() {
  const cardsContainer = document.getElementById("cards-container");

  try {
    // Show loading overlay
    loadingOverlay.style.display = "block";

    // Fetch season descriptions and rewards
    const seasonDescriptions = await loadAllSeasonDescriptions();
    const allRewards = await loadAllRewards();

    seasonDescriptions.forEach((seasonDescription) => {
      const seasonNumber = seasonDescription.season;
      const rewards = allRewards.filter(
        (reward) => reward.season_number === seasonNumber
      );

      // Create card for each season with its corresponding rewards
      if (rewards.length > 0) {
        const card = createCard(seasonDescription, rewards);
        cardsContainer.appendChild(card);
      }
    });
  } finally {
    // Hide loading overlay
    loadingOverlay.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", loadSeasonCards);
