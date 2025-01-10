$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown
  // let userdata = null;
  let latestSeason = null;

  function getCountdownColor(days) {
    if (days <= 7) return "#FF4444"; // Red for 7 days or less
    if (days <= 14) return "#e4c61d"; // Yellow for 14 days or less
    return "#D3D9D4"; // Default color
  }

  function updateCountdown() {
    if (!latestSeason) return; // Exit if latestSeason is not available

    const countdownElement = document.querySelector(".countdown-timer");
    const seasonNumberElement = document.getElementById("season-number");
    const seasonTitleElement = document.getElementById("season-title");
    const countdownModeElement = document.getElementById("countdown-mode"); // For dynamic "starts in" or "ends in"

    // Update season number and title
    seasonNumberElement.textContent = latestSeason.season;
    seasonTitleElement.textContent = latestSeason.title;

    const now = new Date();
    let endDateTimestamp = latestSeason.end_date;

    if (!latestSeason.end_date && !latestSeason.start_date) {
      // Neither start nor end date available
      countdownElement.innerHTML =
        '<div class="season-ended">Date: Not Available</div>';
      return;
    }

    if (!latestSeason.end_date) {
      // If end_date is null (i.e., it was "N/A" or not provided)
      countdownElement.innerHTML =
        '<div class="season-ended">End Date: Not Available</div>';
      return;
    }

    if (latestSeason.start_date && !latestSeason.end_date) {
      // If only start date is available
      countdownModeElement.textContent = "starts in:";
      const startDate = new Date(latestSeason.start_date * 1000); // Convert UNIX timestamp to milliseconds
      const diff = startDate - now;

      if (diff > 0) {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        const countdownColor = getCountdownColor(days);

        countdownElement.innerHTML = `
        <div class="countdown-item">
          <span id="countdown-days" style="color: ${countdownColor}">${days
          .toString()
          .padStart(2, "0")}</span>
          <span class="countdown-label">Days</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-hours" style="color: ${countdownColor}">${hours
          .toString()
          .padStart(2, "0")}</span>
          <span class="countdown-label">Hours</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-minutes" style="color: ${countdownColor}">${minutes
          .toString()
          .padStart(2, "0")}</span>
          <span class="countdown-label">Minutes</span>
        </div>
        <div class="countdown-item">
          <span id="countdown-seconds" style="color: ${countdownColor}">${seconds
          .toString()
          .padStart(2, "0")}</span>
          <span class="countdown-label">Seconds</span>
        </div>
      `;
      } else {
        // Season has started
        countdownElement.innerHTML = `<div class="season-started">Season ${latestSeason.season} / ${latestSeason.title} has started!</div>`;
      }
      return;
    }

    // If end date is available
    countdownModeElement.textContent = "ends in:";
    const endDate = new Date(endDateTimestamp); // Convert timestamp to milliseconds
    const diff = endDate - now;

    if (diff > 0) {
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const countdownColor = getCountdownColor(days);

      countdownElement.innerHTML = `
      <div class="countdown-item">
        <span id="countdown-days" style="color: ${countdownColor}">${days
        .toString()
        .padStart(2, "0")}</span>
        <span class="countdown-label">Days</span>
      </div>
      <div class="countdown-item">
        <span id="countdown-hours" style="color: ${countdownColor}">${hours
        .toString()
        .padStart(2, "0")}</span>
        <span class="countdown-label">Hours</span>
      </div>
      <div class="countdown-item">
        <span id="countdown-minutes" style="color: ${countdownColor}">${minutes
        .toString()
        .padStart(2, "0")}</span>
        <span class="countdown-label">Minutes</span>
      </div>
      <div class="countdown-item">
        <span id="countdown-seconds" style="color: ${countdownColor}">${seconds
        .toString()
        .padStart(2, "0")}</span>
        <span class="countdown-label">Seconds</span>
      </div>
    `;
    } else {
      // Season has ended
      countdownElement.innerHTML = `<div class="season-ended">Season ${latestSeason.season} / ${latestSeason.title} has ended!</div>`;
    }
  }

  function updateBreadcrumb(season) {
    const seasonBreadcrumb = document.querySelector(".season-breadcrumb");
    if (seasonBreadcrumb) {
      seasonBreadcrumb.textContent = `Season ${season}`;
    }
  }

  function toggleLoadingOverlay(show) {
    if (show) {
      $loadingOverlay.show();
    } else {
      $loadingOverlay.hide();
    }
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  function fetchAllSeasons() {
    return fetch("https://jbc-api.vercel.app/seasons/list")
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error fetching seasons:", error);
        throw error;
      });
  }

  function fetchAllRewards() {
    return fetch("https://api3.jailbreakchangelogs.xyz/rewards/list")
      .then((response) => response.json())
      .catch((error) => {
        console.error("Error fetching rewards:", error);
        throw error;
      });
  }

  function loadAllData() {
    const latestSeasonPromise = fetch(
      "https://jbc-api.vercel.app/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    )
      .then((response) => response.json())
      .then((latestSeasonData) => {
        // Convert the end_date to a JavaScript Date object if it's a valid timestamp
        if (latestSeasonData.end_date && latestSeasonData.end_date !== "N/A") {
          latestSeasonData.end_date = new Date(
            latestSeasonData.end_date * 1000
          ); // Convert Unix timestamp to milliseconds
        } else {
          // If end_date is "N/A" or not provided, set it to null
          latestSeasonData.end_date = null;
        }
        return latestSeasonData;
      });

    return Promise.all([
      fetchAllSeasons(),
      fetchAllRewards(),
      latestSeasonPromise,
    ]).then(([seasons, rewards, latest]) => {
      latestSeason = latest; // Set the latestSeason variable
      // Start the countdown update
      updateCountdown();
      setInterval(updateCountdown, 1000); // Update every second
      return [seasons, rewards, latest];
    });
  }

  // Function to populate the season dropdown menu
  function populateSeasonDropdown(seasonData) {
    if (!Array.isArray(seasonData) || seasonData.length === 0) {
      console.error("Invalid or empty season data:", seasonData);
      $seasonList.html(
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>'
      );
      return;
    }

    $seasonList.empty(); // Clear existing items

    seasonData.forEach((season) => {
      const listItem = $(`
        <li class="w-100">
          <a class="dropdown-item changelog-dropdown-item w-100" href="?season=${season.season}">
            <span class="badge me-2" style="background-color: #124E66; color: #D3D9D4">Season ${season.season}</span>
            ${season.title}
          </a>
        </li>
      `);
      $seasonList.append(listItem);
    });
  }

  function displaySeasonDetails(season, seasonData, rewardsData) {
    localStorage.setItem("selectedSeason", season);
    function format_season_date(startTimestamp, endTimestamp) {
      const options = {
        month: "long",
        day: "numeric",
        year: "numeric",
      };

      function formatSingleDate(timestamp) {
        if (
          timestamp === null ||
          timestamp === "N/A" ||
          timestamp === undefined
        ) {
          return ""; // Don't display anything if no date is provided
        }
        const date = new Date(timestamp * 1000);
        let formattedDate = date.toLocaleString("en-US", options);
        const day = date.getDate();
        const ordinalSuffix = getOrdinalSuffix(day);
        return formattedDate.replace(day, `${day}${ordinalSuffix}`);
      }

      const startDate = formatSingleDate(startTimestamp);
      const endDate = formatSingleDate(endTimestamp);

      return { startDate, endDate };
    }

    // Helper function to get ordinal suffix (assuming it's defined elsewhere in your code)
    function getOrdinalSuffix(day) {
      if (day > 3 && day < 21) return "th";
      switch (day % 10) {
        case 1:
          return "st";
        case 2:
          return "nd";
        case 3:
          return "rd";
        default:
          return "th";
      }
    }

    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
      <div class="season-description-container">
        <div class="season-dates mb-3">
          <p class="mb-1"><strong>Start Date:</strong> ${
            format_season_date(seasonData.start_date, seasonData.end_date)
              .startDate
          }</p>
          <p class="mb-1"><strong>End Date:</strong> ${
            format_season_date(seasonData.start_date, seasonData.end_date)
              .endDate
          }</p>
          <p class="mb-1"><strong>Duration:</strong> ${
            seasonData.start_date &&
            seasonData.end_date &&
            seasonData.start_date !== "" &&
            seasonData.end_date !== "" &&
            seasonData.start_date !== "N/A" &&
            seasonData.end_date !== "N/A" &&
            seasonData.start_date !== null &&
            seasonData.end_date !== null
              ? `${Math.ceil(
                  (seasonData.end_date - seasonData.start_date) / (60 * 60 * 24)
                )} days`
              : ""
          }</p>
        </div>
        <div class="season-description-body text-center"> 
          ${
            seasonData.description
              ? `<p class="season-description-text">${seasonData.description}</p>`
              : `
              <div class="no-description">
                <i class="bi bi-info-circle text-muted mb-2" style="font-size: 2rem;"></i>
                <p class="text-muted">No description available.</p>
              </div>`
          }
        </div>
      </div>
    `);

    // Check if rewardsData is available and not empty
    if (rewardsData && rewardsData.length > 0) {
      // Filter rewards for the current season
      const rewards = rewardsData.filter(
        (reward) => reward.season_number === parseInt(season)
      );

      if (rewards.length > 0) {
        // Generate HTML for season rewards
        const rewardsHTML = rewards
          .map((reward, index) => {
            const isBonus = reward.bonus === "True";
            const bonusBadge = isBonus
              ? `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #748D92; color: #212A31">Bonus</span>`
              : "";
            const requirementBadge = `<span class="badge rounded-pill fs-6 fs-md-5" style="background-color: #124E66; color: #D3D9D4">${reward.requirement}</span>`;

            return `
          <div class="reward-item ${
            isBonus ? "bonus-reward" : ""
          }" style="--animation-order: ${index}">
            <div class="reward-content">
              <h6 class="reward-title">${reward.item}</h6>
              <div class="reward-badges">
                ${bonusBadge}
                ${requirementBadge}
              </div>
            </div>
          </div>`;
          })
          .join("");

        // Append the rewards list to the season details container
        $seasonDetailsContainer.append(
          `
          <div class="rewards-container">
            <h3 class="rewards-title">Season Rewards</h3>
            <div class="rewards-list">${rewardsHTML}</div>
          </div>`
        );
      } else {
        // If no rewards for this season, display a message and disable comments
        $seasonDetailsContainer.append(
          '<p class="text-warning">No rewards data available for this season.</p>'
        );
      }
    } else {
      // If no rewards data at all, display a message and disable comments
      $seasonDetailsContainer.append(
        '<p class="text-warning">No rewards data available.</p>'
      );
    }
  }

  // Helper function to format the description
  function formatDescription(description) {
    return `<p class="season-description-paragraph">${description}</p>`;
  }

  // Function to update the carousel with reward images
  function updateCarousel(rewards) {
    // Clear any existing carousel items
    $carouselInner.empty();

    if (!rewards || rewards.length === 0) {
      // No rewards data available, show a placeholder or message
      const placeholderItem = $(`
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #1a2228;">
            <p class="text-light">Reward images not available</p>
          </div>
        </div>
      `);

      $carouselInner.append(placeholderItem);
      return;
    }

    // Filter rewards based on the criteria
    const filteredRewards = rewards.filter((reward) => {
      const isLevelRequirement = reward.requirement.startsWith("Level");
      const isBonus = reward.bonus === "True";
      return !(isLevelRequirement && isBonus);
    });

    if (filteredRewards.length === 0) {
      // No rewards left after filtering, show a message
      const noRewardsItem = $(`
        <div class="carousel-item active rounded">
          <div class="d-flex align-items-center justify-content-center" style="height: 300px; background-color: #f8f9fa;">
            <p class="text-muted">No eligible reward images to display</p>
          </div>
        </div>
      `);
      $carouselInner.append(noRewardsItem);
      return;
    }

    // Iterate through each filtered reward
    filteredRewards.forEach((reward, index) => {
      const isActive = index === 0 ? "active" : "";
      const carouselItem = $(`
        <div class="carousel-item ${isActive} rounded"> 
          <img src="${reward.link}" class="d-block w-100 img-fluid" alt="${reward.item}">
        </div>
      `);
      $carouselInner.append(carouselItem);
    });
  }

  function loadSeasonDetails(season) {
    return Promise.all([fetchAllSeasons(), fetchAllRewards()])
      .then(([allSeasons, allRewards]) => {
        const seasonData = allSeasons.find(
          (s) => s.season === parseInt(season)
        );
        const seasonRewards = allRewards.filter(
          (r) => r.season_number === parseInt(season)
        );
        displaySeasonDetails(season, seasonData, seasonRewards);
        updateCarousel(seasonRewards);
        updateBreadcrumb(season);

        if (seasonData) {
          document.title = `Season ${season} - ${seasonData.title}`;
        } else {
          document.title = `Season ${season}`;
        }
        return false;
      })
      .catch((error) => {
        console.error("Error loading season details:", error);
        displayErrorMessage(
          "Unable to load season details. Please try again later."
        );
        return false;
      });
  }
  function displayErrorMessage(message) {
    $seasonDetailsContainer.html(`
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
      </div>
    `);
    updateCarousel([]); // Clear the carousel
    updateBreadcrumb("Error");
    document.title = "Error - Season Details";
  }

  // Add event listener for season selection
  $seasonList.on("click", ".changelog-dropdown-item", function (e) {
    e.preventDefault();
    const selectedSeason = $(this).attr("href").split("=")[1];

    // Update the URL with the selected season
    const newUrl = `/seasons/${selectedSeason}`;
    window.history.pushState({}, "", newUrl);

    // Only show loading overlay if we're fetching fresh data
    toggleLoadingOverlay(true);

    // Properly update the CommentsManager with new season ID
    if (window.commentsManagerInstance) {
      window.commentsManagerInstance.clearComments();
      window.commentsManagerInstance.type = "season";
      window.commentsManagerInstance.itemId = selectedSeason;
      window.commentsManagerInstance.loadComments(); // Reload comments with new ID
    } else {
      // Create new instance if it doesn't exist
      window.commentsManagerInstance = new CommentsManager(
        "season",
        selectedSeason
      );
      window.commentsManagerInstance.loadComments();
    }

    loadSeasonDetails(parseInt(selectedSeason)).then(() => {
      toggleLoadingOverlay(false);
    });
  });

  // Modify the initial data loading
  loadAllData()
    .then(([seasonDescriptions, allRewards, latestSeason]) => {
      populateSeasonDropdown(seasonDescriptions);
      const pathSegments = window.location.pathname.split("/");
      let seasonNumber = pathSegments[pathSegments.length - 1];

      // Use latest season from API instead of calculating
      if (
        !seasonNumber ||
        isNaN(seasonNumber) ||
        !seasonDescriptions.some(
          (desc) => desc.season === parseInt(seasonNumber)
        )
      ) {
        seasonNumber = latestSeason.season.toString();
        const newUrl = `${window.location.origin}/seasons/${seasonNumber}`;
        window.history.replaceState({}, "", newUrl);
      }

      if (!window.commentsManagerInstance) {
        window.commentsManagerInstance = new CommentsManager(
          "season",
          seasonNumber
        );
        window.commentsManagerInstance.loadComments();
      }

      // Remove the return and chain the promises properly
      return loadSeasonDetails(parseInt(seasonNumber));
    })
    .then(() => {
      toggleLoadingOverlay(false);
    })
    .catch((error) => {
      console.error("Failed to fetch data:", error);
      $seasonDetailsContainer.html(`
        <div class="alert alert-danger" role="alert">
          <h4 class="alert-heading">Unable to Load Season Data</h4>
          <p>We're having trouble fetching the season information. Please try refreshing the page or check back later.</p>
        </div>
      `);
      $seasonList.html(
        '<li class="w-100"><span class="dropdown-item">No seasons available</span></li>'
      );
      $loadingOverlay.hide();
    });

  function formatDate(unixTimestamp) {
    // Convert UNIX timestamp to milliseconds by multiplying by 1000
    const date = new Date(unixTimestamp * 1000);

    const options = {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    };
    let formattedDate = date.toLocaleString("en-US", options);

    // Get the day of the month with the appropriate ordinal suffix
    const day = date.getDate();
    const ordinalSuffix = getOrdinalSuffix(day);
    formattedDate = formattedDate.replace(day, `${day}${ordinalSuffix}`);

    return formattedDate;
  }

  function getOrdinalSuffix(day) {
    if (day > 3 && day < 21) return "th"; // Covers 11th to 19th
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  }

  function handleinvalidImage() {
    setTimeout(() => {
      const userId = this.id.replace("avatar-", "");
      const username = this.closest("li").querySelector("a").textContent;
      this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
        username
      )}&bold=true&format=svg`;
    }, 0);
  }

  loadAllData().then(() => {
    updateCountdown();
    // Update countdown every second
    setInterval(updateCountdown, 1000);
  });
});
