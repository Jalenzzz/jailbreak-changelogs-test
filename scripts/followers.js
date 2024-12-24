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

  async function fetchFollowers(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`
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

  if (!showfollowers) {
    usersGrid.textContent = "This user has their followers hidden.";
    if (followerCountElement) {
      followerCountElement.textContent = "(0)";
    }
    return;
  }
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
    followers.forEach((follower) => {
      const response = fetch(
        `https://api.jailbreakchangelogs.xyz/users/get?id=${follower.follower_id}`
      );
      response
        .then((response) => response.json())
        .then((user) => {
          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3"; // Added mb-3 to match following.js

          userCard.innerHTML = `
                <div class="card user-card border-0 shadow-sm">
                  <div class="card-body position-relative p-3">
                    <div class="d-flex align-items-center">
                      <div class="me-4">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
                             class="user-avatar rounded-circle" 
                             alt="${user.username}"
                             id="avatar-${user.id}"
                             onerror="handleinvalidImage(this)"
                        >
                      </div>
                      <div class="flex-grow-1">
                        <a href="/users/${user.id}" class="text-decoration-none">
                          <h5 class="user-name card-title mb-2">${user.global_name}</h5>
                        </a>
                        <p class="user-username card-text text-muted mb-0">@${user.username}</p>
                      </div>
                    </div>
                  </div>
                </div>
              `;

          usersGrid.appendChild(userCard);
        });
    });
  } else {
    usersGrid.textContent = "No followers found.";
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
