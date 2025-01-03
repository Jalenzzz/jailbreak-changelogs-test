document.addEventListener("DOMContentLoaded", function () {
  const permissions = JSON.parse(settings);
  const udata = JSON.parse(userData);
  const userDateBio = document.getElementById("description-updated-date");
  const recent_comments_button = document.getElementById(
    "recent-comments-button"
  );
  const input = document.getElementById("bannerInput");
  const loggedinuserId = sessionStorage.getItem("userid");
  const pathSegments = window.location.pathname.split("/");
  const userId = pathSegments[pathSegments.length - 1];
  const card_pagination = document.getElementById("card-pagination");
  const userBanner = document.getElementById("banner");
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

  async function fetchUserBanner(userId) {
    try {
      let image;
      if (permissions.banner_discord === true) {
        image = `https://cdn.discordapp.com/banners/${userId}/${udata.banner}.png`;
      } else {
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/background/get?user=${userId}`
        ); // Replace with actual URL

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const bannerData = await response.json();
        image = bannerData.image_url;
      }

      userBanner.src = image;
      banner = image;
      // Process and display the banner data here, e.g.:
      // document.getElementById('banner').src = bannerData.image_url;
    } catch (error) {
      console.error("Error fetching banner:", error);
    }
  }
  async function fetchUserBio(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/description/get?user=${userId}`
      );

      if (!response.ok) {
        if (response.status === 404) {
          userBio.textContent = "";
        } else {
          userBio.textContent = "Error fetching description.";
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      await fetchUserBanner(userId);

      const user = await response.json();
      const timestamp = user.last_updated || 0;
      const date = formatDate(timestamp);
      const description = user.description || "No description available."; // Fallback message

      // Regular expression to match URLs starting with "https://"
      const urlRegex = /https:\/\/[^\s]+/g;
      let resultHtml = "";
      let lastIndex = 0;

      // Split the description by newlines
      const lines = description.split("\n");

      lines.forEach((line) => {
        const matches = line.match(urlRegex);
        if (matches) {
          // Iterate through the matches to build the result
          matches.forEach((url) => {
            // Find the start index of the current URL
            const urlIndex = line.indexOf(url);
            // Extract text before the current URL
            const textBeforeLink = line.slice(0, urlIndex).trim();

            // Add the text before the URL to the result
            if (textBeforeLink) {
              resultHtml += `${textBeforeLink} `;
            }

            // Add the link element
            resultHtml += `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> `;

            // Remove the processed part of the line for the next loop
            line = line.slice(urlIndex + url.length);
          });
        }
        // Add any remaining text after the last URL
        if (line.trim()) {
          resultHtml += line.trim(); // Add the remaining text from the line
        }
        resultHtml += "<br>"; // Add a line break after each line
      });

      resultHtml = resultHtml.replace(/(<br\s*\/?>\s*){2,}$/, "<br>");

      // Set the user bio with the cleaned-up result
      editbio_button.innerHTML = '<i class="bi bi-pencil-fill"></i>';
      savebio_button.style.display = "none";
      savebio_button.innerHTML = '<i class="bi bi-save"></i>';
      if (loggedinuserId === userId) {
        editbio_button.style.display = "inline-block";
      }
      userDateBio.textContent = `${date}`;
      userBio.innerHTML = resultHtml.trim();
      savebio_button.disabled = false;
      editbio_button.disabled = false;
    } catch (error) {
      console.error("Error:", error);
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
  async function fetchSeasonRewards(season) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/rewards/get?season=${season}`
      );
      if (!response.ok) {
        if (response.status === 404) {
          return "No rewards found for this season.";
        } else {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      }
      const rewards = await response.json();
      return rewards;
    } catch (error) {
      console.error("Error:", error);
      return "Error fetching season rewards.";
    }
  }

  async function fetchCommentItem(comment) {
    try {
      let url;
      // Check if comment and item_type exist before accessing
      if (!comment || !comment.item_type) {
        console.error("Invalid comment data:", comment);
        return null;
      }

      // Set the URL based on item type
      if (comment.item_type === "changelog") {
        url = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${comment.item_id}`;
      } else if (comment.item_type === "season") {
        url = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${comment.item_id}`;
      } else {
        console.error("Unknown item type:", comment.item_type);
        return null;
      }

      // Add timeout to fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Item not found for comment:`, comment);
          return null;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error) {
      if (error.name === "AbortError") {
        console.error("Request timed out:", url);
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

    try {
      recentComments.innerHTML = `
            <div class="d-flex flex-column align-items-center justify-content-center" style="min-height: 200px;">
                <span class="text-light mb-2">Loading comments...</span>
                <span id="loading-spinner" class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            </div>`;

      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/comments/get/user?author=${userId}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const comments = await response.json();

      // Validate that comments is an array
      if (!Array.isArray(comments)) {
        console.error("Received invalid comments data:", comments);
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
      for (const comment of paginatedComments) {
        const item = await fetchCommentItem(comment);

        if (!item) {
          continue; // Skip this comment if we couldn't fetch its details
        }

        const formattedDate = formatDate(comment.date);
        const commentElement = document.createElement("div");

        // Get the correct image URL
        let imageUrl;
        if (comment.item_type === "season") {
          const rewards = await fetchSeasonRewards(comment.item_id);
          const level10Reward = rewards?.find?.(
            (reward) => reward.requirement === "Level 10"
          );
          imageUrl =
            level10Reward?.link ||
            "https://cdn2.jailbreakchangelogs.xyz/images/changelogs/347.webp";
        } else {
          imageUrl =
            item.image_url ||
            "https://cdn2.jailbreakchangelogs.xyz/images/changelogs/347.webp";
        }

        commentElement.className = "list-group-item";
        // Create the comment card with the correct image URL
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
                                    <h6 class="card-title" style="color: #748D92;">${capitalizeFirstLetter(
                                      comment.item_type
                                    )} ${comment.item_id}</h6>
                                    <small class="text-muted" style="color: #748D92;">${formattedDate}</small>
                                </div>
                                <h5 class="card-subtitle mb-2" style="color: #748D92;">${
                                  item.title
                                }</h5>
                                <p class="card-text" style="color: #D3D9D4;">${
                                  comment.content
                                }</p>
                                <a href="/${comment.item_type}s/${
          comment.item_id
        }" class="btn btn-sm mt-3 view-item-btn">
                                    View ${capitalizeFirstLetter(
                                      comment.item_type
                                    )}
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
      recentComments.innerHTML =
        "<div>Error loading comments. Please try again later.</div>";
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
  const follow_button = document.getElementById("follow-button");
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
      const [followingArray, followersArray] = await Promise.all([
        fetchUserFollowing(userId),
        fetchUserFollowers(userId),
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
      followingLink.href = `/users/${userId}/following`; // Always set the href
      const followingCount_span = document.createElement("span");
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
      followersLink.href = `/users/${userId}/followers`; // Always set the href
      const followersCount_span = document.createElement("span");
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

  const settings_button = document.getElementById("settings-button");
  const editbio_button = document.getElementById("edit-bio-button");
  editbio_button.innerHTML =
    '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>';
  editbio_button.disabled = true;

  if (loggedinuserId === userId) {
    follow_button.style.display = "none";
    settings_button.style.display = "inline-block";
    editbio_button.style.display = "inline-block";
  } else {
    settings_button.style.display = "none";
    editbio_button.style.display = "none";
  }
  const userBio = document.getElementById("userBio");
  const character_count = document.getElementById("character-count");
  fetchUserBio(userId);

  if (permissions.show_recent_comments === false) {
    card_pagination.style.display = "block";

    fetchUserComments(userId);
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

  const savebio_button = document.getElementById("save-bio-button");
  const cancel_button = document.getElementById("canceledit");
  updateUserCounts(userId);
  editbio_button.addEventListener("click", function () {
    editbio_button.style.display = "none";
    savebio_button.style.display = "inline-block";
    cancel_button.style.display = "inline-block";
    const descriptionBox = document.getElementById("description-box");
    userDateBio.textContent = "";
    character_count.textContent = "0/500"; // Reset character count

    // Clear previous content
    userBio.style.display = "none";
    const icon = editbio_button.querySelector("i"); // Get the icon element

    // Create a text input
    const textInput = document.createElement("textarea");
    textInput.style.marginTop = "0px";
    textInput.placeholder = "Enter your bio here..."; // Placeholder text
    textInput.style.minHeight = "150px";
    textInput.style.resize = "none";
    textInput.style.width = "100%";
    textInput.value = userBio.innerHTML
      .replace(/<br>/g, "\n")
      .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, "$1"); // Set the value of the text input to the current bio with newlines
    textInput.className = "form-control"; // Bootstrap class for styling
    const space = document.createElement("br"); // Line break for better formatting
    textInput.addEventListener("input", function () {
      const characterCount = document.getElementById("character-count");
      characterCount.textContent = `${textInput.value.length}/500`; // Update character count
    });

    // Append the input to the description box
    descriptionBox.appendChild(space);
    descriptionBox.appendChild(textInput);
    savebio_button.addEventListener("click", async function () {
      try {
        savebio_button.innerHTML =
          '<span class="loading-icon" id="followers-loading"><span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span></span>';
        savebio_button.disabled = true;
        const characterCount = document.getElementById("character-count");
        characterCount.textContent = "";

        const description = textInput.value;
        if (description.length > 500) {
          AlertToast("Bio cannot exceed 500 characters. Please try again.");
          return;
        }
        console.log("Updating bio:", description);
        const user = getCookie("token");
        const body = JSON.stringify({ user, description });
        console.log("body:", body);
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/description/update`,
          {
            method: "POST", // Specify the method, e.g., POST
            headers: {
              "Content-Type": "application/json", // Set content type to JSON
            },
            body: body, // Pass the body here
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      } catch (error) {
        console.error("Error:", error);
        userBio.style.display = "block";
        textInput.remove();
        space.remove();
        alert("Failed to update bio. Please try again.");
        window.location.reload();
      } finally {
        userBio.style.display = "block";
        textInput.remove();
        space.remove();
        window.location.reload(); // Refresh the page to reflect the updated bio
      }
    });
    cancel_button.addEventListener("click", function () {
      window.location.reload();
    });
  });
  const description_tab = document.getElementById("description-tab");

  async function fetchUserFollowers(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const followers = await response.json();
      return followers;
    } catch (error) {
      console.error("Error fetching followers:", error);
    }
  }
  async function fetchUserFollowing(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/following/get?user=${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const following = await response.json();
      return following;
    } catch (error) {
      console.error("Error fetching following:", error);
    }
  }
  function alreadyFollowingToast(message) {
    toastControl.showToast("error", message, "Follow");
  }
  function FollowToast(message) {
    toastControl.showToast("success", message, "Follow");
  }
  function NotFollowingToast(message) {
    toastControl.showToast("error", message, "Error");
  }
  async function addFollow(userId) {
    try {
      const user = getCookie("token");
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/followers/add`,
        {
          method: "POST", // Specify the method, e.g., POST
          headers: {
            "Content-Type": "application/json", // Set content type to JSON
          },
          body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
        }
      );
      if (!response.ok) {
        if (response.status === 409) {
          alreadyFollowingToast("You are already following this user.");
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      updateUserCounts(userId); // Update user counts after adding follow
    } catch (error) {
      console.error("Error adding follow:", error);
    }
  }
  async function removeFollow(userId) {
    try {
      const user = getCookie("token");
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/followers/remove`,
        {
          method: "DELETE", // Specify the method, e.g., POST
          headers: {
            "Content-Type": "application/json", // Set content type to JSON
          },
          body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      updateUserCounts(userId); // Update user counts after removing follow
    } catch (error) {
      console.error("Error removing follow:", error);
    }
  }
  follow_button.addEventListener("click", function () {
    if (follow_button.disabled) return;
    follow_button.disabled = true;

    const user = getCookie("token");
    if (!user) {
      // User is not logged in
      NotFollowingToast("You are not logged in to perform this action.");
      follow_button.disabled = false;
      return;
    }
    if (follow_button.textContent === "Follow") {
      addFollow(userId)
        .then(() => {
          FollowToast("User followed successfully.");
          follow_button.textContent = "Unfollow";
        })
        .finally(() => {
          follow_button.disabled = false;
        });
    } else {
      removeFollow(userId)
        .then(() => {
          FollowToast("User unfollowed successfully.");
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
        `https://api.jailbreakchangelogs.xyz/users/settings?user=${loggedinuserId}`,
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
              value ? "bi-x-lg" : "bi-check-lg"
            );

            hide_followers_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            hide_followers_button.classList.add(
              "btn",
              value ? "btn-danger" : "btn-success"
            );
            hide_followers_button.innerHTML = hideFollowersIcon.outerHTML; // Update button with the icon
            break;
          case "hide_following":
            // Logic for hide_following
            const hideFollowingIcon = document.createElement("i");
            hideFollowingIcon.classList.add(
              "bi",
              value ? "bi-x-lg" : "bi-check-lg"
            ); // Set the icon based on the value

            hide_following_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            hide_following_button.classList.add(
              "btn",
              value ? "btn-danger" : "btn-success"
            ); // Update button class based on value
            hide_following_button.innerHTML = hideFollowingIcon.outerHTML; // Update button with the icon
            break;
          case "profile_public":
            // Logic for profile_public
            const profilePublicIcon = document.createElement("i");
            profilePublicIcon.classList.add(
              "bi",
              value ? "bi-check-lg" : "bi-x-lg"
            ); // Set icon based on public/private status

            profile_public_button.classList.remove("btn-danger", "btn-success"); // Clear previous button classes
            profile_public_button.classList.add(
              "btn",
              value ? "btn-success" : "btn-danger"
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
            // Logic for banner_discord
            const bannerDiscordIcon = document.createElement("i");
            const BannerInputHeader =
              document.createElement("BannerInputHeader");
            bannerDiscordIcon.classList.add(
              "bi",
              value ? "bi-x-lg" : "bi-check-lg"
            ); // Set icon based on the value
            bannerInput.style.display = value ? "block" : "none"; // Show or hide the input field based on the value
            input.value = banner;

            use_discord_banner_button.classList.remove(
              "btn-danger",
              "btn-success"
            ); // Clear previous button classes
            use_discord_banner_button.classList.add(
              "btn",
              value ? "btn-danger" : "btn-success"
            ); // Update button class based on value
            use_discord_banner_button.innerHTML = bannerDiscordIcon.outerHTML; // Update button with the icon
            break;

          default:
            break;
        }
      }
    } catch (error) {
      console.error("Error loading profile settings:", error);
    }
  }

  profile_public_button.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission or button's default behavior
    const profilePublicIcon = profile_public_button.querySelector("i");

    // Toggle the icon class
    if (profilePublicIcon.classList.contains("bi-x-lg")) {
      profile_public_button.classList.remove("btn-danger");
      profilePublicIcon.classList.remove("bi-x-lg");
      profile_public_button.classList.add("btn-success");
      profilePublicIcon.classList.add("bi-check-lg");
    } else {
      profilePublicIcon.classList.remove("bi-check-lg");
      profile_public_button.classList.remove("btn-success");
      profile_public_button.classList.add("btn-danger");
      profilePublicIcon.classList.add("bi-x-lg");
    }
  });
  use_discord_banner_button.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission or button's default behavior
    const bannerDiscordIcon = use_discord_banner_button.querySelector("i");

    // Toggle the icon class
    if (bannerDiscordIcon.classList.contains("bi-check-lg")) {
      bannerInput.style.display = "block";
      use_discord_banner_button.classList.remove("btn-success");
      bannerDiscordIcon.classList.remove("bi-check-lg");
      use_discord_banner_button.classList.add("btn-danger");
      bannerDiscordIcon.classList.add("bi-x-lg");
    } else {
      bannerInput.style.display = "none";
      bannerInput.value = "";
      bannerDiscordIcon.classList.remove("bi-x-lg");
      use_discord_banner_button.classList.remove("btn-danger");
      use_discord_banner_button.classList.add("btn-success");
      bannerDiscordIcon.classList.add("bi-check-lg");
    }
  });

  hide_followers_button.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission or button's default behavior
    const hideFollowersIcon = hide_followers_button.querySelector("i");

    // Toggle the icon class
    if (hideFollowersIcon.classList.contains("bi-check-lg")) {
      hide_followers_button.classList.remove("btn-success");
      hideFollowersIcon.classList.remove("bi-check-lg");
      hide_followers_button.classList.add("btn-danger");
      hideFollowersIcon.classList.add("bi-x-lg");
    } else {
      hideFollowersIcon.classList.remove("bi-x-lg");
      hide_followers_button.classList.remove("btn-danger");
      hide_followers_button.classList.add("btn-success");
      hideFollowersIcon.classList.add("bi-check-lg");
    }
  });
  hide_following_button.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission or button's default behavior
    const hideFollowingIcon = hide_following_button.querySelector("i");

    // Toggle the icon class
    if (hideFollowingIcon.classList.contains("bi-check-lg")) {
      hide_following_button.classList.remove("btn-success");
      hideFollowingIcon.classList.remove("bi-check-lg");
      hide_following_button.classList.add("btn-danger");
      hideFollowingIcon.classList.add("bi-x-lg");
    } else {
      hideFollowingIcon.classList.remove("bi-x-lg");
      hide_following_button.classList.remove("btn-danger");
      hide_following_button.classList.add("btn-success");
      hideFollowingIcon.classList.add("bi-check-lg");
    }
  });
  show_comments_button.addEventListener("click", function (event) {
    event.preventDefault(); // Prevent form submission or button's default behavior
    const recentCommentsIcon = show_comments_button.querySelector("i");

    // Toggle the icon class
    if (recentCommentsIcon.classList.contains("bi-x-lg")) {
      show_comments_button.classList.remove("btn-danger");
      recentCommentsIcon.classList.remove("bi-x-lg");
      show_comments_button.classList.add("btn-success");
      recentCommentsIcon.classList.add("bi-check-lg");
    } else {
      recentCommentsIcon.classList.remove("bi-check-lg");
      show_comments_button.classList.remove("btn-success");
      show_comments_button.classList.add("btn-danger");
      recentCommentsIcon.classList.add("bi-x-lg");
    }
  });
  async function validateImageURL(url) {
    try {
      const proxyUrl = `https://proxy.wyzie.ru/${url}`;
      // Make the fetch request to the proxy with 'HEAD' method
      const response = await fetch(proxyUrl, {
        method: "GET",
        headers: {
          Origin: "", // This may be optional, depending on your proxy configuration
        },
      });

      if (response.ok) {
        return url; // The URL is valid
      } else {
        return "None"; // The URL is invalid
      }
    } catch (error) {
      console.log("Error fetching the URL:", error);
      return "None"; // Error or invalid URL
    }
  }

  const save_settings_button = document.getElementById("settings-submit");
  const save_settings_loading = document.getElementById("settings-loading");
  save_settings_button.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent form submission
    save_settings_loading.style.display = "block";
    save_settings_button.disabled = true;

    // Assemble the request body with boolean values
    const settingsBody = {
      profile_public: profile_public_button
        .querySelector("i")
        .classList.contains("bi-check-lg"), // true or false
      hide_followers: !hide_followers_button
        .querySelector("i")
        .classList.contains("bi-check-lg"), // true or false
      hide_following: !hide_following_button
        .querySelector("i")
        .classList.contains("bi-check-lg"), // true or false
      show_recent_comments: show_comments_button
        .querySelector("i")
        .classList.contains("bi-check-lg"), // true or false
      banner_discord: !use_discord_banner_button
        .querySelector("i")
        .classList.contains("bi-check-lg"), // true or false
    };

    const token = getCookie("token");

    // Send the request to the server
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/settings/update?user=${token}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(settingsBody),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      let image = String(input.value);
      let validImage;
      if (image) {
        validImage = await validateImageURL(image);
      }

      if (validImage !== "None") {
        image = validImage;
      } else {
        const discord_banner_button = use_discord_banner_button
          .querySelector("i")
          .classList.contains("bi-check-lg");
        if (discord_banner_button) {
          image = "NONE";
        } else {
          image = "INVALID";
          AlertToast("Invalid image URL. Please enter a valid image URL.");
        }
      }

      if (image === "INVALID") {
        return; // Exit if the image is invalid
      }

      const url = `https://api.jailbreakchangelogs.xyz/users/background/update?user=${token}&image=${image}`;

      const backgroundResponse = await fetch(url, {
        method: "POST",
      });

      if (!backgroundResponse.ok) {
        throw new Error(`HTTP error! status: ${backgroundResponse.status}`);
      }

      const backgroundData = await backgroundResponse.json();
      save_settings_loading.style.display = "none";
      save_settings_button.disabled = false;
      settings_modal.style.display = "none";
      SuccessToast("Settings saved successfully!");
      window.location.reload(); // Refresh the page to reflect the new settings
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  });

  const close_settings_button = document.getElementById("close-settings");
  const settings_modal = document.getElementById("settingsModal");
  close_settings_button.addEventListener("click", function () {
    settings_modal.style.display = "none";
  });
});
