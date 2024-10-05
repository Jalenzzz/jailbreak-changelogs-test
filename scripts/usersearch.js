document.addEventListener("DOMContentLoaded", function () {
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  const displayUsers = (users) => {
    const searchTerm = searchInput.value.trim();
    const usersGrid = document.getElementById("usersGrid");
    const loadingSpinner = document.getElementById("loading-spinner");

    loadingSpinner.style.display = "none";
    usersGrid.style.display = "block";
    usersGrid.innerHTML = ""; // Clear previous results

    if (users.length === 0) {
      // Display "No results found :(" message
      const noResultsMessage = document.createElement("div");
      noResultsMessage.className = "no-results-message";
      noResultsMessage.textContent = "No results found :(";
      usersGrid.appendChild(noResultsMessage);
      return;
    }

    if (users.length === 1) {
      return (window.location.href = `/users/${users[0].id}`);
    }
    const exact_match = users.filter(
      (user) => user.username === searchTerm.toLowerCase()
    );
    if (exact_match.length > 0) {
      return (window.location.href = `/users/${exact_match[0].id}`);
    }

    users.forEach((user) => {
      const userCard = document.createElement("div");
      userCard.className = "user-card";

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
    const usersGrid = document.getElementById("usersGrid");
    usersGrid.style.display = "none";
    const searchTerm = searchInput.value.trim();
    const loadingSpinner = document.getElementById("loading-spinner");
    const userResults = document.getElementById("user-results");

    if (searchTerm) {
      userResults.style.display = "block";
      loadingSpinner.style.display = "flex"; // Changed to 'flex'
      try {
        const response = await fetch(
          `https://api.jailbreakchangelogs.xyz/users/get/name?name=${searchTerm}`
        );
        if (response.ok) {
          const data = await response.json();
          displayUsers(data);
        } else {
          if (response.status === 404) {
            displayUsers([]);
          } else {
            console.error("Error fetching users:", response.statusText);
          }
        }
      } catch (error) {
        console.error("Error:", error);
      } finally {
        loadingSpinner.style.display = "none";
      }
    } else {
      alert("Please enter a username to search.");
    }
  };

  // Event listener for search button click
  searchButton.addEventListener("click", handleSearch);

  // Event listener for Enter key press inside the input
  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  });
});
