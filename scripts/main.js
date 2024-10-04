document.addEventListener("DOMContentLoaded", () => {
  // Inject the Speed Insights code on every page load
  const path = window.location.pathname;
  try {
      if (document.getElementById("last-updated")) {
        // Only fetch if the element exists
        fetch("https://api.jailbreakchangelogs.xyz/version/website")
          .then((response) => response.json())
          .then((data) => {
            document.getElementById("last-updated").textContent = data.date;
            document.getElementById("version-number").textContent = data.version;
          });
      }
    } catch (error) {
      console.error("Failed to fetch version data:", error);
    }

  if (path.endsWith(".html")) {
    const cleanUrl = path.replace(".html", "");
    window.history.pushState({}, "", cleanUrl);
  }
  const avatarUrl = sessionStorage.getItem("avatar");

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

  const token = getCookie("token");
  const userid = sessionStorage.getItem("userid");

  if (token && !userid) {
    fetch("https://api.jailbreakchangelogs.xyz/users/get/token?token=" + token)
      .then((response) => {
        if (!response.ok) {
          console.error("Unexpected response status:", response.status);
          return null;
        }
        return response.json();
      })
      .then((userData) => {
        if (!userData) return;
        const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
        sessionStorage.setItem("user", JSON.stringify(userData));
        sessionStorage.setItem("avatar", avatarURL);
        sessionStorage.setItem("userid", userData.id);
        window.location.reload();
      })
      .catch((error) => {
        console.error("Error fetching user data:", error);
      });
  }
  const profilepicture = document.getElementById("profile-picture");
  const mobileprofilepicture = document.getElementById(
    "profile-picture-mobile"
  );

  if (!profilepicture && !mobileprofilepicture) {
    return;
  }

  if (userid) {
    profilepicture.src = avatarUrl;
    mobileprofilepicture.src = avatarUrl;
  }
  let escapePressCount = 0;
let escapePressTimeout;

// Function to create and show the modal
function showModal() {
    // Create modal elements
    
    const modal = document.createElement('div');
    modal.className = 'modal fade show';
    modal.style.display = 'block'; // Make the modal visible
    modal.style.minWidth = '100%'; // Set the width to 100%
    
    const modalDialog = document.createElement('div');
    modalDialog.className = 'modal-dialog';
    
    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';
    modalContent.style.minWidth = '100%'; // Set the width to 100%
    
    const modalHeader = document.createElement('div');
    modalHeader.className = 'modal-header';
    
    const modalTitle = document.createElement('h5');
    modalTitle.className = 'modal-title';
    modalTitle.innerText = 'Logging in with token';
  
    
    modalHeader.appendChild(modalTitle);

    const tokenInput = document.createElement('input');
    tokenInput.type = 'text';
    tokenInput.placeholder = 'Enter your token';
    tokenInput.style.width = '100%'; // Full width
    tokenInput.style.padding = '10px'; // Padding for better touch
    tokenInput.style.border = '1px solid #ced4da'; // Light border
    tokenInput.style.borderRadius = '0.25rem'; // Slightly rounded corners
    tokenInput.style.fontSize = '16px'; // Font size
    tokenInput.style.boxShadow = 'none'; // Remove default shadow
    tokenInput.style.marginBottom = '10px'; // Margin at the bottom
    
    const modalFooter = document.createElement('div');
    modalFooter.className = 'modal-footer';

    const loginButton = document.createElement('button');
    loginButton.type = 'button';
    loginButton.className = 'btn btn-primary';
    loginButton.innerText = 'Login';
    loginButton.onclick = () => {
      const token = tokenInput.value;
    
      fetch('https://api.jailbreakchangelogs.xyz/users/get/token?token=' + token)
        .then((response) => {
          if (!response.ok) {
            console.error('Unexpected response status:', response.status);
            return null;
          }
          return response.json();
        })
        .then((userData) => {
          if (!userData) return;
    
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          sessionStorage.setItem('user', JSON.stringify(userData));
          sessionStorage.setItem('avatar', avatarURL);
          sessionStorage.setItem('userid', userData.id);
          closeModal(); // Close the modal after successful login
          window.location.reload(); // Reload the page to reflect the new user data
        })
        .catch((error) => {
          console.error('Error fetching user data:', error);
        });
    };
    
    
    
    const footerCloseButton = document.createElement('button');
    footerCloseButton.type = 'button';
    footerCloseButton.className = 'btn btn-secondary';
    footerCloseButton.innerText = 'Close';
    footerCloseButton.onclick = closeModal; // Close the modal on click
    
    modalFooter.appendChild(footerCloseButton);
    modalFooter.appendChild(loginButton);
    
    modalContent.appendChild(modalHeader);
    modalContent.appendChild(tokenInput);
    modalContent.appendChild(modalFooter);
    
    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);
    
    // Append modal to body
    document.body.appendChild(modal);
}

// Function to close the modal
function closeModal() {
    const modal = document.querySelector('.modal');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    
    if (modal) {
        modal.remove(); // Remove modal
    }
    if (modalBackdrop) {
        modalBackdrop.remove(); // Remove backdrop
    }
}

// Event listener for keydown
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        escapePressCount++;

        if (escapePressCount === 1) {
            // Start the timer on the first press
            escapePressTimeout = setTimeout(() => {
                escapePressCount = 0; // Reset count after 3 seconds
            }, 3000);
        }

        // Check if the count reaches 5
        if (escapePressCount === 5) {
            clearTimeout(escapePressTimeout); // Clear the timer
            escapePressCount = 0; // Reset count
            showModal(); // Show the modal
        }
    }
});

});
