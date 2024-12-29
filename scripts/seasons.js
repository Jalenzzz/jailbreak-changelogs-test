$(document).ready(function () {
  // DOM element references
  const $seasonDetailsContainer = $("#season-details");
  const $carouselInner = $("#carousel-inner");
  const $loadingOverlay = $("#loading-overlay");
  const $seasonList = $("#seasonList"); // Reference to the season dropdown
  // let userdata = null;

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

  const debouncedReloadComments = debounce(reloadcomments, 300);

  function fetchAllSeasons() {
    return fetch("https://api3.jailbreakchangelogs.xyz/seasons/list").then(
      (response) => response.json()
    );
  }

  function fetchAllRewards() {
    return fetch("https://api3.jailbreakchangelogs.xyz/rewards/list").then(
      (response) => response.json()
    );
  }

  function loadAllData() {
    const latestSeasonPromise = fetch(
      "https://api3.jailbreakchangelogs.xyz/seasons/latest",
      {
        headers: {
          "Content-Type": "application/json",
          Origin: "https://jailbreakchangelogs.xyz",
        },
      }
    ).then((response) => response.json());

    return Promise.all([
      fetchAllSeasons(),
      fetchAllRewards(),
      latestSeasonPromise,
    ]);
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

    // Check if seasonData is available
    if (!seasonData || !seasonData.title) {
      $seasonDetailsContainer.html(`
        <div class="alert alert-warning" role="alert">
          <h4 class="alert-heading">Season ${season} Details Unavailable</h4>
          <p>We couldn't retrieve the details for this season. The information might be temporarily unavailable.</p>
        </div>
      `);
      disableComments(
        "Comments are unavailable due to an error loading season data."
      );
      return;
    }

    // Populate the season details container
    $seasonDetailsContainer.html(`
      <h2 class="season-title display-4 text-custom-header mb-3">Season ${season} / ${seasonData.title}</h2>
      <div class="season-description-container">
        <div class="season-description-body">
          <p class="season-description-text">${
            seasonData.description || "No description available."
          }</p>
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

        debouncedReloadComments();
      } else {
        // If no rewards for this season, display a message and disable comments
        $seasonDetailsContainer.append(
          '<p class="text-warning">No rewards data available for this season.</p>'
        );
        disableComments(
          "Comments are unavailable because no rewards data is available for this season."
        );
      }
    } else {
      // If no rewards data at all, display a message and disable comments
      $seasonDetailsContainer.append(
        '<p class="text-warning">No rewards data available.</p>'
      );
      disableComments(
        "Comments are unavailable because no rewards data is available for this season."
      );
    }
  }

  // Helper function to disable comments
  function disableComments(message) {
    $("#comments-list").html(`<p class="text-muted">${message}</p>`);
    $("#comment-form").hide();
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

  // Modify the loadSeasonDetails function
  function loadSeasonDetails(season) {
    return Promise.all([fetchAllSeasons(), fetchAllRewards()]).then(
      ([allSeasons, allRewards]) => {
        const seasonData = allSeasons.find(
          (s) => s.season === parseInt(season)
        );
        const seasonRewards = allRewards.filter(
          (r) => r.season_number === parseInt(season)
        );
        displaySeasonDetails(season, seasonData, seasonRewards);
        updateCarousel(seasonRewards);
        updateBreadcrumb(season);

        document.title = `Season ${season} - ${seasonData.title}`;
        return false; // Always return false since we're not using cache
      }
    );
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

    loadSeasonDetails(parseInt(selectedSeason)).then(() => {
      toggleLoadingOverlay(false);
      try {
        debouncedReloadComments();
      } catch (error) {
        console.error("Failed to load comments:", error);
        $("#comments-list").html(
          '<p class="text-muted">Unable to load comments at this time.</p>'
        );
      }
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
        // If invalid, set seasonNumber to the latest season from API
        seasonNumber = latestSeason.season.toString();

        // Update the URL to include the latest season in the path
        const newUrl = `${window.location.origin}/seasons/${seasonNumber}`;
        window.history.replaceState({}, "", newUrl);
      }

      return loadSeasonDetails(parseInt(seasonNumber));
    })
    .then(() => {
      toggleLoadingOverlay(false);
      try {
        debouncedReloadComments();
      } catch (error) {
        console.error("Failed to load comments:", error);
        $("#comments-list").html(
          '<p class="text-muted">Unable to load comments at this time.</p>'
        );
      }
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
      $("#comments-list").html(
        '<p class="text-muted">Comments are unavailable due to an error loading season data.</p>'
      );
      $("#comment-form").hide();
    });

  const CommentForm = document.getElementById("comment-form");
  const CommentHeader = document.getElementById("comment-header");
  const commentinput = document.getElementById("commenter-text");
  const commentbutton = document.getElementById("submit-comment");
  const avatarUrl = sessionStorage.getItem("avatar");
  const userdata = JSON.parse(sessionStorage.getItem("user"));
  const commentsList = document.getElementById("comments-list");
  const userid = sessionStorage.getItem("userid");

  if (userid) {
    commentinput.placeholder = "Comment as " + userdata.global_name;
    commentbutton.disabled = false;
    commentinput.disabled = false;
  } else {
    commentinput.disabled = true;
    commentinput.placeholder = "Login to comment";
    commentbutton.disabled = false;
    commentbutton.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Login';

    // Remove any existing event listeners from the form
    const newForm = CommentForm.cloneNode(true);
    CommentForm.parentNode.replaceChild(newForm, CommentForm);

    // Add click event to the button for login redirect
    newForm
      .querySelector("#submit-comment")
      .addEventListener("click", function (event) {
        event.preventDefault();
        localStorage.setItem(
          "redirectAfterLogin",
          "/changelogs/" + localStorage.getItem("selectedChangelogId")
        );
        window.location.href = "/login";
      });
  }

  function getCookie(name) {
    let cookieArr = document.cookie.split(";");
    for (let i = 0; i < cookieArr.length; i++) {
      let cookiePair = cookieArr[i].split("=");
      if (name === cookiePair[0].trim()) {
        return decodeURIComponent(cookiePair[1]);
      }
    }
    return null;
  }

  function throw_error(message) {
    toastr.error(message, "Error creating comment.", {
      positionClass: "toast-bottom-right", // Position at the bottom right
      timeOut: 3000, // Toast will disappear after 3 seconds
      closeButton: true, // Add a close button
      progressBar: true, // Show a progress bar
    });
  }

  function addComment(comment) {
    if (!userdata) {
      // Changed from userData to userdata
      throw_error("Please login to comment");
      return;
    }

    const listItem = document.createElement("li");
    listItem.classList.add(
      "list-group-item",
      "d-flex",
      "align-items-start",
      "mb-3"
    );

    const avatarElement = document.createElement("img");
    const defaultAvatarUrl =
      "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg";
    avatarElement.src = avatarUrl.endsWith("null.png")
      ? defaultAvatarUrl
      : avatarUrl;
    avatarElement.classList.add("rounded-circle", "m-1");
    avatarElement.width = 32;
    avatarElement.id = `avatar-${userdata.id}`;
    avatarElement.height = 32;
    avatarElement.onerror = handleinvalidImage;

    const commentContainer = document.createElement("div");
    commentContainer.classList.add("ms-2", "comment-item", "w-100");
    commentContainer.style.backgroundColor = "#2E3944";
    commentContainer.style.padding = "12px";
    commentContainer.style.borderRadius = "8px";
    commentContainer.style.marginBottom = "8px";
    commentContainer.style.paddingRight =
      "40px"; /* Add extra padding on the right for the action buttons */
    commentContainer.style.position =
      "relative"; /* Ensure proper positioning context */

    const headerContainer = document.createElement("div");
    headerContainer.classList.add("d-flex", "align-items-center", "flex-wrap");

    const usernameElement = document.createElement("a");
    usernameElement.href = `/users/${userdata.id}`; // Set the href to redirect to the user's page
    usernameElement.textContent = userdata.global_name; // Set the text to the user's global name
    usernameElement.style.fontWeight = "bold"; // Make the text bold
    usernameElement.style.color = "#748D92";
    usernameElement.style.textDecoration = "none";
    usernameElement.style.transition = "color 0.2s ease";
    usernameElement.style.fontWeight = "bold";

    usernameElement.addEventListener("mouseenter", () => {
      usernameElement.style.color = "#D3D9D4";
      usernameElement.style.textDecoration = "underline";
    });
    usernameElement.addEventListener("mouseleave", () => {
      usernameElement.style.color = "#748D92";
      usernameElement.style.textDecoration = "none";
    });

    const date = Math.floor(Date.now() / 1000);
    const formattedDate = formatDate(date); // Assuming comment.date contains the date string
    const dateElement = document.createElement("small");
    dateElement.textContent = ` · ${formattedDate}`; // Add the formatted date
    dateElement.classList.add("text-muted"); // Optional: Add a class for styling

    // Append elements to the comment container
    commentContainer.appendChild(usernameElement);
    commentContainer.appendChild(dateElement);

    const commentTextElement = document.createElement("p");
    commentTextElement.textContent = comment.value;
    commentTextElement.classList.add("mb-0", "comment-text");
    commentTextElement.style.color = "#D3D9D4";
    commentTextElement.style.marginTop = "4px";

    commentContainer.appendChild(headerContainer);
    commentContainer.appendChild(commentTextElement);

    // Append avatar and comment container to the list item
    listItem.appendChild(avatarElement);
    listItem.appendChild(commentContainer);

    // Prepend the new comment to the comments list

    const token = getCookie("token");

    // Post the comment to the server
    fetch("https://api.jailbreakchangelogs.xyz/comments/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        author: token,
        content: comment.value,
        item_id: localStorage.getItem("selectedSeason"),
        item_type: "season",
      }),
    })
      .then(async (response) => {
        const data = await response.json(); // Parse JSON response

        if (response.status === 429) {
          const cooldown = data.remaining;
          throw_error("Wait " + cooldown + " seconds before commenting again.");
          return; // Stop further execution
        }

        if (response.ok) {
          commentsList.prepend(listItem);
          debouncedReloadComments();
        } else {
          // Handle other non-429 errors (e.g., validation)
          throw_error(data.error || "An error occurred.");
        }
      })
      .catch((error) => {
        console.error(error);
        throw_error("An unexpected error occurred.");
      });
  }

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

  let currentPage = 1; // Track the current page
  const commentsPerPage = 7; // Number of comments per page
  let comments = []; // Declare the comments array globally

  // Function to load comments
  function loadComments(commentsData) {
    comments = commentsData; // Assign the fetched comments to the global variable
    commentsList.innerHTML = ""; // Clear existing comments
    comments.sort((a, b) => b.date - a.date);

    // Calculate the total number of pages
    const totalPages = Math.ceil(comments.length / commentsPerPage);

    // Get the comments for the current page
    const startIndex = (currentPage - 1) * commentsPerPage;
    const endIndex = startIndex + commentsPerPage;
    const commentsToDisplay = comments.slice(startIndex, endIndex);

    const userDataPromises = commentsToDisplay.map((comment) => {
      return fetch(
        "https://api.jailbreakchangelogs.xyz/users/get?id=" + comment.user_id
      )
        .then((response) => response.json())
        .then((userdata) => ({ comment, userdata }))
        .catch((error) => {
          console.error("Error fetching user data:", error);
          return null;
        });
    });

    Promise.all(userDataPromises)
      .then((results) => {
        const validResults = results.filter((result) => result !== null);

        validResults.forEach(({ comment, userdata }) => {
          if (!userdata || !userdata.id) {
            console.error("Invalid user data:", userdata);
            return;
          }

          const avatarUrl = userdata.avatar
            ? `https://cdn.discordapp.com/avatars/${userdata.id}/${userdata.avatar}.png`
            : "assets/profile-pic-placeholder.png";

          const listItem = document.createElement("li");
          listItem.classList.add(
            "list-group-item",
            "d-flex",
            "align-items-start",
            "mb-3"
          );

          const avatarElement = document.createElement("img");
          avatarElement.src = avatarUrl;
          avatarElement.classList.add("rounded-circle", "m-1");
          avatarElement.width = 32;
          avatarElement.height = 32;
          avatarElement.id = `avatar-${userdata.id}`; // Fixed: userData instead of userdata
          avatarElement.onerror = handleinvalidImage;

          const commentContainer = document.createElement("div");
          commentContainer.classList.add("ms-2", "comment-item", "w-100");
          commentContainer.style.cssText = `
          background-color: #2E3944;
          padding: 12px;
          padding-right: 40px; /* Add extra padding on the right for the action buttons */
          border-radius: 8px;
          margin-bottom: 8px;
          position: relative; /* Ensure proper positioning context */
        `;

          // Create a container for the username and date
          const headerContainer = document.createElement("div");
          headerContainer.classList.add(
            "d-flex",
            "align-items-center",
            "flex-wrap"
          );

          const usernameElement = document.createElement("a");
          usernameElement.href = `/users/${userdata.id}`;
          usernameElement.textContent = userdata.global_name || "Unknown User";
          usernameElement.style.cssText = `
          font-weight: bold;
          color: #748D92;
          text-decoration: none;
          transition: color 0.2s ease;
        `;

          usernameElement.addEventListener("mouseenter", () => {
            usernameElement.style.color = "#D3D9D4";
            usernameElement.style.textDecoration = "underline";
          });

          usernameElement.addEventListener("mouseleave", () => {
            usernameElement.style.color = "#748D92";
            usernameElement.style.textDecoration = "none";
          });

          // Add username first to header container
          headerContainer.appendChild(usernameElement);

          const dateContainer = document.createElement("div");
          dateContainer.classList.add("date-container");

          const dateElement = document.createElement("small");
          const formattedDate = formatDate(comment.date);

          if (comment.edited_at) {
            const formattedEditDate = formatDate(comment.edited_at);
            dateElement.textContent = ` · ${formattedEditDate} (Edited)`;
            dateElement.classList.add("text-muted");
          } else {
            dateElement.textContent = ` · ${formattedDate}`;
            dateElement.classList.add("text-muted");
          }

          // Add date element to date container
          dateContainer.appendChild(dateElement);

          // Add date container to header container
          headerContainer.appendChild(dateContainer);

          const commentTextElement = document.createElement("p");
          commentTextElement.textContent = comment.content;
          commentTextElement.classList.add("mb-0", "comment-text");
          commentTextElement.style.cssText = `
          color: #D3D9D4;
          margin-top: 4px;
        `;

          // Add action buttons container
          const actionsContainer = document.createElement("div");
          actionsContainer.classList.add("comment-actions");
          actionsContainer.style.cssText = `
          position: absolute;
          top: 8px;
          right: 8px;
          margin-left: 16px;
          z-index: 2;
        `;

          // Only show actions for the comment owner
          if (userdata.id === sessionStorage.getItem("userid")) {
            // Create dropdown toggle button
            const actionsToggle = document.createElement("button");
            actionsToggle.classList.add("comment-actions-toggle");
            actionsToggle.innerHTML =
              '<i class="bi bi-three-dots-vertical"></i>';

            // Create dropdown menu
            const actionsMenu = document.createElement("div");
            actionsMenu.classList.add("comment-actions-menu");
            actionsMenu.style.display = "none";

            // Create menu items
            const editButton = document.createElement("button");
            editButton.classList.add("comment-action-item");
            editButton.innerHTML = '<i class="bi bi-pencil"></i> Edit';
            editButton.setAttribute("data-comment-id", comment.id);

            const deleteButton = document.createElement("button");
            deleteButton.classList.add("comment-action-item", "delete");
            deleteButton.innerHTML = '<i class="bi bi-trash"></i> Delete';
            deleteButton.setAttribute("data-comment-id", comment.id);

            // Add items to menu
            actionsMenu.appendChild(editButton);
            actionsMenu.appendChild(deleteButton);

            // Add toggle and menu to container
            actionsContainer.appendChild(actionsToggle);
            actionsContainer.appendChild(actionsMenu);

            // Toggle menu on click
            actionsToggle.addEventListener("click", (e) => {
              e.stopPropagation();
              actionsMenu.style.display =
                actionsMenu.style.display === "none" ? "block" : "none";
            });

            // Close menu when clicking outside
            document.addEventListener("click", () => {
              actionsMenu.style.display = "none";
            });

            // Add edit button click handler
            editButton.addEventListener("click", (e) => {
              e.stopPropagation();
              const id = e.target.getAttribute("data-comment-id");
              const commentText = e.target
                .closest(".comment-item")
                .querySelector(".comment-text").textContent;

              // Set the current comment text in the modal
              document.getElementById("editCommentText").value = commentText;

              // Store the comment ID for later use
              document
                .getElementById("editCommentText")
                .setAttribute("data-comment-id", id);

              // Show the modal
              editCommentModal.show();

              // Hide the actions menu
              e.target.closest(".comment-actions-menu").style.display = "none";
            });

            deleteButton.addEventListener("click", (e) => {
              const id = e.target.getAttribute("data-comment-id");

              fetch("https://api.jailbreakchangelogs.xyz/comments/delete", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  comment_id: id,
                  author: getCookie("token"),
                }),
              })
                .then((response) => {
                  if (!response.ok) {
                    throw new Error("Failed to delete comment");
                  }
                  return response.json();
                })
                .then((data) => {
                  reloadcomments();
                  // Add toast notification for successful deletion
                  toastr.success("Comment deleted successfully!", "Success", {
                    positionClass: "toast-bottom-right",
                    timeOut: 3000,
                    closeButton: true,
                    progressBar: true,
                  });
                })
                .catch((error) => {
                  console.error("Error deleting comment:", error);
                  // Add toast notification for deletion error
                  toastr.error("Failed to delete comment", "Error", {
                    positionClass: "toast-bottom-right",
                    timeOut: 3000,
                    closeButton: true,
                    progressBar: true,
                  });
                });
            });
          }

          // Append elements
          commentContainer.appendChild(headerContainer);
          commentContainer.appendChild(commentTextElement);
          commentContainer.appendChild(actionsContainer);
          listItem.appendChild(avatarElement);
          listItem.appendChild(commentContainer);
          commentsList.appendChild(listItem);
        });

        // Render pagination controls
        renderPaginationControls(totalPages);
      })
      .catch((error) => {
        console.error("Error processing comments:", error);
      });
  }

  // Function to render modern pagination controls
  function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationControls");
    paginationContainer.innerHTML = ""; // Clear existing controls

    // Add container styling to keep everything in a single row
    paginationContainer.classList.add(
      "d-flex",
      "align-items-center",
      "justify-content-center",
      "gap-2",
      "flex-nowrap"
    );

    // Create left arrow button
    const leftArrow = document.createElement("button");
    leftArrow.innerHTML = `<i class="bi bi-chevron-left"></i>`; // Use an icon (Bootstrap Icons)
    leftArrow.classList.add(
      "btn",
      "btn-primary",
      "rounded-circle",
      "pagination-btn"
    );
    leftArrow.disabled = currentPage === 1; // Disable if on the first page
    leftArrow.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        loadComments(comments); // Reload comments for the current page
        renderPaginationControls(totalPages); // Update pagination controls
      }
    });
    paginationContainer.appendChild(leftArrow);

    // Page number input with label
    const pageInputGroup = document.createElement("div");
    pageInputGroup.classList.add("input-group", "mx-1", "align-items-center");

    const pageLabel = document.createElement("span");
    pageLabel.textContent = `Page `;
    pageLabel.classList.add("text-muted", "fw-semibold");
    pageInputGroup.appendChild(pageLabel);

    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = currentPage;
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.classList.add("form-control", "text-center", "pagination-input");
    pageInput.style.maxWidth = "70px"; // Compact size for mobile
    pageInput.addEventListener("change", () => {
      const newPage = parseInt(pageInput.value, 10);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        loadComments(comments); // Reload comments for the new page
        renderPaginationControls(totalPages); // Update pagination controls
      } else {
        pageInput.value = currentPage; // Reset input if invalid
      }
    });
    pageInputGroup.appendChild(pageInput);

    const totalPageSpan = document.createElement("span");
    totalPageSpan.textContent = ` / ${totalPages}`;
    totalPageSpan.classList.add("text-muted");
    pageInputGroup.appendChild(totalPageSpan);

    paginationContainer.appendChild(pageInputGroup);

    // Create right arrow button
    const rightArrow = document.createElement("button");
    rightArrow.innerHTML = `<i class="bi bi-chevron-right"></i>`; // Use an icon
    rightArrow.classList.add(
      "btn",
      "btn-primary",
      "rounded-circle",
      "pagination-btn"
    );
    rightArrow.disabled = currentPage === totalPages; // Disable if on the last page
    rightArrow.addEventListener("click", () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadComments(comments); // Reload comments for the current page
        renderPaginationControls(totalPages); // Update pagination controls
      }
    });
    paginationContainer.appendChild(rightArrow);
  }

  function reloadcomments() {
    CommentHeader.textContent =
      "Comments For Season " + localStorage.getItem("selectedSeason");
    fetch(
      "https://api.jailbreakchangelogs.xyz/comments/get?type=season&id=" +
        localStorage.getItem("selectedSeason")
    )
      .then((response) => {
        if (!response.ok) {
          console.error("Unexpected response status:", response.status);
          return null; // Exit early if the response is not OK
        }
        return response.json();
      })
      .then((data) => {
        if (!data) return; // Prevent further execution if the response was not OK

        // Check if data contains a message like "No comments found"
        if (data.message && data.message === "No comments found") {
          console.log(data.message);
          commentsList.innerHTML =
            "<p class='text-muted text-center'>Be the first to comment on this entry!</p>";
          // Hide the pagination if no comments are available
          document.getElementById("paginationControls").innerHTML = "";
          return;
        }

        // Check if data contains the comments as an array
        if (Array.isArray(data)) {
          loadComments(data); // Load the comments if data is an array
        } else if (data.comments && Array.isArray(data.comments)) {
          loadComments(data.comments); // Load nested comments if available
        } else {
          console.error("Unexpected response format:", data); // Handle unexpected format
        }
      })
      .catch((error) => {
        console.error("Error fetching comments:", error); // Handle any errors
      });
  }

  CommentForm.addEventListener("submit", function (event) {
    event.preventDefault();
    const comment = document.getElementById("commenter-text");
    console.log(comment.value);
    addComment(comment);
    comment.value = ""; // Clear the comment input field
  });

  // Add the edit comment modal to the document body
  $("body").append(`
    <div class="modal fade" id="editCommentModal" tabindex="-1" aria-labelledby="editCommentModalLabel" aria-hidden="true">
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="editCommentModalLabel">Edit Comment</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <textarea class="form-control" id="editCommentText" rows="3"></textarea>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="saveCommentEdit">Save changes</button>
                </div>
            </div>
        </div>
    </div>
  `);

  // Initialize the modal
  const editCommentModal = new bootstrap.Modal(
    document.getElementById("editCommentModal")
  );

  // Add event listener for saving edited comment
  document
    .getElementById("saveCommentEdit")
    .addEventListener("click", function () {
      const commentId = document
        .getElementById("editCommentText")
        .getAttribute("data-comment-id");
      const newContent = document
        .getElementById("editCommentText")
        .value.trim();
      const token = getCookie("token");

      if (newContent) {
        fetch("https://api.jailbreakchangelogs.xyz/comments/edit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            comment_id: commentId,
            content: newContent,
            author: token,
          }),
        })
          .then((response) => {
            return response.json().then((data) => {
              if (!response.ok) throw new Error("Failed to edit comment");
              return data;
            });
          })
          .then((data) => {
            editCommentModal.hide();

            toastr.success("Comment updated successfully!", "Success", {
              positionClass: "toast-bottom-right",
              timeOut: 3000,
              closeButton: true,
              progressBar: true,
            });

            setTimeout(() => {
              reloadcomments();
            }, 100);
          })
          .catch((error) => {
            console.error("Error editing comment:", error);
            toastr.error("Failed to update comment", "Error", {
              positionClass: "toast-bottom-right",
              timeOut: 3000,
              closeButton: true,
              progressBar: true,
            });
          });
      }
    });
});

function handleinvalidImage() {
  setTimeout(() => {
    const userId = this.id.replace("avatar-", "");
    const username = this.closest("li").querySelector("a").textContent;
    this.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;
  }, 0);
}
