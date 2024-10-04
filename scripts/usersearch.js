document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
  
    const displayUsers = (users) => {
        const usersGrid = document.getElementById('usersGrid');
        usersGrid.innerHTML = ''; // Clear previous results
    
        users.forEach(user => {
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
        });
      };
    // Function to handle search requests
    const handleSearch = async () => {
      const searchTerm = searchInput.value.trim();
      if (searchTerm) {
        try {
          const response = await fetch(`https://api.jailbreakchangelogs.xyz/users/get/name?name=${searchTerm}`);
          if (response.ok) {
            const data = await response.json();
            displayUsers(data)
            // Process the search result (e.g., display user data)
          } else {
            if (response.status === 404) {
                usersGrid.innerHTML = '';
            } 
            else {console.error("Error fetching users:", response.statusText);}
            
          }
        } catch (error) {
          console.error("Error:", error);
        }
      } else {
        alert("Please enter a username to search.");
      }
    };
  
    // Event listener for search button click
    searchButton.addEventListener('click', handleSearch);
  
    // Event listener for Enter key press inside the input
    searchInput.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        handleSearch();
      }
    });
});