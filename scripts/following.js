document.addEventListener("DOMContentLoaded", async () => {
    const usersGrid = document.getElementById("usersGrid");
    const path = window.location.pathname;
    const segments = path.split('/');
    const userId = segments[2]; // Assuming the structure is "/users/{userId}/followers"

    // Async function to fetch followers
    async function fetchFollowers(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/following/get?user=${userId}`);
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
    const followers = await fetchFollowers(userId);
    console.log(followers);
    
    // Optionally, you can populate the usersGrid with the fetched followers here
    if (followers.length > 0) {
        followers.forEach(follower => {
            const response = fetch(`https://api.jailbreakchangelogs.xyz/users/get?id=${follower.followed_id}`);
            response.then(response => response.json())
             .then(user => {
                console.log(user);
                const userCard = document.createElement('div');
                userCard.className = 'user-card';
                
                userCard.innerHTML = `
                <div style="position: relative; padding: 10px;">
                  <img src="https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.png" class="user-avatar" alt="${user.username}">
                  <h3 class="user-name">${user.global_name}</h3>
                  <p class="user-username">@${user.username}</p>
                  <a href="/users/${user.id}" class="btn btn-primary" style="position: absolute; top: 5px; right: 5px;">View Profile</a>
                </div>
              `;
          
                usersGrid.appendChild(userCard);
             })
        });
          } else {
        usersGrid.textContent = "This user isnt following anyone"; // Message when there are no followers
    }
});
