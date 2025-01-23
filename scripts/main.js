document.addEventListener("DOMContentLoaded", function () {
  const navbarToggler = document.getElementById("navbarToggler");
  const sideMenu = document.getElementById("sideMenu");
  const mobileViewUpdates = document.getElementById("mobileViewUpdates");

  window.checkAndSetAvatar = async function (userData) {
    const gifUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.gif?size=128`;
    const webpUrl = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.webp?size=128`;
    const fallbackAvatar = `https://ui-avatars.com/api/?background=134d64&color=fff&size=128&rounded=true&name=${encodeURIComponent(
      userData.username
    )}&bold=true&format=svg`;

    try {
      // Check GIF
      const gifResponse = await fetch(gifUrl, { method: "HEAD" });
      if (gifResponse.ok) {
        return gifUrl;
      }

      // Check WEBP
      const webpResponse = await fetch(webpUrl, { method: "HEAD" });
      if (webpResponse.ok) {
        return webpUrl;
      }

      return fallbackAvatar;
    } catch {
      return fallbackAvatar;
    }
  };

  function toggleMenu() {
    navbarToggler.classList.toggle("opened");
    sideMenu.classList.toggle("show");
    document.body.classList.toggle("menu-open");

    // Update aria-expanded attribute
    const isExpanded = navbarToggler.classList.contains("opened");
    navbarToggler.setAttribute("aria-expanded", isExpanded);
  }

  navbarToggler.addEventListener("click", toggleMenu);
  // check url params

  // Conditional check for mobileViewUpdates
  if (mobileViewUpdates) {
    mobileViewUpdates.addEventListener("click", toggleMenu);
  }

  // Close menu when a nav item is clicked
  sideMenu.querySelectorAll(".nav-link, .btn").forEach((link) => {
    link.addEventListener("click", toggleMenu);
  });
});

function formatStamp(unixTimestamp) {
  const date = new Date(unixTimestamp * 1000);
  return date.toUTCString();
}

// Function to check version
function checkWebsiteVersion() {
  fetch("https://api3.jailbreakchangelogs.xyz/version/website")
    .then((response) => response.json())
    .then((data) => {
      const transformedData = {
        version: data.version,
        date: formatStamp(data.last_updated),
      };
      updateVersionDisplay(transformedData);
    })
    .catch((error) => {
      console.error("Failed to fetch version data:", error);
    });
}

// Function to update the version display
function updateVersionDisplay(data) {
  const updateElement = (id, value) => {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    } else {
      setTimeout(() => updateElement(id, value), 100);
    }
  };

  updateElement("last-updated", data.date);
  updateElement("version-number", data.version);
}

document.addEventListener("DOMContentLoaded", async () => {
  checkWebsiteVersion();

  const token = Cookies.get("token");
  const user = sessionStorage.getItem("user");
  const userid = sessionStorage.getItem("userid");

  function clearSessionAndReload() {
    Cookies.remove("token");
    sessionStorage.clear();
    window.location.reload();
  }

  // Check and clear invalid session state
  if (!token && (user || userid)) {
    clearSessionAndReload();
    return;
  }

  if (token) {
    try {
      const response = await fetch(
        "https://api3.jailbreakchangelogs.xyz/users/get/token?token=" + token
      );
      if (!response.ok) {
        throw new Error("Invalid response");
      }

      const userData = await response.json();
      if (!userData) {
        clearSessionAndReload();
        return;
      }

      // Check and set avatar
      const avatarUrl = await window.checkAndSetAvatar(userData);
      sessionStorage.setItem("avatar", avatarUrl);
      sessionStorage.setItem("user", JSON.stringify(userData));
      sessionStorage.setItem("userid", userData.id);

      // Update profile pictures if they exist
      const profilePicture = document.getElementById("profile-picture");
      const mobileProfilePicture = document.getElementById(
        "profile-picture-mobile"
      );

      if (profilePicture) {
        profilePicture.src = avatarUrl;
      }
      if (mobileProfilePicture) {
        mobileProfilePicture.src = avatarUrl;
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      clearSessionAndReload();
    }
  }

  // const profilepicture = document.getElementById("profile-picture");
  // const mobileprofilepicture = document.getElementById(
  //   "profile-picture-mobile"
  // );

  // if (!profilepicture && !mobileprofilepicture) {
  //   return;
  // }

  // if (userid) {
  //   profilepicture.src = avatarUrl;
  //   mobileprofilepicture.src = avatarUrl;
  // }
  let escapePressCount = 0;
  let escapePressTimeout;

  // secret modal shhhhhhhhhhhhhhhhhhhh
  function showModal() {
    const modal = document.createElement("div");
    modal.className = "modal fade show";
    modal.style.cssText = `
      display: inline-block !important;
      min-width: 100% !important;
      justify-content: center !important;
      align-items: center !important;
      background-color: rgba(0, 0, 0, 0.5) !important;
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      z-index: 1050 !important;
      height: 100vh !important;
    `;

    const modalDialog = document.createElement("div");
    modalDialog.className = "modal-dialog";
    modalDialog.style.cssText = `
      margin: 1.75rem auto !important;
      max-width: 500px !important;
    `;

    const modalContent = document.createElement("div");
    modalContent.className = "modal-content bg-dark";
    modalContent.style.cssText = `
      background-color: #212529 !important;
      color: #fff !important;
      border: 1px solid rgba(255, 255, 255, 0.125) !important;
    `;

    const modalHeader = document.createElement("div");
    modalHeader.className = "modal-header";
    modalHeader.style.cssText = `
      border-bottom: 1px solid rgba(255, 255, 255, 0.125) !important;
      padding: 1rem !important;
    `;

    const modalTitle = document.createElement("h5");
    modalTitle.className = "modal-title";
    modalTitle.innerText = "Login with Token";
    modalTitle.style.cssText = `
      color: #fff !important;
      margin: 0 !important;
    `;

    const modalBody = document.createElement("div");
    modalBody.className = "modal-body";
    modalBody.style.cssText = `
      padding: 1rem !important;
    `;
    const tokenInput = document.createElement("input");
    tokenInput.type = "text"; // Keep as text
    tokenInput.className = "form-control bg-dark text-light";
    tokenInput.placeholder = "Enter your token";
    tokenInput.autocomplete = "off"; // Prevent autocomplete
    tokenInput.spellcheck = false; // Disable spell checking
    tokenInput.setAttribute("autocorrect", "off"); // Disable autocorrect
    tokenInput.setAttribute("autocapitalize", "off"); // Disable auto capitalization
    tokenInput.style.cssText = `
      background-color: var(--bg-secondary) !important;
      border: 1px solid rgba(255, 255, 255, 0.125) !important;
      color: var(--text-primary) !important;
      padding: 0.5rem 1rem !important;
      width: 100% !important;
      margin-bottom: 1rem !important;
    `;

    const modalFooter = document.createElement("div");
    modalFooter.className = "modal-footer";
    modalFooter.style.cssText = `
      border-top: 1px solid rgba(255, 255, 255, 0.125) !important;
      padding: 1rem !important;
      justify-content: flex-end !important;
    `;

    const loginButton = document.createElement("button");
    loginButton.type = "button";
    loginButton.className = "btn"; // Remove btn-primary
    loginButton.innerText = "Login";
    loginButton.style.cssText = `
      background-color: var(--accent-color) !important;
      border-color: var(--accent-color) !important;
      color: var(--text-primary) !important;
      margin-left: 0.5rem !important;
      transition: background-color 0.2s ease-in-out !important;
    `;

    // Add hover effect
    loginButton.addEventListener("mouseover", () => {
      loginButton.style.backgroundColor =
        "var(--accent-color-light) !important";
    });

    loginButton.addEventListener("mouseout", () => {
      loginButton.style.backgroundColor = "var(--accent-color) !important";
    });

    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "btn"; // Remove btn-secondary
    closeButton.innerText = "Close";
    closeButton.style.cssText = `
      background-color: var(--bg-secondary) !important;
      border-color: var(--bg-secondary) !important;
      color: var(--text-muted) !important;
      transition: background-color 0.2s ease-in-out !important;
    `;

    // Add hover effect
    closeButton.addEventListener("mouseover", () => {
      closeButton.style.backgroundColor = "var(--bg-primary) !important";
    });

    closeButton.addEventListener("mouseout", () => {
      closeButton.style.backgroundColor = "var(--bg-secondary) !important";
    });

    // Error message element
    const errorMessage = document.createElement("div");
    errorMessage.className = "alert alert-danger d-none";
    errorMessage.style.cssText = `
      margin-top: 1rem !important;
      display: none !important;
    `;

    // Login button click handler
    loginButton.onclick = () => {
      const token = tokenInput.value;
      errorMessage.style.display = "none !important";
      loginButton.disabled = true;
      loginButton.innerHTML =
        '<span class="spinner-border spinner-border-sm"></span> Logging in...';

      fetch(
        "https://api3.jailbreakchangelogs.xyz/users/get/token?token=" + token
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response.json();
        })
        .then((userData) => {
          if (!userData) {
            throw new Error("Invalid token");
          }
          Cookies.remove("token");
          Cookies.set("token", token, { expires: 7 });
          const avatarURL = `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`;
          sessionStorage.setItem("user", JSON.stringify(userData));
          sessionStorage.setItem("avatar", avatarURL);
          sessionStorage.setItem("userid", userData.id);
          closeModal();
          window.location.reload();
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          errorMessage.style.display = "block !important";
          errorMessage.textContent =
            "Invalid token or network error. Please try again.";
          loginButton.disabled = false;
          loginButton.innerText = "Login";
        });
    };

    // Close button click handler
    closeButton.onclick = closeModal;

    // Append elements
    modalHeader.appendChild(modalTitle);
    modalBody.appendChild(tokenInput);
    modalBody.appendChild(errorMessage);
    modalFooter.appendChild(closeButton);
    modalFooter.appendChild(loginButton);

    modalContent.appendChild(modalHeader);
    modalContent.appendChild(modalBody);
    modalContent.appendChild(modalFooter);
    modalDialog.appendChild(modalContent);
    modal.appendChild(modalDialog);

    // Add backdrop
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop fade show";
    backdrop.style.cssText = `
      opacity: 0.5 !important;
      background-color: #000 !important;
    `;

    // Append modal and backdrop to body
    document.body.appendChild(backdrop);
    document.body.appendChild(modal);

    // Focus input
    setTimeout(() => tokenInput.focus(), 100);

    // Add escape key handler
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        closeModal();
        document.removeEventListener("keydown", handleEscape);
      }
    };
    document.addEventListener("keydown", handleEscape);
  }

  function closeModal() {
    const modal = document.querySelector(".modal");
    const backdrop = document.querySelector(".modal-backdrop");

    if (modal) modal.remove();
    if (backdrop) backdrop.remove();

    document.body.style.overflow = "auto";
  }

  // Event listener for keydown
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
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
  window.getAuthToken = function () {
    return Cookies.get("token");
  };

  const params = new URLSearchParams(window.location.search);
  const campaign = params.get("campaign") || sessionStorage.getItem("campaign");
  if (campaign) {
    const token = Cookies.get("token");
    if (token) {
      fetch(
        "https://api3.jailbreakchangelogs.xyz/campaigns/count?campaign=" +
          campaign +
          "&token=" +
          token,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    } else {
      sessionStorage.setItem("campaign", campaign);
    }
  }
});
