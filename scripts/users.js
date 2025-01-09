document.addEventListener("DOMContentLoaded", function () {
  const permissions = JSON.parse(settings);
  const udata = JSON.parse(userData);

  const follow_button = document.getElementById("follow-button");
  const settings_button = document.getElementById("settings-button");
  const pathSegments = window.location.pathname.split("/");

  // Get if we're in private profile view
  const isPrivateView =
    permissions.profile_public === 0 &&
    sessionStorage.getItem("userid") !== pathSegments[pathSegments.length - 1];

  // If we're in private view, don't proceed with button-related code
  if (isPrivateView) {
    return; // Exit early for private profiles
  }
  const recent_comments_button = document.getElementById(
    "recent-comments-button"
  );

  const input = document.getElementById("bannerInput");
  const loggedinuserId = sessionStorage.getItem("userid");
  const userId = pathSegments[pathSegments.length - 1];
  const card_pagination = document.getElementById("card-pagination");
  const userBanner = document.getElementById("banner");

  // Get button elements
  const editBioButton = document.getElementById("edit-bio-button");
  const saveBioButton = document.getElementById("save-bio-button");
  const cancelBioButton = document.getElementById("cancel-bio-button");
  const userBio = document.getElementById("userBio");
  const characterCount = document.getElementById("character-count");
  const userDateBio = document.getElementById("description-updated-date");

  // Settings modal related elements
  const settingsModal = document.getElementById("settingsModal");
  const profile_public_button = document.getElementById(
    "profile-public-button"
  );
  const show_comments_button = document.getElementById("show-comments-button");
  const hide_following_button = document.getElementById(
    "hide-following-button"
  );
  const hide_followers_button = document.getElementById(
    "hide-followers-button"
  );
  const use_discord_banner_button = document.getElementById("usediscordBanner");
  const bannerInput = document.getElementById("input-for-banner");
  const save_settings_button = document.getElementById("settings-submit");
  const save_settings_loading = document.getElementById("settings-loading");

  // Near the top of the DOMContentLoaded event handler
  if (permissions.profile_public === 0 && loggedinuserId !== userId) {
    // If profile is private and viewer is not the owner
    const mainContent = document.querySelector(".user-content");
    const userStats = document.querySelector(".user-stats");

    // Hide the stats
    if (userStats) {
      userStats.style.display = "none";
    }

    // Hide the follow button if it exists
    if (follow_button) {
      follow_button.style.display = "none";
    }
  }

  // Helper function to update button state
  function updateButtonState(button, value) {
    const icon = document.createElement("i");
    icon.classList.add("bi", value === 1 ? "bi-check-lg" : "bi-x-lg");

    button.classList.remove("btn-danger", "btn-success", "btn-secondary");
    button.classList.add("btn", value === 1 ? "btn-success" : "btn-danger");
    button.innerHTML = icon.outerHTML;
  }

  // Handle settings button click
  settings_button.addEventListener("click", async function () {
    settingsModal.style.display = "block";

    // Show loading state for all buttons
    const buttons = [
      profile_public_button,
      show_comments_button,
      hide_following_button,
      hide_followers_button,
      use_discord_banner_button,
    ];

    buttons.forEach((button) => {
      button.classList.remove("btn-danger", "btn-success");
      button.classList.add("btn-secondary");
      button.innerHTML =
        '<span class="spinner-border spinner-border-sm" role="status"></span>';
    });

    await loadProfileSettings();
  });

  // Load settings from API
  async function loadProfileSettings() {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${loggedinuserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const settings = await response.json();

      // Update button states based on settings
      updateButtonState(profile_public_button, settings.profile_public);
      updateButtonState(show_comments_button, settings.show_recent_comments);

      // Only hide following/followers for other users' profiles
      if (loggedinuserId !== userId) {
        updateButtonState(hide_following_button, settings.hide_following);
        updateButtonState(hide_followers_button, settings.hide_followers);
      } else {
        // For own profile, always show following/followers
        hide_following_button.style.display = "none";
        hide_followers_button.style.display = "none";
      }

      // Handle banner settings
      updateButtonState(use_discord_banner_button, settings.banner_discord);
      bannerInput.style.display = settings.banner_discord ? "none" : "block";
      if (!settings.banner_discord && banner && banner !== "NONE") {
        bannerInput.value = banner;
      }
    } catch (error) {
      console.error("Error loading profile settings:", error);
      toastControl.showToast("error", "Failed to load settings", "Error");
    }
  }

  // Toggle button handlers
  [
    profile_public_button,
    show_comments_button,
    hide_following_button,
    hide_followers_button,
    use_discord_banner_button,
  ].forEach((button) => {
    button.addEventListener("click", function (event) {
      event.preventDefault();
      const icon = button.querySelector("i");
      const isCurrentlyEnabled = icon.classList.contains("bi-check-lg");
      updateButtonState(button, isCurrentlyEnabled ? 0 : 1); // Convert to 0/1

      // Special handling for discord banner button
      if (button === use_discord_banner_button) {
        bannerInput.style.display = isCurrentlyEnabled ? "block" : "none";
        if (isCurrentlyEnabled) {
          bannerInput.value = banner || "";
        }
      }
    });
  });

  // Save settings handler
  save_settings_button.addEventListener("click", async function (event) {
    event.preventDefault();

    save_settings_loading.style.display = "block";
    save_settings_button.disabled = true;

    try {
      const settingsBody = {
        profile_public: profile_public_button
          .querySelector("i")
          .classList.contains("bi-check-lg")
          ? 1
          : 0,
        hide_followers: hide_followers_button
          .querySelector("i")
          .classList.contains("bi-check-lg")
          ? 1
          : 0,
        hide_following: hide_following_button
          .querySelector("i")
          .classList.contains("bi-check-lg")
          ? 1
          : 0,
        show_recent_comments: show_comments_button
          .querySelector("i")
          .classList.contains("bi-check-lg")
          ? 1
          : 0,
        banner_discord: use_discord_banner_button
          .querySelector("i")
          .classList.contains("bi-check-lg")
          ? 1
          : 0,
      };

      const token = getCookie("token");

      // Update settings
      const settingsResponse = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settingsBody),
        }
      );

      if (!settingsResponse.ok) {
        throw new Error(`HTTP error! status: ${settingsResponse.status}`);
      }

      // Update banner if custom banner is enabled
      if (!settingsBody.banner_discord) {
        const image = bannerInput.value.trim() || "NONE";
        const bannerUrl = `https://api3.jailbreakchangelogs.xyz/users/background/update?user=${token}&image=${encodeURIComponent(
          image
        )}`;

        const bannerResponse = await fetch(bannerUrl, {
          method: "POST",
        });

        if (!bannerResponse.ok) {
          throw new Error(
            `Banner update failed! status: ${bannerResponse.status}`
          );
        }
      }

      // Show success message
      toastControl.showToast(
        "success",
        "Settings updated successfully",
        "Success"
      );

      // Add a small delay before reloading to ensure the toast is visible
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error("Error saving settings:", error);
      toastControl.showToast("error", "Failed to update settings", "Error");
    } finally {
      save_settings_loading.style.display = "none";
      save_settings_button.disabled = false;
    }
  });

  // Show edit button only for logged in user viewing their own profile
  function updateBioButtonsVisibility() {
    if (loggedinuserId && loggedinuserId === userId) {
      editBioButton.classList.remove("d-none");
    } else {
      editBioButton.classList.add("d-none");
    }
    saveBioButton.classList.add("d-none");
    cancelBioButton.classList.add("d-none");
  }

  // Handle edit button click
  editBioButton.addEventListener("click", function () {
    // Hide edit button, show save and cancel
    editBioButton.classList.add("d-none");
    saveBioButton.classList.remove("d-none");
    cancelBioButton.classList.remove("d-none");

    // Create textarea
    const textarea = document.createElement("textarea");
    textarea.className = "form-control";
    textarea.id = "bio-textarea";
    textarea.style.minHeight = "150px";
    textarea.style.resize = "none";
    textarea.maxLength = 500;
    textarea.value = userBio.innerText;

    // custom styling
    textarea.style.backgroundColor = "#212a31"; // --bg-primary
    textarea.style.color = "#d3d9d4"; // --text-primary
    textarea.style.border = "1px solid #748d92"; // --text-muted for border
    textarea.style.transition = "border-color 0.2s ease";

    //  focus styles
    textarea.addEventListener("focus", function () {
      this.style.borderColor = "#1d7da3"; // --accent-color-light
      this.style.boxShadow = "0 0 0 0.2rem rgba(29, 125, 163, 0.25)"; // --accent-color-light with opacity
      this.style.backgroundColor = "#2e3944"; // --bg-secondary
    });

    // Reset styles on blur
    textarea.addEventListener("blur", function () {
      this.style.borderColor = "#748d92"; // --text-muted
      this.style.boxShadow = "none";
      this.style.backgroundColor = "#212a31"; // --bg-primary
    });

    // Store original content
    const originalContent = userBio.innerHTML;
    const originalDate = userDateBio.textContent;

    // Replace bio with textarea
    userBio.style.display = "none";
    userBio.insertAdjacentElement("afterend", textarea);

    // Update character count
    characterCount.textContent = `${textarea.value.length}/500`;
    textarea.addEventListener("input", function () {
      characterCount.textContent = `${this.value.length}/500`;
    });

    // Handle cancel
    cancelBioButton.addEventListener("click", function () {
      textarea.remove();
      userBio.style.display = "";
      userBio.innerHTML = originalContent;
      userDateBio.textContent = originalDate;
      characterCount.textContent = "";
      updateBioButtonsVisibility();
    });

    // Handle save
    saveBioButton.addEventListener("click", async function () {
      const description = textarea.value;
      if (description.length > 500) {
        toastControl.showToast(
          "error",
          "Bio cannot exceed 500 characters",
          "Error"
        );
        return;
      }

      try {
        const user = getCookie("token");
        if (!user) {
          toastControl.showToast("error", "You must be logged in", "Error");
          return;
        }

        const response = await fetch(
          "https://api3.jailbreakchangelogs.xyz/users/description/update",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user, description }),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update bio");
        }

        // Update successful
        toastControl.showToast(
          "success",
          "Bio updated successfully",
          "Success"
        );

        // Refresh bio content
        fetchUserBio(userId);

        // Reset UI
        textarea.remove();
        userBio.style.display = "";
        characterCount.textContent = "";
        updateBioButtonsVisibility();
      } catch (error) {
        console.error("Error updating bio:", error);
        toastControl.showToast("error", "Failed to update bio", "Error");
      }
    });
  });

  // Initialize buttons visibility
  updateBioButtonsVisibility();

  if (permissions.profile_public === true && loggedinuserId !== userId) {
    window.location.href = "/users";
  }
  let banner;
  function decimalToHex(decimal) {
    // Convert the decimal number to hex and pad with leading zeros if necessary
    const hex = decimal.toString(16).toUpperCase().padStart(6, "0");

    // Return the hex color with a # prefix
    return `#${hex}`;
  }
  // Toast control mechanism
  const toastControl = {
    lastToastTime: 0,
    minInterval: 1000, // Minimum time between toasts (1 second)
    queue: [],
    isProcessing: false,

    async showToast(type, message, title) {
      const currentTime = Date.now();

      // If trying to show toast too soon after the last one, queue it
      if (currentTime - this.lastToastTime < this.minInterval) {
        this.queue.push({ type, message, title });
        if (!this.isProcessing) {
          this.processQueue();
        }
        return;
      }

      // Show the toast
      this.displayToast(type, message, title);
      this.lastToastTime = currentTime;
    },

    async processQueue() {
      if (this.queue.length === 0) {
        this.isProcessing = false;
        return;
      }

      this.isProcessing = true;
      const { type, message, title } = this.queue.shift();
      this.displayToast(type, message, title);
      this.lastToastTime = Date.now();

      // Process next toast after interval
      setTimeout(() => this.processQueue(), this.minInterval);
    },

    displayToast(type, message, title) {
      const toastOptions = {
        positionClass: "toast-bottom-right",
        timeOut: 3000,
        closeButton: true,
        progressBar: true,
        preventDuplicates: true,
      };

      switch (type) {
        case "success":
          toastr.success(message, title, toastOptions);
          break;
        case "error":
          toastr.error(message, title, toastOptions);
          break;
        case "info":
          toastr.info(message, title, toastOptions);
          break;
      }
    },
  };

  async function fetchBanner(userId, bannerHash, format) {
    const url = `https://cdn.discordapp.com/banners/${userId}/${bannerHash}.${format}?size=4096`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  }

  // Add this helper function to handle banner URL resolution
  async function getBannerUrl(userId, bannerHash) {
    if (!bannerHash) {
      return null;
    }

    try {
      // Try GIF first
      const gifUrl = await fetchBanner(userId, bannerHash, "gif");
      if (gifUrl) {
        return gifUrl;
      }
      // Fallback to PNG if GIF doesn't exist
      const pngUrl = await fetchBanner(userId, bannerHash, "png");
      if (pngUrl) {
        return pngUrl;
      }
    } catch (error) {
      console.error("Error fetching banner:", error);
    }

    return null;
  }
  async function fetchUserBanner(userId) {
    try {
      let image;
      const fallbackBanner =
        "https://placehold.co/600x400/212a31/d3d9d4?text=This%20user%20has%20no%20banner";

      if (permissions.banner_discord === true) {
        // Try to get animated banner first
        image = await getBannerUrl(userId, udata.banner);
        if (!image) {
          // If no banner exists at all, use fallback
          image = fallbackBanner;
        }
      } else {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/background/get?user=${userId}`
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const bannerData = await response.json();
        image = bannerData.image_url || fallbackBanner; // Use fallback if no image_url
      }

      userBanner.src = image;
      banner = image;
    } catch (error) {
      console.error("Error fetching banner:", error);
      // Use fallback banner in case of any error
      userBanner.src =
        "https://placehold.co/600x400/212a31/d3d9d4?text=This%20user%20has%20no%20banner";
      banner = userBanner.src;
    }
  }

  function updateUIForUser() {
    follow_button.classList.remove("d-none");
    settings_button.classList.add("d-none");

    if (!loggedinuserId) {
      settings_button.classList.add("d-none");
      return;
    }

    if (loggedinuserId === userId) {
      follow_button.classList.add("d-none");
      settings_button.classList.remove("d-none");
    }
  }

  async function fetchUserBio(userId) {
    try {
      console.log("Fetching bio for user:", userId);

      // Fetch both bio and user data in parallel
      const [bioResponse, userResponse] = await Promise.all([
        fetch(
          `https://api3.jailbreakchangelogs.xyz/users/description/get?user=${userId}`
        ),
        fetch(`https://api3.jailbreakchangelogs.xyz/users/get/?id=${userId}`),
      ]);

      console.log("Bio API response status:", bioResponse.status);

      if (!bioResponse.ok || !userResponse.ok) {
        if (bioResponse.status === 404) {
          console.log("No bio found (404)");
          userBio.textContent = "";
        } else {
          console.log("Error fetching bio:", bioResponse.status);
          userBio.textContent = "Error fetching description.";
          throw new Error(`HTTP error! status: ${bioResponse.status}`);
        }
      }

      await fetchUserBanner(userId);

      const [user, userData] = await Promise.all([
        bioResponse.json(),
        userResponse.json(),
      ]);

      console.log("Received bio data:", user);

      const timestamp = user.last_updated || 0;
      const date = formatDate(timestamp);
      console.log("Formatted date:", date);

      const description = user.description || "No description available.";
      console.log("Description to display:", description);

      // Format the created_at date using the Unix timestamp
      const createdTimestamp = parseInt(userData.created_at) * 1000; // Convert to milliseconds
      const memberSince = new Date(createdTimestamp).toLocaleDateString(
        "en-GB",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      );

      // Update the bio text
      userBio.innerHTML = description;

      // Update the date
      // Update the date in userDateBio
      userDateBio.innerHTML = `
      <div class="mb-2">Last updated: ${date}</div>
      <hr class="my-2" style="border-color: #748D92; opacity: 0.2;">
      <div style="color: #748D92;">Member since: ${memberSince}</div>
      `;

      console.log("Bio elements updated:", {
        bioContent: userBio.innerHTML,
        dateContent: userDateBio.textContent,
      });
    } catch (error) {
      console.error("Error in fetchUserBio:", error);
      userBio.textContent = "Error fetching user bio.";
    }
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

  function formatDate(unixTimestamp) {
    // Check if timestamp is in seconds or milliseconds
    const isMilliseconds = unixTimestamp.toString().length > 10;
    const timestamp = isMilliseconds ? unixTimestamp : unixTimestamp * 1000;

    const date = new Date(timestamp);

    // Format the date in the desired format "8 Jan 2025 at 09:27 AM"
    const day = date.getDate();
    const month = date.toLocaleString("en-GB", { month: "short" });
    const year = date.getFullYear();
    const time = date.toLocaleString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    return `${day} ${month} ${year} at ${time}`;
  }

  async function fetchCommentItem(comment) {
    try {
      let url;
      let item;
      let rewards;

      // Check if comment and item_type exist before accessing
      if (!comment || !comment.item_type) {
        console.error("Invalid comment data:", comment);
        return null;
      }

      // Add timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      try {
        // Set the URL and fetch data based on item type
        switch (comment.item_type) {
          case "changelog":
            url = `https://api3.jailbreakchangelogs.xyz/changelogs/get?id=${comment.item_id}`;
            break;
          case "season":
            // Handle season case separately due to rewards
            const [seasonResponse, rewardsResponse] = await Promise.all([
              fetch(
                `https://api3.jailbreakchangelogs.xyz/seasons/get?season=${comment.item_id}`,
                {
                  signal: controller.signal,
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                }
              ),
              fetch(
                `https://api3.jailbreakchangelogs.xyz/rewards/get?season=${comment.item_id}`,
                {
                  signal: controller.signal,
                  headers: {
                    Accept: "application/json",
                    "Content-Type": "application/json",
                  },
                }
              ),
            ]);

            if (!seasonResponse.ok || !rewardsResponse.ok) {
              throw new Error(
                `HTTP error! status: ${
                  seasonResponse.status || rewardsResponse.status
                }`
              );
            }

            item = await seasonResponse.json();
            rewards = await rewardsResponse.json();
            item.rewards = rewards;

            // Add image URL for season
            const level10Reward = item.rewards?.find?.(
              (reward) => reward.requirement === "Level 10"
            );
            item.image_url =
              level10Reward?.link || "assets/images/changelogs/347.webp";

            return item;

          // New item types
          case "Vehicle":
          case "spoiler":
          case "color":
          case "furniture":
            url = `https://api3.jailbreakchangelogs.xyz/items/get?type=${comment.item_type}&id=${comment.item_id}`;
            break;

          default:
            console.error("Unknown item type:", comment.item_type);
            return null;
        }

        // For non-season items, fetch the data
        if (comment.item_type !== "season") {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          item = await response.json();
        }

        // Clear timeout since request completed
        clearTimeout(timeoutId);

        return item;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Request timed out");
      } else {
        console.error("Error fetching comment item:", error);
      }
      return null;
    }
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
  }

  function renderPaginationControls(totalPages) {
    const paginationContainer = document.getElementById("paginationControls");
    paginationContainer.innerHTML = ""; // Clear existing controls

    // Common button styles with your color palette
    const buttonClasses = "btn m-1";
    const buttonStyle = `
            background-color: #2E3944; 
            color: #D3D9D4;
            border: 1px solid #748D92;
            font-size: 0.875rem;
            padding: 0.25rem 0.5rem;
            transition: all 0.2s ease;
        `;
    const buttonHoverStyle = `
            background-color: #124E66;
            color: #D3D9D4;
            border-color: #D3D9D4;
        `;

    // Helper function to create buttons
    function createButton(text, isDisabled, onClick) {
      const button = document.createElement("button");
      button.textContent = text;
      button.classList.add(...buttonClasses.split(" "));
      button.style.cssText = buttonStyle;
      button.disabled = isDisabled;

      if (!isDisabled) {
        button.addEventListener("mouseover", () => {
          button.style.cssText = buttonStyle + buttonHoverStyle;
        });
        button.addEventListener("mouseout", () => {
          button.style.cssText = buttonStyle;
        });
        button.addEventListener("click", onClick);
      } else {
        button.style.opacity = "0.5";
        button.style.cursor = "not-allowed";
      }

      return button;
    }

    // Double left arrow
    const doubleLeftArrow = createButton("<<", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage = 1;
        fetchUserComments(userId);
      }
    });
    paginationContainer.appendChild(doubleLeftArrow);

    // Left arrow
    const leftArrow = createButton("<", currentPage === 1, () => {
      if (currentPage > 1) {
        currentPage--;
        fetchUserComments(userId);
      }
    });
    paginationContainer.appendChild(leftArrow);

    // Page input
    const pageInput = document.createElement("input");
    pageInput.type = "number";
    pageInput.value = currentPage;
    pageInput.min = 1;
    pageInput.max = totalPages;
    pageInput.classList.add("form-control", "mx-1");
    pageInput.style.cssText = `
            width: 50px;
            height: 31px;
            font-size: 0.875rem;
            padding: 0.25rem;
            background-color: #2E3944;
            color: #D3D9D4;
            border: 1px solid #748D92;
            text-align: center;
        `;
    pageInput.addEventListener("change", () => {
      const newPage = parseInt(pageInput.value);
      if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        fetchUserComments(userId);
      } else {
        pageInput.value = currentPage;
      }
    });
    paginationContainer.appendChild(pageInput);

    // Right arrow
    const rightArrow = createButton(">", currentPage === totalPages, () => {
      if (currentPage < totalPages) {
        currentPage++;
        fetchUserComments(userId);
      }
    });
    paginationContainer.appendChild(rightArrow);

    // Double right arrow
    const doubleRightArrow = createButton(
      ">>",
      currentPage === totalPages,
      () => {
        currentPage = totalPages;
        fetchUserComments(userId);
      }
    );
    paginationContainer.appendChild(doubleRightArrow);
  }

  let currentPage = 1;
  const commentsPerPage = 3;

  async function fetchUserComments(userId) {
    const recentComments = document.getElementById("comments-list");
    let loadingSpinner = document.getElementById("loading-spinner");

    if (!recentComments) {
      console.error("comments-list element not found");
      return;
    }

    try {
      recentComments.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center" style="min-height: 200px;">
                <span class="text-light mb-2">Loading comments...</span>
                <span id="loading-spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </div>`;

      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/comments/get/user?author=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const comments = await response.json();

      if (!Array.isArray(comments)) {
        console.error("Invalid comments format:", comments);
        recentComments.innerHTML = "<div>No recent comments.</div>";
        return;
      }

      if (comments.length === 0) {
        recentComments.innerHTML = "<div>No recent comments.</div>";
        return;
      }

      // Calculate pagination
      const totalComments = comments.length;
      const totalPages = Math.ceil(totalComments / commentsPerPage);
      const startIndex = (currentPage - 1) * commentsPerPage;
      const paginatedComments = comments.slice(
        startIndex,
        startIndex + commentsPerPage
      );

      // Clear existing content
      recentComments.innerHTML = "";
      const comments_to_add = [];

      // Process each comment
      // In the fetchUserComments function, modify the comment card creation section:

      // Process each comment
      for (const comment of paginatedComments) {
        const item = await fetchCommentItem(comment);

        if (!item) {
          continue; // Skip this comment if we couldn't fetch its details
        }

        const formattedDate = formatDate(comment.date);
        const commentElement = document.createElement("div");

        // Get the correct image URL
        let imageUrl;
        let displayTitle = item.title; // Default for changelogs/seasons
        let displayType = comment.item_type;
        let displayId = comment.item_id;
        let viewPath = `/${comment.item_type}s/${comment.item_id}`; // Default path

        // Handle different item types
        if (comment.item_type === "season") {
          const level10Reward = item.rewards?.find?.(
            (reward) => reward.requirement === "Level 10"
          );
          imageUrl = level10Reward?.link || "assets/images/changelogs/347.webp";
        } else if (
          ["Vehicle", "Spoiler", "Color", "Furniture", "Rim"].includes(
            comment.item_type
          )
        ) {
          // Updated image URL structure to match the correct path
          const itemType = comment.item_type.toLowerCase() + "s"; // Add 's' to pluralize
          imageUrl = item.name
            ? `/assets/items/${itemType}/${item.name}.webp` // Added /assets/items/ and .webp extension
            : "assets/images/changelogs/347.webp";
          displayTitle = item.name || "Unknown Item";
          displayType = item.type || comment.item_type;
          viewPath = `/item/${comment.item_type.toLowerCase()}/${encodeURIComponent(
            displayTitle.toLowerCase()
          )}`;
        } else {
          imageUrl = "assets/images/changelogs/347.webp";
        }

        commentElement.className = "list-group-item";
        // Create the comment card with the updated display values
        commentElement.innerHTML = `
    <div class="card mb-3 comment-card shadow-lg" style="background-color: #212A31; color: #D3D9D4;">
      <div class="card-body">
        <div class="row">
          <!-- Image Section -->
          <div class="col-md-4 d-none d-md-block">
            <img src="${imageUrl}" alt="Comment Image" class="img-fluid rounded" style="max-height: 150px; object-fit: cover;">
          </div>
          
          <!-- Content Section -->
          <div class="col-md-8">
            <div class="comment-header mb-2">
              <h6 class="card-title" style="color: #748D92;">
                ${displayTitle} [${capitalizeFirstLetter(displayType)}]
              </h6>
              <small class="text-muted" style="color: #748D92;">${formattedDate}</small>
            </div>
            <h5 class="card-subtitle mb-2" style="color: #748D92;">
              ${displayTitle}
            </h5>
            <p class="card-text" style="color: #D3D9D4;">${comment.content}</p>
            <a href="${viewPath}" class="btn btn-sm mt-3 view-item-btn">
              View ${capitalizeFirstLetter(displayType)}
            </a>
          </div>
        </div>
      </div>
    </div>`;

        comments_to_add.push(commentElement);
      }

      // Add all comments to the DOM
      recentComments.innerHTML = "";
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = card_pagination.innerHTML;
      const spans = tempDiv.getElementsByTagName("span");
      while (spans.length > 0) {
        spans[0].parentNode.removeChild(spans[0]);
      }
      card_pagination.innerHTML = tempDiv.innerHTML; // Clear existing pagination controls
      renderPaginationControls(totalPages);
      recentComments.append(...comments_to_add);
    } catch (error) {
      console.error("Error fetching comments:", error);
      // Replace this line in the catch block of fetchUserComments function:
      recentComments.innerHTML = `
        <div class="alert alert-danger d-flex align-items-center gap-2 m-3" role="alert">
          <i class="bi bi-exclamation-triangle-fill"></i>
          <div>
            Error loading comments. Please try again later.
          </div>
        </div>`;
    } finally {
      if (loadingSpinner) {
        loadingSpinner.remove();
      }
    }
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

  async function updateUserCounts(userId) {
    try {
      // Show 0 initially instead of loading spinners
      const following = document.getElementById("following");
      const followers = document.getElementById("followers");
      following.textContent = "0 Following";
      followers.textContent = "0 Followers";

      // Special case for owner display
      if (userId === "659865209741246514" || userId === "1019539798383398946") {
        const crown = document.getElementById("crown");
        crown.style.display = "inline-block";
      }

      // Fetch data
      const [followingArray, followersArray, userSettings] = await Promise.all([
        fetchUserFollowing(userId),
        fetchUserFollowers(userId),
        fetch(
          `https://api3.jailbreakchangelogs.xyz/users/settings?user=${userId}`
        )
          .then((res) => res.json())
          .catch(() => ({})),
      ]);

      // Update follow button state
      const isFollowing = followersArray.some(
        (follower) => follower.follower_id === loggedinuserId
      );
      follow_button.textContent = isFollowing ? "Unfollow" : "Follow";

      // Calculate counts
      const followingCount = Array.isArray(followingArray)
        ? followingArray.length
        : 0;
      const followersCount = Array.isArray(followersArray)
        ? followersArray.length
        : 0;

      // Create following link
      const followingLink = document.createElement("a");
      // CHANGE THIS PART - Always show links for profile owner
      followingLink.href = `/users/${userId}/following`; // Remove the conditional

      const followingCount_span = document.createElement("span");
      // Always show count for profile owner
      followingCount_span.textContent = followingCount;
      followingCount_span.classList.add("fw-bold");
      followingCount_span.style.color = "#748D92";
      followingCount_span.setAttribute("data-bs-toggle", "tooltip");
      followingCount_span.setAttribute("data-bs-placement", "top");
      followingCount_span.setAttribute(
        "title",
        followingCount.toLocaleString()
      );

      followingLink.appendChild(followingCount_span);
      followingLink.appendChild(document.createTextNode(" Following"));
      followingLink.classList.add("text-decoration-none");
      followingLink.style.color = "#D3D9D4";

      // Create followers link
      const followersLink = document.createElement("a");
      // CHANGE THIS PART - Always show links for profile owner
      followersLink.href = `/users/${userId}/followers`; // Remove the conditional

      const followersCount_span = document.createElement("span");
      // Always show count for profile owner
      followersCount_span.textContent = followersCount;
      followersCount_span.classList.add("fw-bold");
      followersCount_span.style.color = "#748D92";
      followersCount_span.setAttribute("data-bs-toggle", "tooltip");
      followersCount_span.setAttribute("data-bs-placement", "top");
      followersCount_span.setAttribute(
        "title",
        followersCount.toLocaleString()
      );

      followersLink.appendChild(followersCount_span);
      followersLink.appendChild(document.createTextNode(" Followers"));
      followersLink.classList.add("text-decoration-none");
      followersLink.style.color = "#D3D9D4";

      // Clear containers and add new content
      following.innerHTML = "";
      followers.innerHTML = "";
      following.appendChild(followingLink);
      followers.appendChild(followersLink);
    } catch (error) {
      console.error("Error updating user counts:", error);
      // Show error state
      following.innerHTML = "Error loading";
      followers.innerHTML = "Error loading";
    }
  }

  updateUIForUser();

  // Find this section in the code (around line 704)
  if (permissions.show_recent_comments === 1) {
    card_pagination.style.display = "block";
    fetchUserComments(userId);
  } else {
    card_pagination.style.display = "none";
    // Add a message to inform users why comments aren't showing
    const recentComments = document.getElementById("comments-list");
    if (recentComments) {
      recentComments.innerHTML = `
      <div class="text-center p-3" style="color: #748D92;">
        <i class="bi bi-eye-slash me-2"></i>
        This user has disabled the display of their comments
      </div>`;
    }
  }

  function setAvatarWithFallback(username) {
    const userAvatar = document.getElementById("user-avatar");
    const fallbackUrl = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      username
    )}&bold=true&format=svg`;

    userAvatar.onerror = function () {
      userAvatar.src = fallbackUrl;
    };
  }

  userAvatar = document.getElementById("user-avatar");
  if (!udata.accent_color) {
    userAvatar.style.border = "4px solid #000"; // Default blue border color
  } else {
    const hexColor = decimalToHex(udata.accent_color);
    userAvatar.style.border = `4px solid ${hexColor}`;
  }
  setAvatarWithFallback(udata.username);

  updateUserCounts(userId);
  fetchUserBio(userId);

  const description_tab = document.getElementById("description-tab");

  async function fetchUserFollowers(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`,
        {
          headers: {
            Authorization: sessionStorage.getItem("userid"),
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          toastControl.showToast("error", "User not found", "Error");
          return [];
        }
        toastControl.showToast("error", "Failed to fetch followers", "Error");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const followers = await response.json();
      return Array.isArray(followers) ? followers : [];
    } catch (error) {
      console.error("Error fetching followers:", error);
      toastControl.showToast("error", "Error loading followers data", "Error");
      return []; // Always return an array, even on error
    }
  }

  async function fetchUserFollowing(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/following/get?user=${userId}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          toastControl.showToast("error", "User not found", "Error");
          return [];
        }
        toastControl.showToast("error", "Failed to fetch following", "Error");
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const following = await response.json();
      return Array.isArray(following) ? following : [];
    } catch (error) {
      console.error("Error fetching following:", error);
      toastControl.showToast("error", "Error loading following data", "Error");
      return []; // Always return an array, even on error
    }
  }

  async function addFollow(userId) {
    try {
      const user = getCookie("token");
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/add`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ follower: user, following: userId }),
        }
      );

      if (!response.ok) {
        if (response.status === 409) {
          alreadyFollowingToast("You are already following this user.");
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      toastControl.showToast(
        "success",
        "Successfully followed user!",
        "Success"
      );
      await updateUserCounts(userId);
      return true;
    } catch (error) {
      console.error("Error adding follow:", error);
      toastControl.showToast(
        "error",
        "Failed to follow user. Please try again.",
        "Error"
      );
      return false;
    }
  }

  async function removeFollow(userId) {
    try {
      const user = getCookie("token");
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/remove`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ follower: user, following: userId }),
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          NotFollowingToast("You are not following this user.");
          return false;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      FollowToast("Successfully unfollowed user!");
      await updateUserCounts(userId);
      return true;
    } catch (error) {
      console.error("Error removing follow:", error);
      NotFollowingToast("Failed to unfollow user. Please try again.");
      return false;
    }
  }

  follow_button.addEventListener("click", function () {
    if (follow_button.disabled) return;
    follow_button.disabled = true;

    const user = getCookie("token");
    if (!user) {
      // User is not logged in
      toastControl.showToast(
        "error",
        "You are not logged in to perform this action.",
        "Error"
      );
      follow_button.disabled = false;
      return;
    }
    if (follow_button.textContent === "Follow") {
      addFollow(userId)
        .then(() => {
          toastControl.showToast(
            "success",
            "User followed successfully.",
            "Success"
          );
          follow_button.textContent = "Unfollow";
        })
        .finally(() => {
          follow_button.disabled = false;
        });
    } else {
      removeFollow(userId)
        .then(() => {
          toastControl.showToast(
            "success",
            "User unfollowed successfully.",
            "Success"
          );
          follow_button.textContent = "Follow";
        })
        .finally(() => {
          follow_button.disabled = false;
        });
    }
  });
  function AlertToast(message) {
    toastControl.showToast("info", message, "Alert");
  }
  function SuccessToast(message) {
    toastControl.showToast("success", message, "Alert");
  }

  crown.addEventListener("click", function () {
    fetch(`/owner/check/${userId}`, {
      method: "GET", // Specify the method, e.g., GET
      headers: {
        "Content-Type": "application/json", // Set content type to JSON
      },
    })
      .then((response) => {
        if (response.status === 200) {
          AlertToast("This user created Jailbreak Changelogs!");
        } else {
          SuccessToast(
            'The only owners of Jailbreak Changelogs are <a href="/users/659865209741246514" target="_blank" rel="noopener noreferrer">@Jakobiis</a> and <a href="/users/1019539798383398946" target="_blank" rel="noopener noreferrer">@Jalenzz</a>'
          );
          AlertToast(
            "This crown is given out to the creators of Jailbreak Changelogs! Unfortunately, this user is not one of them 🤣"
          );
        }
      })
      .catch((error) => {
        console.error("Error fetching owner status:", error);
        AlertToast("There was an error checking the owner's status.");
      });
  });

  settings_button.addEventListener("click", function () {
    const settingsModal = document.getElementById("settingsModal");
    settingsModal.style.display = "block";
    profile_public_button.classList.remove("btn-danger", "btn-success");
    show_comments_button.classList.remove("btn-danger", "btn-success");
    hide_following_button.classList.remove("btn-danger", "btn-success");
    hide_followers_button.classList.remove("btn-danger", "btn-success");
    use_discord_banner_button.classList.remove("btn-danger", "btn-success");

    profile_public_button.classList.add("btn-secondary");
    show_comments_button.classList.add("btn-secondary");
    hide_following_button.classList.add("btn-secondary");
    hide_followers_button.classList.add("btn-secondary");
    use_discord_banner_button.classList.add("btn-secondary");

    profile_public_button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>';
    show_comments_button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>';
    hide_following_button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>';
    hide_followers_button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>';
    use_discord_banner_button.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="false"></span><span id="button-text"></span>';
    loadProfileSettings();
  });
  async function loadProfileSettings() {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/settings?user=${loggedinuserId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const settings = await response.json();

      // Process each setting
      for (const [key, value] of Object.entries(settings)) {
        switch (key) {
          case "hide_followers":
            const hideFollowersIcon = document.createElement("i");
            hideFollowersIcon.classList.add(
              "bi",
              value === 1 ? "bi-check-lg" : "bi-x-lg"
            );

            hide_followers_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            hide_followers_button.classList.add(
              "btn",
              value === 1 ? "btn-success" : "btn-danger"
            );
            hide_followers_button.innerHTML = hideFollowersIcon.outerHTML; // Update button with the icon
            break;
          case "hide_following":
            // Logic for hide_following
            const hideFollowingIcon = document.createElement("i");
            hideFollowingIcon.classList.add(
              "bi",
              value === 1 ? "bi-check-lg" : "bi-x-lg"
            ); // Set the icon based on the value

            hide_following_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            hide_following_button.classList.add(
              "btn",
              value === 1 ? "btn-success" : "btn-danger"
            ); // Update button class based on value
            hide_following_button.innerHTML = hideFollowingIcon.outerHTML; // Update button with the icon
            break;
          case "profile_public":
            // Logic for profile_public
            const profilePublicIcon = document.createElement("i");
            profilePublicIcon.classList.add(
              "bi",
              value === 1 ? "bi-check-lg" : "bi-x-lg"
            ); // Set icon based on public/private status

            profile_public_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            profile_public_button.classList.add(
              "btn",
              value === 1 ? "btn-success" : "btn-danger"
            ); // Update button class based on value
            profile_public_button.innerHTML = profilePublicIcon.outerHTML; // Update button with the icon
            break;
          case "show_recent_comments":
            // Logic for show_recent_comments
            const recentCommentsIcon = document.createElement("i");
            recentCommentsIcon.classList.add(
              "bi",
              value ? "bi-check-lg" : "bi-x-lg"
            ); // Set icon based on the value

            show_comments_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            show_comments_button.classList.add(
              "btn",
              value ? "btn-success" : "btn-danger"
            ); // Update button class based on value
            show_comments_button.innerHTML = recentCommentsIcon.outerHTML; // Update button with the icon
            break;
          case "banner_discord":
            const bannerDiscordIcon = document.createElement("i");
            bannerDiscordIcon.classList.add(
              "bi",
              value === 1 ? "bi-check-lg" : "bi-x-lg"
            );

            // Show/hide input field based on the value
            bannerInput.style.display = value === 1 ? "none" : "block";

            // Only set banner input value if there's a valid banner
            if (banner && banner !== "NONE") {
              bannerInput.value = banner;
            } else {
              bannerInput.value = ""; // Clear the input if no valid banner
            }

            use_discord_banner_button.classList.remove(
              "btn-danger",
              "btn-success"
            );
            use_discord_banner_button.classList.add(
              value === 1 ? "btn-success" : "btn-danger"
            );
            use_discord_banner_button.innerHTML = bannerDiscordIcon.outerHTML;
            break;

          default:
            break;
        }
      }
    } catch (error) {
      console.error("Error loading profile settings:", error);
    }
  }

  async function validateImageURL(url) {
    if (!url || url.trim() === "" || url === "NONE") {
      return "None";
    }

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          Origin: "",
        },
      });

      return response.ok ? url : "None";
    } catch (error) {
      return "None";
    }
  }

  const close_settings_button = document.getElementById("close-settings");
  const settings_modal = document.getElementById("settingsModal");
  close_settings_button.addEventListener("click", function () {
    settings_modal.style.display = "none";
  });
});
