$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown

  // Function to fetch season descriptions from the API
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

  // Function to fetch season rewards from the API
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

  // Function to populate the season dropdown menu
  function populateSeasonDropdown(seasonData) {
    seasonData.forEach((season) => {
      const listItem = $(`
        <li class="w-100">
          <a class="dropdown-item changelog-dropdown-item w-100" href="?id=${season.season}">
            <span class="badge bg-primary me-2">Season ${season.season}</span> 
            ${season.title}
          </a>
        </li>
      `);
      $seasonList.append(listItem);
    });
  }

  // Function to display season details and rewards
  function displaySeasonDetails(season, descriptionData, rewardsData) {
    // Find the season data from the description data
    const seasonData = descriptionData.find((desc) => desc.season === season);
    // Filter rewards for the current season
    const rewards = rewardsData.filter(
      (reward) => reward.season_number === season
    );

    if (!seasonData) {
      console.warn(`No description found for season ${season}`);
      return;
    }

    // Populate the season details container
    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
      <div class="card mb-5 shadow">
        <div class="card-body py-4">
          <p class="card-text lead">${seasonData.description}</p>
        </div>
      </div>
      <h3 class="prizes-title display-5 custom-prizes-title mb-4">Season Rewards</h3>
    `);

    // Generate HTML for season rewards
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

    // Append the rewards list to the season details container
    $seasonDetailsContainer.append(
      `<ul class="list-group season-rewards">${rewardsHTML}</ul>`
    );
  }

  // Function to update the carousel with reward images
  function updateCarousel(rewards) {
    // Clear any existing carousel items
    $carouselInner.empty();

    // Iterate through each reward in the rewards array
    rewards.forEach((reward, index) => {
      // Determine if this is the first (active) carousel item
      const isActive = index === 0 ? "active" : "";

      // Create a new carousel item using a template literal
      const carouselItem = $(`
      <div class="carousel-item ${isActive} rounded"> 
          <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
      </div>
      `);

      // Append the new carousel item to the carousel inner container
      $carouselInner.append(carouselItem);
    });
  }

  // Back to Top button functionality
  const backToTopButton = $("#backToTop");

  // Show/hide the Back to Top button based on scroll position
  $(window).scroll(function () {
    if ($(this).scrollTop() > 100) {
      backToTopButton.addClass("show");
    } else {
      backToTopButton.removeClass("show");
    }
  });

  // Smooth scroll to top when the Back to Top button is clicked
  backToTopButton.on("click", function (e) {
    e.preventDefault();
    $("html, body").animate({ scrollTop: 0 }, 100);
  });

  // Function to load and display season details
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

      // Display season details and update the carousel
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

      // Populate the dropdown with season items
      populateSeasonDropdown(seasonDescriptions);

      // Get season number from URL (e.g., ?id=340)
      const urlParams = new URLSearchParams(window.location.search);
      const seasonNumber = urlParams.get("id");

      if (!seasonNumber) {
        // If no season is specified, redirect to the latest season
        const latestSeason = Math.max(
          ...seasonDescriptions.map((desc) => desc.season)
        );
        window.location.href = `${window.location.pathname}?id=${latestSeason}`;
      } else {
        // Load details for the specified season
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
