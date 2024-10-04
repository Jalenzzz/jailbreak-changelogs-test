

document.addEventListener('DOMContentLoaded', function() {
    async function fetchUserBio(userId) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/description/get?user=${userId}`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    userBio.textContent = "User does not have a description.";
                } else {
                    userBio.textContent = "Error fetching description.";
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return; // Return early if an error occurred
            }
            
            const user = await response.json();
            const description = user.description || "No description available."; // Fallback message
    
            // Regular expression to match URLs starting with "https://"
            const urlRegex = /https:\/\/[^\s]+/g;
            let resultHtml = "";
            let lastIndex = 0;
            
            // Split the description by newlines
            const lines = description.split('\n');
    
            lines.forEach(line => {
                const matches = line.match(urlRegex);
                if (matches) {
                    // Iterate through the matches to build the result
                    matches.forEach((url) => {
                        // Find the start index of the current URL
                        const urlIndex = line.indexOf(url);
                        // Extract text before the current URL
                        const textBeforeLink = line.slice(0, urlIndex).trim();
                        
                        // Add the text before the URL to the result
                        if (textBeforeLink) {
                            resultHtml += `${textBeforeLink} `;
                        }
                        
                        // Add the link element
                        resultHtml += `<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a> `;
                        
                        // Remove the processed part of the line for the next loop
                        line = line.slice(urlIndex + url.length);
                    });
                }
                // Add any remaining text after the last URL
                if (line.trim()) {
                    resultHtml += line.trim(); // Add the remaining text from the line
                }
                resultHtml += '<br>'; // Add a line break after each line
            });
    
            resultHtml = resultHtml.replace(/(<br\s*\/?>\s*){2,}$/, '<br>');

            // Set the user bio with the cleaned-up result
            userBio.innerHTML = resultHtml.trim();
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
    async function fetchSeasonRewards(season) {
        try {
            const response = await fetch(`https://api.jailbreakchangelogs.xyz/rewards/get?season=${season}`);
            if (!response.ok) {
                if (response.status === 404) {
                    return "No rewards found for this season.";
                }
                else {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
            }
            const rewards = await response.json();
            return rewards
        } catch (error) {
            console.error('Error:', error);
            return 'Error fetching season rewards.';
        }
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
            if (!totalComments) {
                recentComments.innerHTML = "<div>No recent comments.</div>"; // No comments found
                return;
            }
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
                let url; // Placeholder URL for season rewards
                if (comment.item_type === "season") {
                    let rewards = await fetchSeasonRewards(comment.item_id); // Await the fetchSeasonRewards
                    if (!Array.isArray(rewards)) {
                        if (typeof rewards === 'object' && rewards !== null) {
                            rewards = Object.values(rewards); // Convert object properties to an array
                        } else {
                            rewards = []; // Initialize as empty array if rewards is null or undefined
                        }
                    }
                    
            
                    const level10Reward = rewards.find(reward => reward.requirement === "Level 10");
                    url = level10Reward.link
                }

                const image_url = item.image_url || url; // Placeholder image URL
                commentElement.className = 'list-group-item';
                commentElement.innerHTML = `
<div style="display: flex; align-items: center; justify-content: space-between;">
    <div style="flex-grow: 1;">
        <strong>${capitalizeFirstLetter(comment.item_type)} ${comment.item_id} | ${item.title}</strong>
        <div class="text-muted">${formattedDate}</div>
        <p>${comment.content}</p>
    </div>
    <a href="/${comment.item_type}s/${comment.item_id}" class="btn btn-outline-primary me-2" id="message-button">
        View ${capitalizeFirstLetter(comment.item_type)}
    </a>
    <img src="${image_url}" alt="Comment Image" style="width: 15%; height: auto; margin-left: 10px;"/> <!-- Small image -->
</div>
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
            let followersLoading = document.getElementById('followers-loading');
            if (!followersLoading) {
              followersLoading = document.createElement('span');
              followersLoading.className = 'loading-icon';
              followersLoading.id = 'followers-loading';
              followersLoading.innerHTML = '<i class="bi bi-hourglass-split"></i>'; // Replace with your loading icon
              document.getElementById('followers').prepend(followersLoading);
            }
        
            let followingLoading = document.getElementById('following-loading');
            if (!followingLoading) {
              followingLoading = document.createElement('span');
              followingLoading.className = 'loading-icon';
              followingLoading.id = 'following-loading';
              followingLoading.innerHTML = '<i class="bi bi-hourglass-split"></i>'; // Replace with your loading icon
              document.getElementById('following').prepend(followingLoading);
            }
            console.log(userId)
            if (userId === "659865209741246514" || userId === "1019539798383398946") {
                
                const crown = document.getElementById('crown');
                crown.style.display = 'inline-block';
            }
        
            // Show loading icons
            followersLoading.style.display = 'inline';
            followingLoading.style.display = 'inline';
          // Await the fetching of user following and followers
          const followingArray = await fetchUserFollowing(userId); 
          const followersArray = await fetchUserFollowers(userId); 
      
          const isFollowing = followersArray.some(follower => follower.follower_id === loggedinuserId);
          follow_button.textContent = isFollowing? "Unfollow" : "Follow";
      
          // Check if they are valid arrays
          const followingCount = Array.isArray(followingArray) ? followingArray.length : 0; 
          const followersCount = Array.isArray(followersArray) ? followersArray.length : 0; 
      
          // Update the DOM elements with the counts
          const following = document.getElementById('following');
          const followers = document.getElementById('followers');
      
          following.textContent = followingCount + " Following"  ;
          followers.textContent = followersCount + " Followers";
      
          // Hide loading icons
      
        } catch (error) {
          console.error('Error updating user counts:', error);
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
        // Create a text input
        const textInput = document.createElement('textarea');
        textInput.style.marginTop = '20px';
        textInput.placeholder = 'Enter your bio here...'; // Placeholder text
        textInput.style.minHeight = '150px';
        textInput.value = userBio.innerHTML
        .replace(/<br>/g, '\n')
        .replace(/<a href="([^"]+)"[^>]*>([^<]+)<\/a>/g, '$1') // Set the value of the text input to the current bio with newlines
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
                });
    
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
    
                // Update user bio display
                userBio.style.display = 'block';
                textInput.remove();
                space.remove();
                fetchUserBio(userId); // Fetch updated bio and convert newlines to <br>
            } catch (error) {
                console.error('Error:', error);
                userBio.style.display = 'block';
                textInput.remove();
                space.remove();
                fetchUserBio(userId);
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
            follow_button.textContent = 'Unfollow';
        } else {
            removeFollow(userId);
            FollowToast("User unfollowed successfully.");
            follow_button.textContent = 'Follow';
        }
    });
    function AlertToast(message) {
        toastr.info(message, "Alert", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }
      function SuccessToast(message) {
        toastr.success(message, "Alert", {
          positionClass: "toast-bottom-right", // Position at the bottom right
          timeOut: 3000, // Toast will disappear after 3 seconds
          closeButton: true, // Add a close button
          progressBar: true, // Show a progress bar
        });
      }

      crown.addEventListener('click', function() {
        fetch(`https://api.jailbreakchangelogs.xyz/owner/check?user=${userId}`, {
            method: 'GET', // Specify the method, e.g., GET
            headers: {
                'Content-Type': 'application/json', // Set content type to JSON
            }
        })
        .then(response => {
            console.log(response.status); // Log the response status
    
            if (response.status === 200) {
                AlertToast("This user created Jailbreak Changelogs!");
            } else {
                SuccessToast('The only owners of Jailbreak Changelogs are <a href="/users/659865209741246514" target="_blank" rel="noopener noreferrer">@Jakobiis</a> and <a href="/users/1019539798383398946" target="_blank" rel="noopener noreferrer">@Jalenzz</a>');
                AlertToast("This crown is given out to the creators of Jailbreak Changelogs! Unfortunately, this user is not one of them 🤣");
            }
        })
        .catch(error => {
            console.error('Error fetching owner status:', error);
            AlertToast("There was an error checking the owner's status.");
        });
    });
    
});