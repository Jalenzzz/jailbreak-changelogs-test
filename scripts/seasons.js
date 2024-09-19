$(document).ready(function () {
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");

  function fetchSeasonDescription() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/get_seasons",
      method: "GET",
      dataType: "json",
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Failed to fetch season descriptions:", errorThrown);
        return [];
      },
    });
  }

  function fetchSeasonRewards() {
    return $.ajax({
      url: "https://api.jailbreakchangelogs.xyz/list_rewards",
      method: "GET",
      dataType: "json",
      error: function (jqXHR, textStatus, errorThrown) {
        console.error("Failed to fetch season rewards:", errorThrown);
        return [];
      },
    });
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
    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header">Season ${season} / ${seasonData.title}</h2>
      <p class="season-description lead">${seasonData.description}</p>
     <h3 class="prizes-title display-5 custom-prizes-title">Season Rewards</h3>
    `);

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

    $seasonDetailsContainer.append(
      `<ul class="list-group season-rewards">${rewardsHTML}</ul>`
    );
  }

  function updateCarousel(rewards) {
    $carouselInner.empty(); // Clear the existing carousel items

    rewards.forEach((reward, index) => {
      const isActive = index === 0 ? "active" : "";

      // Check if the reward is a bonus and its requirement starts with "Level"
      if (reward.bonus === "True" && reward.requirement.startsWith("Level")) {
        // Skip adding this reward to the carousel if it meets the condition
        return;
      }

      // Proceed if the condition is not met
      const carouselItem = $(`
        <div class="carousel-item ${isActive}">
          <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
        </div>
      `);
      $carouselInner.append(carouselItem);
    });
  }

  async function loadSeasonDetails(season, seasonDescriptions, seasonRewards) {
    try {
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
    }
  }

  // Show loading overlay
  $loadingOverlay.show();

  // Fetch both season descriptions and rewards
  $.when(fetchSeasonDescription(), fetchSeasonRewards())
    .done((seasonDescriptionsResponse, seasonRewardsResponse) => {
      const seasonDescriptions = seasonDescriptionsResponse[0]; // Unwrap response
      const seasonRewards = seasonRewardsResponse[0]; // Unwrap response

      // Get season number from URL (e.g., ?id=340)
      const urlParams = new URLSearchParams(window.location.search);
      const seasonNumber = urlParams.get("id");

      if (!seasonNumber) {
        const latestSeason = Math.max(
          ...seasonDescriptions.map((desc) => desc.season)
        );
        window.location.href = `${window.location.pathname}?id=${latestSeason}`;
      } else {
        loadSeasonDetails(
          parseInt(seasonNumber),
          seasonDescriptions,
          seasonRewards
        );
      }
    })
    .fail(() => {
      console.error("Failed to fetch one or more resources.");
    })
    .always(() => {
      $loadingOverlay.hide(); // Hide loading overlay
    });
});
