document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
  
    const displayUsers = (users) => {
        const searchTerm = searchInput.value.trim();
        if (users.length === 1) {
             return window.location.href = `/users/${users[0].id}`;
        }
        const exact_match = users.filter(user => user.username === searchTerm.toLowerCase());
        if (exact_match.length > 0) {
            return window.location.href = `/users/${exact_match[0].id}`;
        }
        const usersGrid = document.getElementById('usersGrid');
        usersGrid.style.display = 'block';
        usersGrid.innerHTML = ''; // Clear previous results
        let loadingSpinner = document.getElementById('loading-spinner');
        loadingSpinner.style.display = 'none';
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
    usersGrid.style.display = 'none';
      const searchTerm = searchInput.value.trim();
      let loadingSpinner = document.getElementById('loading-spinner');
      if (!loadingSpinner) {
          
          loadingSpinner = document.createElement('div');
          loadingSpinner.id = 'loading-spinner';
          loadingSpinner.className = 'loading-spinner';
          loadingSpinner.style.display = 'flex'; // Set to flex for centering
          loadingSpinner.innerHTML = `
              <div class="spinner-border" role="status">
                  <span class="visually-hidden">Loading...</span>
              </div>
          `;
          document.body.appendChild(loadingSpinner); // Append spinner to the body or desired parent
      }      const user_results = document.getElementById('user-results');
      if (searchTerm) {
        user_results.style.display = 'block';
        loadingSpinner.style.display = 'block';
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