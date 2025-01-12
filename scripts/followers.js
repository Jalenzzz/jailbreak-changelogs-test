document.addEventListener("DOMContentLoaded", async () => {
  const usersGrid = document.getElementById("usersGrid");
  const followerCountElement = document.getElementById("followerCount");

  if (!usersGrid) {
    console.error("Could not find usersGrid element");
    return;
  }

  // Get logged in user from session storage
  const loggedInUserId = sessionStorage.getItem("userid");
  const path = window.location.pathname;
  const segments = path.split("/");
  const userId = segments[2];

  // Always update page headings based on URL path rather than logged in status
  const titleElement = document.querySelector("h2");
  const subtitleElement = document.querySelector("h4");

  if (titleElement && loggedInUserId === userId) {
    titleElement.textContent = "My followers";
  }

  // Keep the friends heading consistent
  if (subtitleElement) {
    subtitleElement.textContent =
      loggedInUserId === userId ? "My Friends" : "Friends";
  }

  const showfollowers = JSON.parse(showingfollowers);

  if (!document.getElementById("usersGrid")) {
    return; // Exit if the grid doesn't exist (means we're showing the private message)
  }

  async function fetchFollowers(userId) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Origin: "https://jailbreakchangelogs.xyz",
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error("Error fetching followers:", error);
      return [];
    }
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

  const followers = await fetchFollowers(userId);

  // Update the count immediately when we get the data
  if (followerCountElement) {
    const count = Array.isArray(followers) ? followers.length : 0;
    followerCountElement.textContent = `(${count})`;

    // Update subtitle with count
    if (subtitleElement) {
      subtitleElement.textContent =
        loggedInUserId === userId
          ? `My Friends (${count})`
          : `Friends (${count})`;
    }
  } else {
    console.error("Could not find followerCount element");
  }

  if (followers.length > 0) {
    for (const follower of followers) {
      try {
        const response = await fetch(
          `https://api3.jailbreakchangelogs.xyz/users/get?id=${follower.follower_id}`
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
                                    <img src="https://ui-avatars.com/api/?background=212a31&color=fff&size=128&rounded=true&name=?&bold=true&format=svg" 
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
        console.error("Error processing follower:", error);
      }
    }
  } else {
    usersGrid.textContent = "";
  }
});
