document.addEventListener("DOMContentLoaded", async () => {
    const usersGrid = document.getElementById("usersGrid");
    const path = window.location.pathname;
    const showfollowers = JSON.parse(showingfollowers)
    console.log(showfollowers)
    const segments = path.split('/');
    const userId = segments[2]; // Assuming the structure is "/users/{userId}/followers"

    // Async function to fetch followers
    async function fetchFollowers(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/followers/get?user=${userId}`);
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
    if (!showfollowers) {
      usersGrid.textContent = "This user has their followers hidden.";
      return;
    }
    const followers = await fetchFollowers(userId);
    console.log(followers);
    
    // Optionally, you can populate the usersGrid with the fetched followers here
    if (followers.length > 0) {
        followers.forEach(follower => {
            const response = fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${follower.follower_id}`);
            response.then(response => response.json())
             .then(user => {
                console.log(user);
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                
                userCard.innerHTML = `
                <div class="card user-card border-0 shadow-sm mb-3">
                  <div class="card-body position-relative p-3">
                    <div class="row g-0 align-items-center">
                      <div class="col-auto me-3">
                        <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" 
                             class="user-avatar rounded-circle" 
                             alt="${user.username}"
                             id="avatar-${user.id}"
                             onerror="handleinvalidImage(this)"
                      </div>
                      <div class="col">
                        <h5 class="user-name card-title mb-1">${user.global_name}</h5>
                        <p class="user-username card-text text-muted mb-0">@${user.username}</p>
                      </div>
                      <div class="col-auto ms-auto">
                        <a href="/users/${user.id}" class="btn btn-primary btn-sm">View Profile</a>
                      </div>
                    </div>
                  </div>
                </div>
              `;
          
                usersGrid.appendChild(userCard);
             })
        });
          } else {
        usersGrid.textContent = "No followers found."; // Message when there are no followers
    }
});

function handleinvalidImage(imgElement) {
  console.log("Invalid image");
  console.log(imgElement.id); // This will now correctly print the id
  setTimeout(() => {
    imgElement.src = "/assets/profile-pic-placeholder.png"; // Set the placeholder after the delay
  }, 0);  // Adjust the delay time as needed (500ms in this case)
}
