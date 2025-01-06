document.addEventListener("DOMContentLoaded", () => {
  fetchServers();
});

async function fetchServers() {
  try {
    const response = await fetch(
      "https://api3.jailbreakchangelogs.xyz/servers/list"
    );
    const servers = await response.json();

    const serverList = document.getElementById("serverList");
    const loading = document.getElementById("loading");
    loading.remove();

    if (servers.length === 0) {
      serverList.innerHTML = `
                  <div class="col-12 text-center">
                      <p class="text-muted">No private servers available at the moment.</p>
                  </div>
              `;
      return;
    }

    // Use Promise.all to handle all server cards creation in parallel
    const serverCards = await Promise.all(
      servers.map((server) => createServerCard(server))
    );
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

async function fetchUserInfo(userId) {
  try {
    const response = await fetch(
      `https://api3.jailbreakchangelogs.xyz/users/get?id=${userId}`
    );
    const userData = await response.json();
    return userData.global_name || userData.username || userId; // Fallback to ID if both are N/A
  } catch (error) {
    console.error("Error fetching user info:", error);
    return userId; // Fallback to ID if fetch fails
  }
}

async function createServerCard(server) {
  const col = document.createElement("div");
  col.className = "col-12 col-md-6 col-lg-4";

  // Calculate expiration time
  const expirationDate = new Date(parseInt(server.expires) * 1000);
  const now = new Date();
  const timeLeft = expirationDate - now;
  const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

  // Format creation date
  const creationDate = new Date(
    parseInt(server.created_at) * 1000
  ).toLocaleDateString();

  // Fetch user info
  const ownerName = await fetchUserInfo(server.owner);

  col.innerHTML = `
          <div class="card server-card h-100">
              <div class="card-body">
                  <div class="d-flex flex-column gap-2">
                      <div class="d-flex justify-content-between align-items-center">
                          <div class="server-link text-truncate me-2">
                              <small class="text-muted">Server #${
                                server.id
                              }</small>
                          </div>
                          <div class="d-flex gap-2">
                              <button class="btn btn-outline-primary btn-sm" onclick="copyLink('${
                                server.link
                              }')">
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

  return col;
}

function copyLink(link) {
  navigator.clipboard
    .writeText(link)
    .then(() => {
      // You could add a toast notification here
      alert("Server link copied to clipboard!");
    })
    .catch((err) => {
      console.error("Failed to copy text: ", err);
    });
}
