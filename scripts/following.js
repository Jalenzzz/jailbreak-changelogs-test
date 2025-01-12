document.addEventListener("DOMContentLoaded", async () => {
  const usersGrid = document.getElementById("usersGrid");
  const followingCountElement = document.getElementById("followingCount");

  if (!usersGrid) {
    console.error("Could not find usersGrid element");
    return;
  }

  // Get logged in user from session storage
  const loggedInUserId = sessionStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const showFollowing = JSON.parse(showingfollowing);
  const userId = segments[2];

  if (!document.getElementById("usersGrid")) {
    return; // Exit if the grid doesn't exist (means we're showing the private message)
  }

  const fetchAvatar = async (userId, avatarHash, format) => {
    const url = `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.${format}`;
    const response = await fetch(url, { method: "HEAD" });
    return response.ok ? url : null;
  };

  // Add getAvatarUrl helper function
  const getAvatarUrl = async (user) => {
    if (!user.avatar) {
      return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
    }

    try {
      // Try GIF first
      const gifUrl = await fetchAvatar(user.id, user.avatar, "gif");
      if (gifUrl) {
        return gifUrl;
      }
      // Fallback to PNG if GIF doesn't exist
      const pngUrl = await fetchAvatar(user.id, user.avatar, "png");
      if (pngUrl) {
        return pngUrl;
      }
    } catch (error) {
      console.error("Error fetching avatar:", error);
    }

    // Fallback to default avatar if everything fails
    return `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${user.username}&bold=true&format=svg`;
  };

  // Always update page headings based on URL path rather than logged in status
  const titleElement = document.querySelector("h2");
  const subtitleElement = document.querySelector("h4");

  if (titleElement && loggedInUserId === userId) {
    titleElement.textContent = "My following";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Friends" : "Friends";
  }

  // Async function to fetch followers
  async function fetchFollowers(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/following/get?user=${userId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching followers:", error);
      return []; // Return an empty array in case of an error
    }
  }

  // Fetch followers and log the results
  if (!showFollowing) {
    usersGrid.textContent = "This user has their following hidden.";
    if (followingCountElement) {
      followingCountElement.textContent = "(0)";
    }
    return;
  }

  const followers = await fetchFollowers(userId);

  // Update the count immediately when we get the data
  if (followingCountElement) {
    const count = Array.isArray(followers) ? followers.length : 0;
    followingCountElement.textContent = `(${count})`;

    // Update subtitle with count
    if (subtitleElement) {
      subtitleElement.textContent =
        loggedInUserId === userId
          ? `My Friends (${count})`
          : `Friends (${count})`;
    }
  } else {
    console.error("Could not find followingCount element");
  }

  if (followers.length > 0) {
    for (const follower of followers) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${follower.following_id}`
        );

        // Handle banned user case
        if (response.status === 403) {
          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3";

          userCard.innerHTML = `
                    <div class="card user-card border-0 shadow-sm">
                        <div class="card-body position-relative p-3">
                            <div class="d-flex align-items-center">
                                <div class="me-4">
                                    <img src="https://ui-avatars.com/api/?background=144a61&color=fff&size=128&rounded=true&name=?&bold=true&format=svg" 
                                         class="user-avatar rounded-circle" 
                                         width="60"
                                         height="60"
                                         style="border: 4px solid #495057;"
                                    >
                                </div>
                                <div class="flex-grow-1">
                                    <div class="text-decoration-none">
                                        <h5 class="user-name card-title mb-2 text-danger">Account Suspended</h5>
                                    </div>
                                    <p class="user-username card-text text-muted mb-0">This user has been banned</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

          usersGrid.appendChild(userCard);
          continue;
        }
      } catch (error) {
        console.error("Error processing following:", error);
      }
    }
  } else {
    usersGrid.textContent = "";
  }
});

function handleinvalidImage(imgElement) {
  setTimeout(() => {
    const userCard = imgElement.closest(".user-card");
    const username = userCard
      .querySelector(".user-username")
      .textContent.substring(1); // Remove @ symbol
    imgElement.src = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${username}&bold=true&format=svg`;
  }, 0);
}
