

document.addEventListener('DOMContentLoaded', function() {
    async function fetchUserBio(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/description/get?user=${userId}`);
            if (!response.ok) {
                if (response.status === 404) {
                    userBio.textContent = " ";
                }
                else {
                    userBio.textContent = "Error fetching description.";
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const user = await response.json();
            userBio.textContent = user.description;
        } catch (error) {
            console.error('Error:', error);
            userBio.textContent = 'Error fetching user bio.';
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
    async function fetchCommentItem(comment) {
        try {
            if (comment.item_type === "changelog") {
                url = `https://api.jailbreakchangelogs.xyz/changelogs/get?id=${comment.item_id}`;
            } else if (comment.item_type === "season") {
                url = `https://api.jailbreakchangelogs.xyz/seasons/get?season=${comment.item_id}`;
            }
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    return " ";
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const result = await response.json();
            return result
        } catch (error) {
            console.error('Error:', error);
            return 'Error fetching comment title.';
        }
    }
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
    }

    function renderPaginationControls(totalPages) {
        const paginationContainer = document.getElementById("paginationControls");
        paginationContainer.innerHTML = ""; // Clear existing controls
    
        // Create left arrow button
        const leftArrow = document.createElement("button");
        leftArrow.textContent = "<";
        leftArrow.classList.add("btn", "btn-outline-primary", "m-1");
        leftArrow.disabled = currentPage === 1; // Disable if on the first page
        leftArrow.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                fetchUserComments(userId); // Fetch comments for the current page
            }
        });
        paginationContainer.appendChild(leftArrow);
    
        // Page number input
        const pageInput = document.createElement("input");
        pageInput.type = "number";
        pageInput.value = currentPage;
        pageInput.min = 1;
        pageInput.max = totalPages;
        pageInput.classList.add("form-control", "mx-1");
        pageInput.style.width = "60px"; // Set width for input
        pageInput.addEventListener("change", () => {
            const newPage = parseInt(pageInput.value);
            if (newPage >= 1 && newPage <= totalPages) {
                currentPage = newPage;
                fetchUserComments(userId); // Fetch comments for the new page
            } else {
                pageInput.value = currentPage; // Reset input if invalid
            }
        });
        paginationContainer.appendChild(pageInput);
    
        // Create right arrow button
        const rightArrow = document.createElement("button");
        rightArrow.textContent = ">";
        rightArrow.classList.add("btn", "btn-outline-primary", "m-1");
        rightArrow.disabled = currentPage === totalPages; // Disable if on the last page
        rightArrow.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                fetchUserComments(userId); // Fetch comments for the current page
            }
        });
        paginationContainer.appendChild(rightArrow);
    }

    let currentPage = 1;
    const commentsPerPage = 3;
    
    async function fetchUserComments(userId) {
        const recentComments = document.getElementById('comments-list'); // Ensure this is the correct ID
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
        }
        try {
            loadingSpinner.style.display = 'flex'; // Show the loading spinner
            loadingSpinner.innerHTML = '<div class="spinner-border" role="status"><span class="visually-hidden">Loading...</span></div>'; // Optional: Add spinner HTML if not in place
    
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/comments/get/user?author=${userId}`);
    
            if (!response.ok) {
                if (response.status === 404) {
                    recentComments.innerHTML = "<div>No recent comments.</div>"; // Use innerHTML for the list
                } else {
                    recentComments.innerHTML = "<div>Error fetching comments.</div>"; // Update the message for other errors
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return; // Exit the function if there is an error
            }
    
            const comments = await response.json(); // Assuming the API returns a JSON array of comments
            const totalComments = comments.length; // Get the total number of comments
            const totalPages = Math.ceil(totalComments / commentsPerPage); // Calculate total pages
    
            // Clear existing comments
            
            renderPaginationControls(totalPages); // Render pagination controls
    
            // Slice the comments array for the current page
            const startIndex = (currentPage - 1) * commentsPerPage;
            const paginatedComments = comments.slice(startIndex, startIndex + commentsPerPage);
    
            // Check if comments are available
            if (paginatedComments.length === 0) {
                recentComments.innerHTML = "<div>No comments found.</div>"; // Message if no comments
                return;
            }
            const comments_to_add = []; // Array to store elements to add to the DOM
    
            // Iterate over paginated comments and create elements to display
            for (const comment of paginatedComments) { // Use for...of to allow await
                const item = await fetchCommentItem(comment); // Await the fetchCommentItem
                const formattedDate = formatDate(comment.date);
                const commentElement = document.createElement('div');
                commentElement.className = 'list-group-item';
                commentElement.innerHTML = `
                    <strong>${comment.item_type.toUpperCase()} ${comment.item_id} | ${item.title}</strong>
                    <div class="text-muted">${formattedDate}</div>
                    <p>${comment.content}</p>
                `;
                comments_to_add.push(commentElement); // Add the new comment to the array
            }
            // Add all comments to the DOM
            recentComments.innerHTML = ""; 
            recentComments.append(...comments_to_add); // Use spread operator to add multiple elements at once
    
        } catch (error) {
            console.error('Error fetching comments:', error);
            recentComments.innerHTML = "<div>Internal Server Error.</div>"; // Display error message
        } finally {
            loadingSpinner.style.display = 'none'; // Hide the loading spinner after the fetch operation
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
      const follow_button = document.getElementById('follow-button');
      async function updateUserCounts(userId) {
        try {
      
          // Await the fetching of user following and followers
          const followingArray = await fetchUserFollowing(userId); 
          const followersArray = await fetchUserFollowers(userId); 
      
          console.log("Following Array:", followingArray); // Log the following array
          console.log("Followers Array:", followersArray); // Log the followers array
          console.log("Logged In User ID:", loggedinuserId);
          const isFollowing = followersArray.some(follower => follower.follower_id === loggedinuserId);          console.log("Is Following:", isFollowing);
          if (isFollowing) {
            follow_button.textContent = "Unfollow";
          } 
          const followingCount = Array.isArray(followingArray) ? followingArray.length : 0; 
          const followersCount = Array.isArray(followersArray) ? followersArray.length : 0; 
      
          // Update the DOM elements with the counts
          const following = document.getElementById('following');
          const followers = document.getElementById('followers');
          following.textContent = followingCount.toString() + " Following";
          followers.textContent = followersCount.toString() + " Followers";

        } catch (error) {
          console.error('Error fetching user counts:', error);
        }
      }




    const settings_button = document.getElementById('settings-button');
    const editbio_button = document.getElementById('edit-bio-button');
    const message_button = document.getElementById('message-button');
    const about_button = document.getElementById('about-button');
    const recent_comments_button = document.getElementById('recent-comments-button');
    const pathSegments = window.location.pathname.split("/");
    const userId = pathSegments[pathSegments.length - 1];
    const loggedinuserId = sessionStorage.getItem('userid');
    if (loggedinuserId === userId) {
        message_button.style.display = 'none';
        follow_button.style.display = 'none';
        settings_button.style.display = 'inline-block';
        editbio_button.style.display = 'inline-block';
    }
    const userBio = document.getElementById('userBio');
    fetchUserBio(userId)
    const savebio_button = document.getElementById('save-bio-button');
    updateUserCounts(userId);
    editbio_button.addEventListener('click', function() {
        editbio_button.style.display = 'none';
        savebio_button.style.display = 'inline-block';
        const descriptionBox = document.getElementById('description-box');
        // Clear previous content
        userBio.style.display = 'none';
        const icon = editbio_button.querySelector('i'); // Get the icon element
        icon.className = 'bi bi-save'; // Change to save icon
        // Create a text input
        const textInput = document.createElement('textarea');
        textInput.type = 'text';
        textInput.style.marginTop = '20px';
        textInput.placeholder = 'Enter your bio here...'; // Placeholder text
        textInput.className = 'form-control'; // Bootstrap class for styling
        const space = document.createElement('br'); // Line break for better formatting
        
        // Append the input to the description box
        descriptionBox.appendChild(space);
        descriptionBox.appendChild(textInput);
        savebio_button.addEventListener('click', async function() {
            try {
                savebio_button.style.display = 'none';
                editbio_button.style.display = 'inline-block';
                
                const description = textInput.value;
                const user = getCookie('token');
                const body = JSON.stringify({ user, description });
                const response = await fetch(`https://api.jailbreakchangelogs.xyz/description/update`, {
                    method: 'POST', // Specify the method, e.g., POST
                    headers: {
                        'Content-Type': 'application/json', // Set content type to JSON
                    },
                    body: body, // Pass the body here
                });                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                userBio.style.display = 'block';
                textInput.remove();
                space.remove();
                fetchUserBio(userId); // Fetch updated bio
            } catch (error) {
                console.error('Error:', error);
                icon.className = 'bi bi-exclamation-triangle-fill'; // Change to exclamation triangle icon
            }
        });
    });
    const description_tab = document.getElementById('description-tab');
    const recent_comments_tab = document.getElementById('recent-comments-tab');
    recent_comments_button.addEventListener('click', function () {
        // Remove 'active' class from About button and reset aria-selected
        about_button.classList.remove('active');
        about_button.setAttribute('aria-selected', 'false');
        description_tab.style.display = 'none';
        recent_comments_tab.style.display = 'block'; // Show recent comments tab
        fetchUserComments(userId); // Fetch recent comments

        // Add 'active' class to Recent Comments button and update aria-selected
        recent_comments_button.classList.add('active');
        recent_comments_button.setAttribute('aria-selected', 'true');

        // Optional: Any additional functionality you want to perform when this button is clicked
    });
    about_button.addEventListener('click', function () {
        // Remove 'active' class from Recent Comments button and reset aria-selected
        recent_comments_button.classList.remove('active');
        recent_comments_button.setAttribute('aria-selected', 'false');
        recent_comments_tab.style.display = 'none'; // Reset recent comments tab
        description_tab.style.display = 'block'; // Show description tab

        // Add 'active' class to About button and update aria-selected
        about_button.classList.add('active');
        about_button.setAttribute('aria-selected', 'true');

        // Optional: Any additional functionality you want to perform when this button is clicked
    });
    async function fetchUserFollowers(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/followers/get?user=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const followers = await response.json();
            return followers;
        } catch (error) {
            console.error('Error fetching followers:', error);
        }
    }
    async function fetchUserFollowing(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/following/get?user=${userId}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const following = await response.json();
            return following;
        } catch (error) {
            console.error('Error fetching following:', error);
        }
    }
    function alreadyFollowingToast(message) {
        toastr.error(message, "Follow", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
    function FollowToast(message) {
        toastr.success(message, "Follow", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
    async function addFollow(userId) {
        try {
            const user = getCookie('token');
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/followers/add`, {
                method: 'POST', // Specify the method, e.g., POST
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
            });
            if (!response.ok) {
                if (response.status === 409) {
                    alreadyFollowingToast('You are already following this user.');
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            updateUserCounts(userId); // Update user counts after adding follow
        } catch (error) {
            console.error('Error adding follow:', error);
        }
    }
    async function removeFollow(userId) {
        try {
            const user = getCookie('token');
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/followers/remove`, {
                method: 'DELETE', // Specify the method, e.g., POST
                headers: {
                    'Content-Type': 'application/json', // Set content type to JSON
                },
                body: JSON.stringify({ follower: user, following: userId }), // Pass the body here
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            updateUserCounts(userId); // Update user counts after removing follow
        } catch (error) {
            console.error('Error removing follow:', error);
        }
    }
    follow_button.addEventListener('click', function() {
        if (follow_button.textContent === 'Follow') {
            addFollow(userId);
            FollowToast("User followed successfully.");
            follow_button.textContent = 'Following';
        } else {
            removeFollow(userId);
            FollowToast("User unfollowed successfully.");
            follow_button.textContent = 'Follow';
        }
    });
    
});