// Wait for DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
  // Configure toastr options if available
  if (typeof toastr !== "undefined") {
    toastr.options = {
      closeButton: true,
      debug: false,
      newestOnTop: true,
      progressBar: true,
      positionClass: "toast-bottom-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };
  }
  const addServerForm = document.getElementById("addServerForm");
  if (addServerForm) {
    addServerForm.reset();
  }

  fetchServers();
});
function getAuthToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "token") {
      return decodeURIComponent(value);
    }
  }
  return null;
}

// Toast notification helper
function showToast(message, type = "info") {
  // Check if toastr is properly loaded
  if (typeof toastr === "undefined") {
    console.log(`${type}: ${message}`);
    alert(message);
    return;
  }

  try {
    switch (type) {
      case "success":
        toastr.success(message);
        break;
      case "error":
        toastr.error(message);
        break;
      case "warning":
        toastr.warning(message);
        break;
      default:
        toastr.info(message);
    }
  } catch (error) {
    console.log(`${type}: ${message}`);
    alert(message);
  }
}

// Copy link function with fallback
function copyLink(link) {
  if (!link) {
    showToast("Invalid server link", "error");
    return;
  }

  // Try using Clipboard API first
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard
      .writeText(link)
      .then(() => showToast("Server link copied to clipboard!", "success"))
      .catch(() => fallbackCopy(link));
  } else {
    fallbackCopy(link);
  }
}

// Fallback copy method
function fallbackCopy(text) {
  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    if (successful) {
      showToast("Server link copied to clipboard!", "success");
    } else {
      throw new Error("Copy command failed");
    }
  } catch (error) {
    console.error("Fallback copy failed:", error);
    showToast("Failed to copy link. Please copy manually.", "error");
  }
}

// Fetch servers from API
async function fetchServers() {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/servers/list"
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const servers = await response.json();
    const serverList = document.getElementById("serverList");
    const loading = document.getElementById("loading");

    if (loading) loading.remove();

    if (!servers || servers.length === 0) {
      serverList.innerHTML = `
        <div class="col-12 text-center">
          <p class="text-muted">No private servers available at the moment.</p>
        </div>
      `;
      return;
    }

    const serverCards = await Promise.all(
      servers.map((server) => createServerCard(server))
    );
    serverList.innerHTML = ""; // Clear existing content
    serverCards.forEach((card) => serverList.appendChild(card));
  } catch (error) {
    console.error("Error fetching servers:", error);
    const serverList = document.getElementById("serverList");
    serverList.innerHTML = `
      <div class="col-12 text-center">
        <p class="text-danger">Failed to load servers. Please try again later.</p>
      </div>
    `;
  }
}

// Fetch user information
async function fetchUserInfo(userId) {
  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${userId}`
    );
    if (!response.ok) throw new Error("Network response was not ok");

    const userData = await response.json();
    return userData.global_name || userData.username || userId;
  } catch (error) {
    console.error("Error fetching user info:", error);
    return userId;
  }
}

// server card element
async function createServerCard(server) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  const expirationDate = new Date(parseInt(server.expires) * 1000);
  const now = new Date();
  const timeLeft = expirationDate - now;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));
  const creationDate = new Date(
    parseInt(server.created_at) * 1000
  ).toLocaleDateString();
  const ownerName = await fetchUserInfo(server.owner);

  // Check if current user is the owner
  const token = getAuthToken();
  let isOwner = false;

  if (token) {
    try {
      const response = await fetch(
        `https://api3.jailbreakchangelogs.xyz/users/get/token?token=${token}`
      );
      if (response.ok) {
        const userData = await response.json();
        isOwner = userData.id === server.owner;
      }
    } catch (error) {
      console.error("Error verifying ownership:", error);
    }
  }
  const ownerActions = isOwner
    ? `
    <button class="btn btn-outline-warning btn-sm" onclick="editServer('${server.id}')">
      <i class="bi bi-pencil"></i>
    </button>
    <button class="btn btn-outline-danger btn-sm" onclick="deleteServer('${server.id}')">
      <i class="bi bi-trash"></i>
    </button>
  `
    : "";

  col.innerHTML = `
    <div class="card server-card h-100">
      <div class="card-body">
        <div class="d-flex flex-column gap-2">
          <div class="d-flex justify-content-between align-items-center">
            <div class="server-link text-truncate me-2">
              <small class="text-muted">Server #${server.id}</small>
            </div>
            <div class="d-flex gap-2">
              ${ownerActions}
              <button class="btn btn-outline-primary btn-sm copy-btn" data-link="${
                server.link
              }">
                <i class="bi bi-clipboard"></i>
              </button>
              <a href="${
                server.link
              }" target="_blank" class="btn btn-primary btn-sm">
                Join
              </a>
            </div>
          </div>
          <div class="server-info">
            <div><small>Created: ${creationDate}</small></div>
            <div><small>Expires in: ${daysLeft} days</small></div>
            <div><small>Owner: <a href="/users/${
              server.owner
            }" class="text-decoration-none">@${ownerName}</a></small></div>
            ${
              server.rules !== "N/A"
                ? `<div><small>Rules: ${server.rules}</small></div>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;

  // Add event listener for copy button
  const copyBtn = col.querySelector(".copy-btn");
  copyBtn.addEventListener("click", () => copyLink(copyBtn.dataset.link));

  return col;
}
// edit and delete server functions
async function editServer(serverId) {
  try {
    // Fetch server details first
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/servers/get?id=${serverId}`
    );
    const server = await response.json();

    if (!response.ok) {
      throw new Error(server.message || "Failed to fetch server details");
    }

    // Get the modal and form
    const modal = new bootstrap.Modal(
      document.getElementById("addServerModal")
    );
    const form = document.getElementById("addServerForm");

    // Update modal title
    document.getElementById("addServerModalLabel").textContent = "Edit Server";

    // Pre-fill the form with server details
    form.serverLink.value = server.link;
    form.serverRules.value = server.rules === "N/A" ? "" : server.rules;

    // Convert Unix timestamp to datetime-local format
    const expirationDate = new Date(parseInt(server.expires) * 1000);
    const formattedDate = expirationDate.toISOString().slice(0, 16); // Format: YYYY-MM-DDTHH:mm
    form.expiresAt.value = formattedDate;

    // Change form submission handler
    form.onsubmit = (event) => handleEditServer(event, serverId);

    // Change button text
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.textContent = "Update Server";

    modal.show();
  } catch (error) {
    console.error("Error fetching server details:", error);
    showToast(error.message || "Failed to load server details", "error");
  }
}

async function handleEditServer(event, serverId) {
  event.preventDefault();

  const token = getAuthToken();
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const spinner = submitBtn.querySelector(".spinner-border");

  submitBtn.disabled = true;
  if (spinner) spinner.classList.remove("d-none");

  try {
    const expirationDate = new Date(form.expiresAt.value);
    const formData = {
      link: form.serverLink.value,
      rules: form.serverRules.value || "N/A",
      expires: Math.floor(expirationDate.getTime() / 1000).toString(),
      token: token,
    };

    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/servers/update?id=${serverId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to update server");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addServerModal")
    );
    modal.hide();

    resetModalToAddMode(form);
    await fetchServers();
    showToast("Server updated successfully!", "success");
  } catch (error) {
    console.error("Error updating server:", error);
    showToast(error.message || "Failed to update server", "error");
  } finally {
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add("d-none");
  }
}

// Helper function to reset modal to add mode
function resetModalToAddMode(form) {
  document.getElementById("addServerModalLabel").textContent =
    "Add Private Server";
  form.reset();
  form.onsubmit = (event) => handleAddServer(event);
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.textContent = "Add Server";
}

// event listener for modal hidden event to reset form
document
  .getElementById("addServerModal")
  .addEventListener("hidden.bs.modal", (event) => {
    const form = document.getElementById("addServerForm");
    resetModalToAddMode(form);
  });

async function deleteServer(serverId) {
  const token = getAuthToken();
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  if (!confirm("Are you sure you want to delete this server?")) {
    return;
  }

  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/servers/delete?id=${serverId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: token }), // Add token to request
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Failed to delete server");
    }

    await fetchServers();
    showToast("Server deleted successfully!", "success");
  } catch (error) {
    console.error("Error deleting server:", error);
    showToast(error.message || "Failed to delete server", "error");
  }
}

// Check authentication and show modal
function checkAuthAndShowModal() {
  const userid = sessionStorage.getItem("userid");
  if (!userid) {
    sessionStorage.setItem("redirectUrl", window.location.href);
    window.location.href = "/login";
    return;
  }

  const modal = new bootstrap.Modal(document.getElementById("addServerModal"));
  document.getElementById("serverOwner").value = userid;
  modal.show();
}

// Handle server addition
async function handleAddServer(event) {
  event.preventDefault();

  const token = getAuthToken();
  if (!token) {
    showToast("Authentication required", "error");
    return;
  }

  const form = event.target;
  const submitBtn = form.querySelector('button[type="submit"]');
  const spinner = submitBtn.querySelector(".spinner-border");

  const serverLink = form.serverLink.value;
  if (!serverLink.startsWith("https://www.roblox.com/share?code=")) {
    showToast(
      "Invalid server link format. Please use a valid Roblox private server link.",
      "error"
    );
    return;
  }

  submitBtn.disabled = true;
  if (spinner) spinner.classList.remove("d-none");

  try {
    const expirationDate = new Date(form.expiresAt.value);
    const formData = {
      link: serverLink,
      owner: form.serverOwner.value,
      rules: form.serverRules.value || "N/A",
      expires: Math.floor(expirationDate.getTime() / 1000).toString(),
      token: token, // Add token to request
    };

    console.log("Request body:", formData);

    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/servers/add",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      }
    );

    const data = await response.json();
    console.log("Response data:", data);

    if (!response.ok) {
      throw new Error(data.message || "Failed to add server");
    }

    const modal = bootstrap.Modal.getInstance(
      document.getElementById("addServerModal")
    );
    modal.hide();
    form.reset();
    await fetchServers();
    showToast("Server added successfully!", "success");
  } catch (error) {
    console.error("Error adding server:", error);
    showToast(
      error.message || "Failed to add server. Please try again.",
      "error"
    );
  } finally {
    submitBtn.disabled = false;
    if (spinner) spinner.classList.add("d-none");
  }
}
