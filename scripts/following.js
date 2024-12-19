document.addEventListener("DOMContentLoaded", async () => {
  const usersGrid = document.getElementById("usersGrid");
  if (!usersGrid) {
    console.error("Could not find usersGrid element");
    return;
  }

  const path = window.location.pathname;
  const segments = path.split("/");
  const showFollowing = JSON.parse(showingfollowing);
  const userId = segments[2]; // Assuming the structure is "/users/{userId}/followers"

  // Async function to fetch followers
  async function fetchFollowers(userId) {
    try {
      const response = await fetch(
        `https://api.jailbreakchangelogs.xyz/users/following/get?user=${userId}`
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
  console.log(showFollowing);
  if (!showFollowing) {
    usersGrid.textContent = "This user has their following hidden."; // Message when there are no followers
    return;
  }

  const followers = await fetchFollowers(userId);
  console.log(followers);

  // Optionally, you can populate the usersGrid with the fetched followers here
  if (followers.length > 0) {
    followers.forEach((follower) => {
      const response = fetch(
        `https://api.jailbreakchangelogs.xyz/users/get?id=${follower.followed_id}`
      );
      response
        .then((response) => response.json())
        .then((user) => {
          console.log(user);
          const userCard = document.createElement("div");
          userCard.className = "user-card mb-3"; // Add margin-bottom for spacing

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
    usersGrid.textContent = "This user isnt following anyone"; // Message when there are no followers
  }
});
function handleinvalidImage(imgElement) {
  console.log("Invalid image");
  console.log(imgElement.id); // This will now correctly print the id
  setTimeout(() => {
    imgElement.src =
      "https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=Jailbreak+Break&bold=true&format=svg"; // Set the placeholder after the delay
  }, 0); // Adjust the delay time as needed (500ms in this case)
}
