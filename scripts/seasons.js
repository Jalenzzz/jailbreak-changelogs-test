document.addEventListener("DOMContentLoaded", function () {
  const seasonDetailsContainer = document.getElementById("season-details");
  const carouselInner = document.getElementById("carousel-inner");
  const loadingOverlay = document.getElementById("loading-overlay");

  async function fetchSeasonDescription() {
    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/get_seasons"
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching season descriptions: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch season descriptions:", error);
      return [];
    }
  }

  async function fetchSeasonRewards() {
    try {
      const response = await fetch(
        "https://api.jailbreakchangelogs.xyz/list_rewards"
      );
      if (!response.ok) {
        throw new Error(
          `Error fetching season rewards: ${response.statusText}`
        );
      }
      return await response.json();
    } catch (error) {
      console.error("Failed to fetch season rewards:", error);
      return [];
    }
  }
  function displaySeasonDetails(season, descriptionData, rewardsData) {
    const seasonData = descriptionData.find((desc) => desc.season === season);
    const rewards = rewardsData.filter(
      (reward) => reward.season_number === season
    );

    if (!seasonData) {
      console.warn(`No description found for season ${season}`);
      return;
    }

    // Insert season title and description
    seasonDetailsContainer.innerHTML = `
        <h2 class="season-title border-bottom display-4">Season ${season} / ${seasonData.title}</h2>
        <p class="season-description lead">${seasonData.description}</p>
        <h3 class="prizes-title display-5">Season Rewards</h3>
    `;

    // Add season rewards below the description
    const rewardsHTML = rewards
      .map((reward) => {
        const isBonus = reward.bonus === "True";
        const bonusBadge = isBonus
          ? `<span class="badge bg-warning text-dark rounded-pill fs-6 fs-md-5">Bonus</span>`
          : "";
        const requirementBadge = `<span class="badge bg-primary rounded-pill fs-6 fs-md-5">${reward.requirement}</span>`;

        return `
                <li class="list-group-item d-flex justify-content-between align-items-center">
                    <h6 class="fw-bold fs-6 fs-md-5">${reward.item}</h6>
                    <div class="d-flex align-items-center">
                        ${bonusBadge}
                        ${requirementBadge}
                    </div>
                </li>`;
      })
      .join("");

    seasonDetailsContainer.innerHTML += `
    <ul class="list-group season-rewards">${rewardsHTML}</ul>`;
  }

  function updateCarousel(rewards) {
    carouselInner.innerHTML = ""; // Clear the existing carousel items

    rewards.forEach((reward, index) => {
      const isActive = index === 0 ? "active" : "";

      // Check if the reward is a bonus and its requirement starts with "Level"
      if (reward.bonus === "True" && reward.requirement.startsWith("Level")) {
        // Skip adding this reward to the carousel if it meets the condition
        return;
      }

      // Proceed if the condition is not met
      const carouselItem = document.createElement("div");
      carouselItem.className = `carousel-item ${isActive}`;
      carouselItem.innerHTML = `
        <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
      `;
      carouselInner.appendChild(carouselItem);
    });
  }

  async function loadSeasonDetails(season) {
    try {
      loadingOverlay.style.display = "block"; // Show loading overlay

      const seasonDescriptions = await fetchSeasonDescription();
      const seasonRewards = await fetchSeasonRewards();

      // Check if the season exists in the API
      const seasonExists = seasonDescriptions.some(
        (desc) => desc.season === season
      );

      if (!seasonExists) {
        // If the season doesn't exist, redirect to the latest season
        const latestSeason = Math.max(
          ...seasonDescriptions.map((desc) => desc.season)
        );
        window.location.href = `${window.location.pathname}?id=${latestSeason}`;
        return;
      }

      displaySeasonDetails(season, seasonDescriptions, seasonRewards);
      const rewardsForSeason = seasonRewards.filter(
        (reward) => reward.season_number === season
      );
      updateCarousel(rewardsForSeason);
    } catch (error) {
      console.error(`Failed to load season ${season} details:`, error);
    } finally {
      loadingOverlay.style.display = "none"; // Hide loading overlay
    }
  }

  // Get season number from URL (e.g., ?id=340)
  const urlParams = new URLSearchParams(window.location.search);
  const seasonNumber = urlParams.get("id");

  // If no season number in URL, redirect to the latest season
  fetchSeasonDescription().then((seasonDescriptions) => {
    if (!seasonNumber) {
      const latestSeason = Math.max(
        ...seasonDescriptions.map((desc) => desc.season)
      );
      window.location.href = `${window.location.pathname}?id=${latestSeason}`;
    } else {
      loadSeasonDetails(parseInt(seasonNumber)); // Load the season based on URL parameter
    }
  });
});
